import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';


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

    const data = products.map((product) => ({
      Title: product.generatedTitle || '',
      Description: product.generatedDescription || '',
      Tags: Array.isArray(product.generatedTags) ? product.generatedTags.join(', ') : '',
      Language: product.language || '',
      CreatedAt: product.createdAt ? product.createdAt.toISOString() : '',
    }));

    const csv = Papa.unparse(data, {
      columns: ['Title', 'Description', 'Tags', 'Language', 'CreatedAt'],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="products_export.csv"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
