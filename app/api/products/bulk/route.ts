import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateDescription, DEFAULT_SYSTEM_PROMPT_TEMPLATE } from '@/lib/ai/generateDescription';
import { checkUsageLimit } from '@/lib/usageLimit';

export interface BulkItemInput {
  imageUrl: string;
  keywords?: string[] | string;
  language?: string;
  tone?: string;
  framework?: string;
  targetAudience?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const items: BulkItemInput[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items provided for bulk generation' }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 items allowed per bulk batch.' }, { status: 400 });
    }

    // Check usage limit
    const usage = await checkUsageLimit(userId);
    if (!usage.allowed || (usage.maxLimit !== Infinity && usage.currentUsage + items.length > usage.maxLimit)) {
      return NextResponse.json(
        {
          error: `Bulk generation would exceed your plan limit of ${usage.maxLimit} descriptions per month.`,
          limitExceeded: true,
          currentUsage: usage.currentUsage,
          maxLimit: usage.maxLimit,
        },
        { status: 402 }
      );
    }

    // Create BulkJob entry
    const job = await prisma.bulkJob.create({
      data: {
        userId: user.id,
        status: 'PROCESSING',
        totalCount: items.length,
        processedCount: 0,
      },
    });

    const createdProducts: any[] = [];
    let failedCount = 0;

    for (const item of items) {
      if (!item.imageUrl || typeof item.imageUrl !== 'string') {
        failedCount++;
        continue;
      }

      let keywordsArray: string[] = [];
      if (Array.isArray(item.keywords)) {
        keywordsArray = item.keywords.map((k) => String(k).trim()).filter(Boolean);
      } else if (typeof item.keywords === 'string') {
        keywordsArray = item.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      }
      keywordsArray = keywordsArray.slice(0, 3);

      const lang = item.language || user.defaultLanguage || 'English';
      const tone = item.tone || user.defaultTone || 'Professional';
      const framework = item.framework || user.defaultFramework || 'AIDA';
      const targetAudience = item.targetAudience || user.targetAudience || 'General Shoppers';

      try {
        const aiResult = await generateDescription({
          imageUrl: item.imageUrl,
          keywords: keywordsArray,
          language: lang,
          tone: tone,
          framework: framework,
          targetAudience: targetAudience,
          brandVoice: user.brandVoice || 'Standard',
          systemPromptTemplate: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
        });

        const product = await prisma.product.create({
          data: {
            userId: user.id,
            imageUrl: item.imageUrl,
            keywords: keywordsArray,
            language: lang,
            copywritingFramework: framework,
            bulletFeatures: aiResult.bulletFeatures,
            socialHook: aiResult.socialHook,
            targetAudience: targetAudience,
            generatedTitle: aiResult.title,
            generatedDescription: aiResult.description,
            generatedTags: aiResult.tags,
            seoMetaTitle: aiResult.seoMetaTitle,
            seoMetaDescription: aiResult.seoMetaDescription,
            keywordDensityScore: aiResult.keywordDensityScore,
          },
        });

        await prisma.usageLog.create({
          data: {
            userId: user.id,
            action: 'generate',
            tokensUsed: aiResult.tokensUsed,
          },
        });

        createdProducts.push(product);
      } catch (err) {
        console.error('Failed generating item in bulk job:', err);
        failedCount++;
      }

      // Update progress
      await prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          processedCount: { increment: 1 },
        },
      });
    }

    // Finalize BulkJob status
    await prisma.bulkJob.update({
      where: { id: job.id },
      data: {
        status: createdProducts.length > 0 ? 'COMPLETED' : 'FAILED',
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      totalCount: items.length,
      successCount: createdProducts.length,
      failedCount,
      products: createdProducts,
    });
  } catch (error: any) {
    console.error('Error processing bulk generation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process bulk generation' },
      { status: 500 }
    );
  }
}
