import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        defaultTone: true,
        defaultLanguage: true,
        brandVoice: true,
        targetAudience: true,
        defaultFramework: true,
      },
    });

    return NextResponse.json(user || {});
  } catch (error: any) {
    console.error('Error fetching user preset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preset' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { defaultTone, defaultLanguage, brandVoice, targetAudience, defaultFramework } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(defaultTone !== undefined && { defaultTone }),
        ...(defaultLanguage !== undefined && { defaultLanguage }),
        ...(brandVoice !== undefined && { brandVoice }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(defaultFramework !== undefined && { defaultFramework }),
      },
      select: {
        defaultTone: true,
        defaultLanguage: true,
        brandVoice: true,
        targetAudience: true,
        defaultFramework: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user preset:', error);
    return NextResponse.json(
      { error: 'Failed to update user preset' },
      { status: 500 }
    );
  }
}
