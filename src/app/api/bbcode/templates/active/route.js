import { NextResponse } from 'next/server';
import { getActiveTemplate, setActiveTemplate } from '../../../../../../lib/bbcode-templates-db.js';
import { withPanelAuth } from '../../../../../../lib/api-auth.js';

// GET /api/bbcode/templates/active - get current active template (full)
export async function GET(request) {
  // Allow public read access to active template for feed generator
  // No authentication required for this endpoint
  try {
    const tpl = await getActiveTemplate('feed');
    return NextResponse.json(tpl || null);
  } catch (error) {
    console.error('[bbcode-templates/active][GET]', error);
    return NextResponse.json({ error: 'Failed to fetch active template' }, { status: 500 });
  }
}

// POST /api/bbcode/templates/active - set active template
export async function POST(request) {
  const authResult = await withPanelAuth(request, ['feed']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const ok = await setActiveTemplate(id, 'feed');
    if (!ok) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[bbcode-templates/active][POST]', error);
    return NextResponse.json({ error: 'Failed to set active template' }, { status: 500 });
  }
}