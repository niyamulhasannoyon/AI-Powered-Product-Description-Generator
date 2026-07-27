import { NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  id: 'default',
  binancePayId: '284719302',
  usdtAddress: '0x94F8672C15eF968A91a27e748A4269894e666999',
  binanceQrUrl: '',
  paymentInstructions: 'Send USDT via Binance Pay ID or USDT BEP20/TRC20 network and submit your transaction ID.',
  supportEmail: 'support@example.com',
  proPriceUsd: 19,
  businessPriceUsd: 49,
};

// GET: Public/User endpoint to read current system settings
export async function GET() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    console.error('Error fetching system settings:', err);
    return NextResponse.json(
      { success: false, settings: DEFAULT_SETTINGS, error: err.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH: Admin-only endpoint to update system settings
export async function PATCH(req: Request) {
  try {
    const { isAdmin, error } = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      binancePayId,
      usdtAddress,
      binanceQrUrl,
      paymentInstructions,
      supportEmail,
      proPriceUsd,
      businessPriceUsd,
    } = body;

    const updatedSettings = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: {
        ...(binancePayId !== undefined && { binancePayId: String(binancePayId).trim() }),
        ...(usdtAddress !== undefined && { usdtAddress: String(usdtAddress).trim() }),
        ...(binanceQrUrl !== undefined && { binanceQrUrl: String(binanceQrUrl).trim() }),
        ...(paymentInstructions !== undefined && { paymentInstructions: String(paymentInstructions).trim() }),
        ...(supportEmail !== undefined && { supportEmail: String(supportEmail).trim() }),
        ...(proPriceUsd !== undefined && { proPriceUsd: Number(proPriceUsd) || 19 }),
        ...(businessPriceUsd !== undefined && { businessPriceUsd: Number(businessPriceUsd) || 49 }),
      },
      create: {
        id: 'default',
        binancePayId: binancePayId !== undefined ? String(binancePayId).trim() : DEFAULT_SETTINGS.binancePayId,
        usdtAddress: usdtAddress !== undefined ? String(usdtAddress).trim() : DEFAULT_SETTINGS.usdtAddress,
        binanceQrUrl: binanceQrUrl !== undefined ? String(binanceQrUrl).trim() : DEFAULT_SETTINGS.binanceQrUrl,
        paymentInstructions: paymentInstructions !== undefined ? String(paymentInstructions).trim() : DEFAULT_SETTINGS.paymentInstructions,
        supportEmail: supportEmail !== undefined ? String(supportEmail).trim() : DEFAULT_SETTINGS.supportEmail,
        proPriceUsd: proPriceUsd !== undefined ? Number(proPriceUsd) || 19 : DEFAULT_SETTINGS.proPriceUsd,
        businessPriceUsd: businessPriceUsd !== undefined ? Number(businessPriceUsd) || 49 : DEFAULT_SETTINGS.businessPriceUsd,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      settings: updatedSettings,
    });
  } catch (err: any) {
    console.error('Error updating system settings:', err);
    return NextResponse.json({ error: err.message || 'Failed to update system settings' }, { status: 500 });
  }
}
