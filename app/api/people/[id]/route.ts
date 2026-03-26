import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('people').delete().eq('id', Number(params.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
