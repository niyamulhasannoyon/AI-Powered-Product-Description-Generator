import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    const body = await req.json();
    const { generatedTitle, generatedDescription, language, generatedTags } = body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(generatedTitle !== undefined && { generatedTitle }),
        ...(generatedDescription !== undefined && { generatedDescription }),
        ...(language !== undefined && { language }),
        ...(generatedTags !== undefined && { generatedTags }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
