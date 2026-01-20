import { NextResponse } from 'next/server';
import { getErrorUserId, setErrorUserId, parseErrorUserId } from '../../../../../../../lib/feed-settings-db.js';
import { withPanelAuth } from '../../../../../../../lib/api-auth.js';

export async function GET(request) {
  const authResult = await withPanelAuth(request, ['leader']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const id = await getErrorUserId();
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: 'failed to get' }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await withPanelAuth(request, ['leader']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const raw = body?.id ?? body?.url ?? '';
    const parsed = parseErrorUserId(String(raw ?? ''));
    if (!parsed) return NextResponse.json({ error: 'Invalid user id or url' }, { status: 400 });
    const id = await setErrorUserId(parsed);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: 'failed to set' }, { status: 500 });
  }
}
