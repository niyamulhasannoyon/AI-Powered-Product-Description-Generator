import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  generateDescription,
  DEFAULT_SYSTEM_PROMPT_TEMPLATE,
} from '@/lib/ai/generateDescription';
import { checkUsageLimit } from '@/lib/usageLimit';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security Rate Limiting (max 20 requests per minute per user)
    const rateLimitResponse = enforceRateLimit(req, {
      limit: 20,
      windowMs: 60 * 1000,
      identifier: userId,
    });
    if (rateLimitResponse) return rateLimitResponse;

    // Check usage limit before processing generation
    const usage = await checkUsageLimit(userId);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: usage.error || 'Plan generation limit reached.',
          limitExceeded: true,
          currentUsage: usage.currentUsage,
          maxLimit: usage.maxLimit,
          plan: usage.plan,
        },
        { status: 402 } // Payment Required
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      imageUrl,
      keywords,
      language,
      tone,
      framework = user.defaultFramework || 'AIDA',
      targetAudience = user.targetAudience || 'General Shoppers',
      brandVoice = user.brandVoice || 'Standard',
      promptTemplateId,
    } = body;

    // Validate required fields
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    if (!language || typeof language !== 'string') {
      return NextResponse.json({ error: 'Target language is required' }, { status: 400 });
    }
    if (!tone || typeof tone !== 'string') {
      return NextResponse.json({ error: 'Tone is required' }, { status: 400 });
    }

    // Process & enforce max 3 keywords
    let keywordsArray: string[] = [];
    if (Array.isArray(keywords)) {
      keywordsArray = keywords.map((k) => String(k).trim()).filter(Boolean);
    } else if (typeof keywords === 'string') {
      keywordsArray = keywords.split(',').map((k) => k.trim()).filter(Boolean);
    }
    if (keywordsArray.length > 3) {
      keywordsArray = keywordsArray.slice(0, 3);
    }

    // Determine System Prompt Template
    let templateText = DEFAULT_SYSTEM_PROMPT_TEMPLATE;
    let selectedTemplateId: string | null = null;

    if (promptTemplateId && typeof promptTemplateId === 'string') {
      const template = await prisma.promptTemplate.findUnique({
        where: { id: promptTemplateId },
      });
      if (template && (template.userId === user.id || template.isDefault)) {
        templateText = template.templateText;
        selectedTemplateId = template.id;
      }
    } else {
      // Check user's default template if any
      const defaultTemplate = await prisma.promptTemplate.findFirst({
        where: { userId: user.id, isDefault: true },
      });
      if (defaultTemplate) {
        templateText = defaultTemplate.templateText;
        selectedTemplateId = defaultTemplate.id;
      }
    }

    // Call abstracted AI generation function
    const aiResult = await generateDescription({
      imageUrl,
      keywords: keywordsArray,
      language,
      tone,
      framework,
      targetAudience,
      brandVoice,
      systemPromptTemplate: templateText,
    });

    // Save new Product row in DB with extended structured fields
    const product = await prisma.product.create({
      data: {
        userId: user.id,
        imageUrl,
        keywords: keywordsArray,
        language,
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
        promptTemplateId: selectedTemplateId,
      },
    });

    // Log UsageLog entry
    await prisma.usageLog.create({
      data: {
        userId: user.id,
        action: 'generate',
        tokensUsed: aiResult.tokensUsed,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error generating product description:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate product description' },
      { status: 500 }
    );
  }
}
