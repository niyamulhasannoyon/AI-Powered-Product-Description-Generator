import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

function formatBodyHtml(description: string | null | undefined, bullets?: string[]): string {
  if (!description && (!bullets || bullets.length === 0)) return '<p></p>';
  let html = '';
  if (bullets && bullets.length > 0) {
    html += '<ul>' + bullets.map((b) => `<li>${b}</li>`).join('') + '</ul>';
  }
  if (description && description.trim()) {
    const paragraphs = description
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    html += paragraphs.map((p) => `<p>${p}</p>`).join('');
  }
  return html;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      const title = product.generatedTitle || 'Product Title';

      return {
        Type: 'simple',
        SKU: `PROD-${product.id.slice(-6).toUpperCase()}`,
        Name: title,
        Published: 1,
        'Is featured?': 0,
        'Visibility in catalog': 'visible',
        'Short description': product.socialHook || product.seoMetaDescription || title,
        Description: formatBodyHtml(product.generatedDescription, product.bulletFeatures),
        Images: product.imageUrl || '',
        Tags: Array.isArray(product.generatedTags) ? product.generatedTags.join(', ') : '',
      };
    });

    const csv = Papa.unparse(data, {
      columns: [
        'Type',
        'SKU',
        'Name',
        'Published',
        'Is featured?',
        'Visibility in catalog',
        'Short description',
        'Description',
        'Images',
        'Tags',
      ],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="woocommerce_export.csv"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting WooCommerce CSV:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to export WooCommerce CSV' },
      { status: 500 }
    );
  }
}
