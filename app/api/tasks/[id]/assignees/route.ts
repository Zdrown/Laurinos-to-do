import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { person_ids } = await req.json();
  const id = Number(params.id);

  await supabase.from('task_assignees').delete().eq('task_id', id);

  if (person_ids.length > 0) {
    const rows = person_ids.map((pid: number) => ({ task_id: id, person_id: pid }));
    const { error } = await supabase.from('task_assignees').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
