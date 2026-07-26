import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  DEFAULT_SYSTEM_PROMPT_TEMPLATE,
  validatePromptTemplate,
} from '@/lib/ai/generateDescription';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.promptTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      templates,
      systemDefault: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
    });
  } catch (error: any) {
    console.error('Error fetching prompt templates:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch prompt templates' },
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
    const { name, templateText, isDefault } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    if (!templateText || typeof templateText !== 'string' || !templateText.trim()) {
      return NextResponse.json({ error: 'Template text is required' }, { status: 400 });
    }

    // If marked as default, unmark other templates for this user
    if (isDefault) {
      await prisma.promptTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newTemplate = await prisma.promptTemplate.create({
      data: {
        userId,
        name: name.trim(),
        templateText: templateText.trim(),
        isDefault: Boolean(isDefault),
      },
    });

    const validation = validatePromptTemplate(newTemplate.templateText);

    return NextResponse.json(
      {
        template: newTemplate,
        validation,
        warning: validation.isValid
          ? null
          : `Warning: Template is missing required JSON output instructions for: ${validation.missingKeys.join(', ')}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating prompt template:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create prompt template' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, templateText, isDefault } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    if (!templateText || typeof templateText !== 'string' || !templateText.trim()) {
      return NextResponse.json({ error: 'Template text is required' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Prompt template not found' }, { status: 404 });
    }

    // If marked as default, unmark other templates for this user
    if (isDefault) {
      await prisma.promptTemplate.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updatedTemplate = await prisma.promptTemplate.update({
      where: { id },
      data: {
        name: name.trim(),
        templateText: templateText.trim(),
        isDefault: Boolean(isDefault),
      },
    });

    const validation = validatePromptTemplate(updatedTemplate.templateText);

    return NextResponse.json({
      template: updatedTemplate,
      validation,
      warning: validation.isValid
        ? null
        : `Warning: Template is missing required JSON output instructions for: ${validation.missingKeys.join(', ')}`,
    });
  } catch (error: any) {
    console.error('Error updating prompt template:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update prompt template' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!session?.user || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let id = req.nextUrl.searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (e) {
        // body might be empty if query params were used
      }
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const existing = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Prompt template not found' }, { status: 404 });
    }

    await prisma.promptTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting prompt template:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete prompt template' },
      { status: 500 }
    );
  }
}
