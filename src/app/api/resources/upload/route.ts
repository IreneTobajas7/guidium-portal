import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Upload a file to Supabase Storage
export async function POST(req: NextRequest) {
  try {
    console.log('API: POST /api/resources/upload called');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('API: Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Generate a unique filename to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });
    
    if (uploadError) {
      console.error('API: Error uploading file to storage:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    console.log('API: File uploaded successfully:', uploadData.path);
    
    // Return the file path for storage in the database
    return NextResponse.json({ 
      file_path: uploadData.path,
      message: 'File uploaded successfully' 
    });
    
  } catch (error) {
    console.error('API: Error in file upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 