import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import Papa from 'papaparse';

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
    product: {
      findMany: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { GET as getCsvExport } from '@/app/api/export/csv/route';
import { GET as getShopifyExport } from '@/app/api/export/shopify/route';

describe('CSV & Shopify Export Column Correctness Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Standard CSV Export (/api/export/csv)', () => {
    it('returns 401 Unauthorized when session is missing', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/export/csv');
      const res = await getCsvExport(req);
      expect(res.status).toBe(401);
    });

    it('exports CSV with correct columns and data formatting', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-123' },
      });

      const mockProducts = [
        {
          id: 'prod-1',
          generatedTitle: 'Ergonomic Desk Chair',
          generatedDescription: 'Comfortable chair designed for long working hours.',
          generatedTags: ['office', 'chair', 'ergonomic'],
          language: 'English',
          createdAt: new Date('2026-07-27T00:00:00.000Z'),
        },
        {
          id: 'prod-2',
          generatedTitle: 'Wireless Mechanical Keyboard',
          generatedDescription: 'RGB mechanical keyboard with hot-swappable switches.',
          generatedTags: ['tech', 'keyboard'],
          language: 'Spanish',
          createdAt: new Date('2026-07-26T12:00:00.000Z'),
        },
      ];

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const req = new NextRequest('http://localhost/api/export/csv');
      const res = await getCsvExport(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/csv');
      expect(res.headers.get('Content-Disposition')).toContain('products_export.csv');

      const csvContent = await res.text();
      const parsed = Papa.parse(csvContent, { header: true });

      // Verify exact columns expected in standard export
      const expectedColumns = ['Title', 'Description', 'Tags', 'Language', 'CreatedAt'];
      expect(parsed.meta.fields).toEqual(expectedColumns);

      // Verify first row content & formatting
      const row1 = parsed.data[0] as any;
      expect(row1.Title).toBe('Ergonomic Desk Chair');
      expect(row1.Description).toBe('Comfortable chair designed for long working hours.');
      expect(row1.Tags).toBe('office, chair, ergonomic');
      expect(row1.Language).toBe('English');
      expect(row1.CreatedAt).toBe('2026-07-27T00:00:00.000Z');
    });
  });

  describe('Shopify CSV Export (/api/export/shopify)', () => {
    it('returns 403 Forbidden when user is not on Business plan', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-123' },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        plan: 'pro',
      });

      const req = new NextRequest('http://localhost/api/export/shopify');
      const res = await getShopifyExport(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.upgradeRequired).toBe(true);
      expect(data.error).toContain('Business plan');
    });

    it('exports Shopify CSV with exact required Shopify columns & HTML body formatting for Business plan users', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-biz' },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        plan: 'business',
      });

      const mockProducts = [
        {
          id: 'prod-shopify-1',
          generatedTitle: 'Wireless Noise Canceling Headphones!',
          generatedDescription: 'Experience pure audio clarity.\nBlock out noisy environments seamlessly.',
          generatedTags: ['audio', 'wireless', 'headphones'],
          imageUrl: 'https://example.com/headphones.jpg',
          createdAt: new Date('2026-07-27T00:00:00.000Z'),
        },
      ];

      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const req = new NextRequest('http://localhost/api/export/shopify');
      const res = await getShopifyExport(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Disposition')).toContain('shopify_export.csv');

      const csvContent = await res.text();
      const parsed = Papa.parse(csvContent, { header: true });

      // Verify exact Shopify CSV columns
      const expectedShopifyColumns = [
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
      ];
      expect(parsed.meta.fields).toEqual(expectedShopifyColumns);

      // Verify row formatting
      const row = parsed.data[0] as any;
      expect(row.Handle).toBe('wireless-noise-canceling-headphones');
      expect(row.Title).toBe('Wireless Noise Canceling Headphones!');
      expect(row['Body (HTML)']).toBe(
        '<p>Experience pure audio clarity.</p><p>Block out noisy environments seamlessly.</p>'
      );
      expect(row.Tags).toBe('audio, wireless, headphones');
      expect(row.Published).toBe('TRUE');
      expect(row['Option1 Name']).toBe('Title');
      expect(row['Option1 Value']).toBe('Default Title');
      expect(row['Image Src']).toBe('https://example.com/headphones.jpg');
    });
  });
});
