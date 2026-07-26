import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';


function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function formatBodyHtml(description: string | null | undefined): string {
  if (!description || !description.trim()) return '<p></p>';
  const paragraphs = description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return '<p></p>';
  return paragraphs.map((p) => `<p>${p}</p>`).join('');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Enforce Business plan requirement for Shopify export
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user || (user.plan || 'free').toLowerCase() !== 'business') {
      return NextResponse.json(
        {
          error: 'Shopify export is exclusive to the Business plan. Please upgrade your subscription to unlock Shopify export.',
          upgradeRequired: true,
        },
        { status: 403 } // Forbidden
      );
    }

    const { searchParams } = req.nextUrl;
    const idsParam = searchParams.get('ids');
    const idsArray = idsParam
      ? idsParam.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

    const whereClause: any = { userId };
    if (idsArray.length > 0) {
      whereClause.id = { in: idsArray };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const data = products.map((product) => {
      const title = product.generatedTitle || '';
      const handle = slugify(title) || `product-${product.id}`;

      return {
        Handle: handle,
        Title: title,
        'Body (HTML)': formatBodyHtml(product.generatedDescription),
        Vendor: '',
        Type: '',
        Tags: Array.isArray(product.generatedTags) ? product.generatedTags.join(', ') : '',
        Published: 'TRUE',
        'Option1 Name': 'Title',
        'Option1 Value': 'Default Title',
        'Variant Price': '',
        'Image Src': product.imageUrl || '',
      };
    });

    const csv = Papa.unparse(data, {
      columns: [
        'Handle',
        'Title',
        'Body (HTML)',
        'Vendor',
        'Type',
        'Tags',
        'Published',
        'Option1 Name',
        'Option1 Value',
        'Variant Price',
        'Image Src',
      ],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="shopify_export.csv"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting Shopify CSV:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to export Shopify CSV' },
      { status: 500 }
    );
  }
}
