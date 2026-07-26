import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    const { plan, amount, binanceId, transactionId, note } = await req.json();

    if (!plan || !amount || !binanceId || !transactionId) {
      return NextResponse.json(
        { error: 'Plan, amount, Binance ID and Order/TxID are required.' },
        { status: 400 }
      );
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId,
        plan: String(plan).toLowerCase(),
        amount: parseFloat(amount),
        binanceId: String(binanceId).trim(),
        transactionId: String(transactionId).trim(),
        note: note ? String(note).trim() : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, paymentRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting payment request:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    const requests = await prisma.paymentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Error fetching payment requests:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
