import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mocks
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    promptTemplate: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    product: {
      create: vi.fn(),
    },
    usageLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/usageLimit', () => ({
  checkUsageLimit: vi.fn(),
}));

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { checkUsageLimit } from '@/lib/usageLimit';
import { POST } from '@/app/api/products/generate/route';
import {
  generateDescription,
  buildSystemPrompt,
  validatePromptTemplate,
} from '@/lib/ai/generateDescription';
import OpenAI from 'openai';

describe('/api/products/generate & AI generation suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  describe('Prompt Helper Utilities', () => {
    it('validates template with required keys', () => {
      const validTemplate =
        'Write title, description, tags, and seoMetaDescription for product.';
      expect(validatePromptTemplate(validTemplate).isValid).toBe(true);

      const invalidTemplate = 'Write product copy for shoes.';
      const res = validatePromptTemplate(invalidTemplate);
      expect(res.isValid).toBe(false);
      expect(res.missingKeys).toContain('title');
    });

    it('builds system prompt with placeholder replacement', () => {
      const template = 'Language: {{language}}, Tone: {{tone}}, Keywords: {{keywords}}';
      const prompt = buildSystemPrompt(template, ['eco', 'durable'], 'English', 'Professional');
      expect(prompt).toBe('Language: English, Tone: Professional, Keywords: eco, durable');
    });
  });

  describe('generateDescription (OpenAI Mocking & JSON Parsing)', () => {
    it('successfully parses valid JSON response from OpenAI API', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Eco Leather Jacket',
                description: 'A stylish and sustainable faux-leather jacket built to last.',
                tags: ['jacket', 'eco-friendly', 'fashion'],
                seoMetaDescription: 'Buy eco-friendly leather jacket with premium quality.',
              }),
            },
          },
        ],
        usage: { total_tokens: 350 },
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const result = await generateDescription({
        imageUrl: 'https://example.com/jacket.jpg',
        keywords: ['jacket', 'leather'],
        language: 'English',
        tone: 'Professional',
      });

      expect(result.title).toBe('Eco Leather Jacket');
      expect(result.description).toContain('sustainable faux-leather');
      expect(result.tags).toEqual(['jacket', 'eco-friendly', 'fashion']);
      expect(result.seoMetaDescription).toContain('Buy eco-friendly');
      expect(result.tokensUsed).toBe(350);
    });

    it('strips markdown fences and parses JSON response', async () => {
      const mockContent = "```json\n" + JSON.stringify({
        title: 'Canvas Backpack',
        description: 'Durable canvas backpack suitable for travel.',
        tags: ['backpack', 'travel'],
        seoMetaDescription: 'Durable canvas backpack for all travels.',
      }) + "\n```";

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: mockContent } }],
        usage: { total_tokens: 220 },
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const result = await generateDescription({
        imageUrl: 'https://example.com/bag.jpg',
        keywords: ['bag'],
        language: 'English',
        tone: 'Casual',
      });

      expect(result.title).toBe('Canvas Backpack');
      expect(result.tags).toEqual(['backpack', 'travel']);
    });

    it('throws error when JSON response is missing required fields', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Incomplete Response',
                // missing description, tags, seoMetaDescription
              }),
            },
          },
        ],
        usage: { total_tokens: 100 },
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      await expect(
        generateDescription({
          imageUrl: 'https://example.com/img.jpg',
          keywords: [],
          language: 'English',
          tone: 'Friendly',
        })
      ).rejects.toThrow(/AI generation failed/);
    });
  });

  describe('POST /api/products/generate Usage Limits & API Handlers', () => {
    it('returns 401 Unauthorized when session is missing', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/products/generate', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: 'https://example.com/img.jpg', language: 'en', tone: 'luxury' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('enforces usage limit and returns 402 Payment Required when limit is reached', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-123', email: 'free@example.com' },
      });

      (checkUsageLimit as any).mockResolvedValue({
        allowed: false,
        currentUsage: 10,
        maxLimit: 10,
        plan: 'free',
        error: 'Monthly generation limit reached (10/10 used this month). Please upgrade your subscription plan to continue.',
      });

      const req = new NextRequest('http://localhost/api/products/generate', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: 'https://example.com/shoe.jpg',
          language: 'English',
          tone: 'Luxury',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(402);
      const data = await res.json();
      expect(data.limitExceeded).toBe(true);
      expect(data.currentUsage).toBe(10);
      expect(data.maxLimit).toBe(10);
      expect(data.plan).toBe('free');
      expect(data.error).toContain('limit reached');
    });

    it('processes product generation when user is authenticated and within usage limit', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-456', email: 'pro@example.com' },
      });

      (checkUsageLimit as any).mockResolvedValue({
        allowed: true,
        currentUsage: 5,
        maxLimit: 300,
        plan: 'pro',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-456',
        email: 'pro@example.com',
        plan: 'pro',
      });

      (prisma.product.create as any).mockResolvedValue({
        id: 'prod-789',
        userId: 'user-456',
        imageUrl: 'https://example.com/watch.jpg',
        keywords: ['watch', 'luxury'],
        language: 'English',
        generatedTitle: 'Smart Luxury Watch',
        generatedDescription: 'Elegant smart watch crafted with precision.',
        generatedTags: ['watch', 'luxury', 'smartwatch'],
        promptTemplateId: null,
      });

      (prisma.usageLog.create as any).mockResolvedValue({
        id: 'log-1',
        userId: 'user-456',
        action: 'generate',
      });

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Smart Luxury Watch',
                description: 'Elegant smart watch crafted with precision.',
                tags: ['watch', 'luxury', 'smartwatch'],
                seoMetaDescription: 'Premium smart watch with luxury features.',
              }),
            },
          },
        ],
        usage: { total_tokens: 300 },
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const req = new NextRequest('http://localhost/api/products/generate', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: 'https://example.com/watch.jpg',
          keywords: ['watch', 'luxury'],
          language: 'English',
          tone: 'Luxury',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const product = await res.json();
      expect(product.id).toBe('prod-789');
      expect(product.generatedTitle).toBe('Smart Luxury Watch');
      expect(prisma.product.create).toHaveBeenCalled();
      expect(prisma.usageLog.create).toHaveBeenCalled();
    });

    it('returns 400 Bad Request when required input fields are missing', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-123' },
      });

      (checkUsageLimit as any).mockResolvedValue({
        allowed: true,
        currentUsage: 0,
        maxLimit: 10,
        plan: 'free',
      });

      (prisma.user.findUnique as any).mockResolvedValue({ id: 'user-123' });

      const req = new NextRequest('http://localhost/api/products/generate', {
        method: 'POST',
        body: JSON.stringify({
          // missing imageUrl
          language: 'English',
          tone: 'Friendly',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Image URL is required');
    });

    it('successfully generates description using Mistral AI provider', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Mistral Leather Bag',
                description: 'High quality handcrafted leather bag made with elegance.',
                tags: ['leather', 'bag', 'handcrafted', 'style'],
                seoMetaDescription: 'Shop handcrafted leather bag.',
              }),
            },
          },
        ],
        usage: { total_tokens: 250 },
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const result = await generateDescription({
        imageUrl: 'https://example.com/bag.jpg',
        keywords: ['bag', 'leather'],
        language: 'English',
        tone: 'Elegant',
      });

      expect(result.title).toBe('Mistral Leather Bag');
      expect(result.tokensUsed).toBe(250);
    });

    it('successfully parses nested or alternative key format in AI response', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                response: {
                  product_title: 'Nested Smart Polo Shirt',
                  product_description: 'Stylish polo shirt perfect for everyday wear.',
                  seo_tags: ['polo', 'fashion', 'shirt'],
                  seo_meta_description: 'Buy premium polo shirt online.',
                },
              }),
            },
          },
        ],
        usage: { total_tokens: 180 },
      });

      (OpenAI as any).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const result = await generateDescription({
        imageUrl: 'https://example.com/polo.jpg',
        keywords: ['polo', 'shirt'],
        language: 'English',
        tone: 'Professional',
      });

      expect(result.title).toBe('Nested Smart Polo Shirt');
      expect(result.description).toBe('Stylish polo shirt perfect for everyday wear.');
      expect(result.tags).toEqual(['polo', 'fashion', 'shirt']);
      expect(result.seoMetaDescription).toBe('Buy premium polo shirt online.');
    });
  });
});
