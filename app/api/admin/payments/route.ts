import { NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminSession();

    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const requests = await prisma.paymentRequest.findMany({
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
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { isAdmin, error } = await checkAdminSession();

    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { requestId, status, note } = await req.json();

    if (!requestId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Valid requestId and status (APPROVED/REJECTED) are required.' }, { status: 400 });
    }

    const payment = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    }

    const updatedPayment = await prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(note !== undefined ? { note } : {}),
      },
    });

    // If approved, update user's plan in DB
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan },
      });
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
