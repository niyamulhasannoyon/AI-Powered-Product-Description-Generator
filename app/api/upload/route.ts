import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Sanitize process.env.CLOUDINARY_URL BEFORE Cloudinary is loaded.
// Note: We use require() below so Webpack does not hoist the import above this sanitization logic.
if (process.env.CLOUDINARY_URL) {
  const cleanedUrl = process.env.CLOUDINARY_URL.replace(/^["']|["']$/g, '').trim();
  if (cleanedUrl.startsWith('cloudinary://')) {
    process.env.CLOUDINARY_URL = cleanedUrl;
  } else {
    delete process.env.CLOUDINARY_URL;
  }
}

// Require Cloudinary after sanitizing process.env.CLOUDINARY_URL
const cloudinary = require('cloudinary').v2;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('image')) as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
    const hasExplicitKeys = Boolean(
      cloudName &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

    const isCloudinaryConfigured = hasCloudinaryUrl || hasExplicitKeys;

    if (isCloudinaryConfigured) {
      if (hasExplicitKeys && !hasCloudinaryUrl) {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });
      }

      // Upload stream to Cloudinary
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'ai_products',
            resource_type: 'image',
          },
          (error: any, result: any) => {
            if (error || !result) {
              return reject(error || new Error('Upload to Cloudinary failed'));
            }
            resolve({ secure_url: result.secure_url });
          }
        );
        stream.end(buffer);
      });

      return NextResponse.json({
        url: uploadResult.secure_url,
        secure_url: uploadResult.secure_url,
      });
    } else {
      // Fallback for local development if Cloudinary credentials are not set in .env
      const base64Image = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64Image}`;
      return NextResponse.json({
        url: dataUrl,
        secure_url: dataUrl,
        warning: 'Uploaded as Data URL (Cloudinary env vars not set)',
      });
    }
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
