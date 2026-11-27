import { NextResponse } from 'next/server';
import { z } from 'zod';

export const CORE_WEB_VITALS = ['CLS', 'FID', 'INP', 'LCP'] as const;

export const webVitalSchema = z.object({
  name: z.enum(CORE_WEB_VITALS),
  value: z.number().finite(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  path: z.string().optional(),
  timestamp: z.number().finite().optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  console.info('[Analytics Stub]', payload);
  return NextResponse.json({ ok: true, received: payload }, { status: 202 });
}
