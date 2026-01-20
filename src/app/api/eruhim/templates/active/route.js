import { NextResponse } from 'next/server';
import { getActiveTemplate, setActiveTemplate } from '../../../../../../lib/bbcode-templates-db.js';
import { withPanelAuth } from '../../../../../../lib/api-auth.js';

// GET /api/interview/templates/active - get current active interview template (full)
export async function GET(request) {
  // Allow public read access to active template for interview generator
  // No authentication required for this endpoint
  try {
    const tpl = await getActiveTemplate('eruhim_interviews');
    return NextResponse.json(tpl || null);
  } catch (error) {
    console.error('[interview-templates/active][GET]', error);
    return NextResponse.json({ error: 'Failed to fetch active template' }, { status: 500 });
  }
}

// POST /api/interview/templates/active - set active interview template
export async function POST(request) {
  const authResult = await withPanelAuth(request, ['eruhim']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const ok = await setActiveTemplate(id, 'eruhim_interviews');
    if (!ok) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[interview-templates/active][POST]', error);
    return NextResponse.json({ error: 'Failed to set active template' }, { status: 500 });
  }
}