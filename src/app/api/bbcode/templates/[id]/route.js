import { NextResponse } from 'next/server';
import { getTemplate, updateTemplate, deleteTemplate } from '../../../../../../lib/bbcode-templates-db.js';

// GET /api/bbcode/templates/[id] - get one template (full)
export async function GET(_request, { params }) {
  try {
    const id = Number(await params?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const tpl = await getTemplate(id);
    if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(tpl);
  } catch (error) {
    console.error('[bbcode-templates/:id][GET]', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/bbcode/templates/[id] - update name/content
export async function PUT(request, { params }) {
  try {
    const id = Number(await params?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const content = String(body?.content || '');

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const updated = await updateTemplate(id, name, content);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 409 });
    }
    console.error('[bbcode-templates/:id][PUT]', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/bbcode/templates/[id]
export async function DELETE(_request, { params }) {
  try {
    const id = Number(await params?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const ok = await deleteTemplate(id);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error && error.message === 'Cannot delete active template') {
      return NextResponse.json({ error: 'Cannot delete active template' }, { status: 400 });
    }
    console.error('[bbcode-templates/:id][DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}