import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List all resources
export async function GET(req: NextRequest) {
  console.log('API: GET /api/resources called');
  
  const { data, error } = await supabase
    .schema('api')
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('API: Supabase response - data:', data, 'error:', error);

  if (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  console.log('API: Returning resources:', data || []);
  return NextResponse.json(data || []);
}

// POST: Create a new resource
export async function POST(req: NextRequest) {
  try {
    console.log('API: POST /api/resources called');
    const body = await req.json();
    console.log('API: Creating resource with body:', body);
    
    const { data, error } = await supabase
      .schema('api')
      .from('resources')
      .insert([body])
      .select();

    console.log('API: Supabase insert response - data:', data, 'error:', error);

    if (error) {
      console.error('API: Error creating resource:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('API: Resource created successfully:', data[0]);
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('API: Error in POST /api/resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 