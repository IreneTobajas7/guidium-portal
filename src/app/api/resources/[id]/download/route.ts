import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Download a resource file
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API: GET /api/resources/[id]/download called with ID:', id);
    
    // First, get the resource details
    const { data: resource, error: resourceError } = await supabase
      .schema('api')
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (resourceError || !resource) {
      console.error('API: Error fetching resource:', resourceError);
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Check if this is an old file that was created before the upload system
    if (resource.type === 'file' && resource.file_path && !resource.file_path.includes('_')) {
      console.error('API: This appears to be an old file created before the upload system was implemented');
      return NextResponse.json({ 
        error: 'This file was created before the upload system was implemented. Please re-upload the file.' 
      }, { status: 400 });
    }

    if (resource.type !== 'file' || !resource.file_path) {
      console.error('API: Resource is not a file or has no file path');
      return NextResponse.json({ error: 'Not a downloadable file' }, { status: 400 });
    }

    console.log('API: Downloading file from path:', resource.file_path);
    console.log('API: Resource details:', resource);

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resources')
      .download(resource.file_path);

    if (downloadError) {
      console.error('API: Error downloading file:', downloadError);
      console.error('API: Download error details:', {
        error: downloadError,
        filePath: resource.file_path,
        bucket: 'resources'
      });
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert the file to a blob
    const blob = new Blob([fileData], { type: fileData.type || 'application/octet-stream' });

    // Create response with appropriate headers
    const response = new NextResponse(blob);
    
    // Set headers for file download
    response.headers.set('Content-Type', fileData.type || 'application/octet-stream');
    response.headers.set('Content-Disposition', `attachment; filename="${resource.title || 'download'}"`);
    response.headers.set('Cache-Control', 'no-cache');

    console.log('API: File download successful for:', resource.title);
    return response;

  } catch (error) {
    console.error('API: Error in download endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 