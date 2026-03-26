import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const updates: Record<string, unknown> = {};

  for (const key of ['title', 'category', 'description', 'due_date', 'priority', 'status']) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 });

  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('tasks').delete().eq('id', Number(params.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
