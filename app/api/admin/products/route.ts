import { NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { isAdmin, error } = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.trim() || '';

    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { generatedTitle: { contains: query, mode: 'insensitive' } },
        { generatedDescription: { contains: query, mode: 'insensitive' } },
        { targetAudience: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    console.error('Error fetching admin products:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { isAdmin, error } = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
