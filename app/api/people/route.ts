import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  const { data, error } = await supabase.from('people').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { name, color } = await req.json();
  const { data, error } = await supabase
    .from('people')
    .insert({ name, color: color || '#e8c547' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Name must be unique' }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
