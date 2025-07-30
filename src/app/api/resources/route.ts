import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List all resources
export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .schema('api')
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

// POST: Create a new resource
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Creating resource:', body);
    
    const { data, error } = await supabase
      .schema('api')
      .from('resources')
      .insert([body])
      .select();

    if (error) {
      console.error('Error creating resource:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Resource created successfully:', data[0]);
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error in POST /api/resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 