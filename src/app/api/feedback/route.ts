import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/feedback?newHireId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newHireId = searchParams.get('newHireId');

    console.log('GET /api/feedback - newHireId:', newHireId);

    if (!newHireId) {
      return NextResponse.json({ error: 'Missing newHireId' }, { status: 400 });
    }

    const { data: feedback, error } = await supabase
      .from('onboarding_feedback')
      .select('*')
      .eq('new_hire_id', parseInt(newHireId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback', details: error.message }, { status: 500 });
    }

    console.log('Successfully fetched feedback:', feedback);
    return NextResponse.json({ feedback: feedback || [] });
  } catch (error) {
    console.error('Error in GET /api/feedback:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// POST /api/feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      newHireId, 
      authorId, 
      authorName, 
      authorRole, 
      feedbackType, 
      feedbackText, 
      rating, 
      milestoneId, 
      taskId 
    } = body;

    console.log('POST /api/feedback - body:', body);

    if (!newHireId || !authorId || !authorName || !authorRole || !feedbackType || !feedbackText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert the feedback
    const { data: feedback, error: insertError } = await supabase
      .from('onboarding_feedback')
      .insert({
        new_hire_id: parseInt(newHireId),
        author_id: authorId,
        author_name: authorName,
        author_role: authorRole,
        feedback_type: feedbackType,
        feedback_text: feedbackText,
        rating: rating || null,
        milestone_id: milestoneId || null,
        task_id: taskId || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return NextResponse.json({ error: 'Failed to add feedback', details: insertError.message }, { status: 500 });
    }

    console.log('Successfully added feedback:', feedback);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error in POST /api/feedback:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PUT /api/feedback
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      feedbackId, 
      feedbackText, 
      rating, 
      feedbackType 
    } = body;

    console.log('PUT /api/feedback - body:', body);

    if (!feedbackId || !feedbackText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the feedback
    const { data: feedback, error: updateError } = await supabase
      .from('onboarding_feedback')
      .update({
        feedback_text: feedbackText,
        rating: rating || null,
        feedback_type: feedbackType,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return NextResponse.json({ error: 'Failed to update feedback', details: updateError.message }, { status: 500 });
    }

    console.log('Successfully updated feedback:', feedback);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error in PUT /api/feedback:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// DELETE /api/feedback
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('feedbackId');

    console.log('DELETE /api/feedback - feedbackId:', feedbackId);

    if (!feedbackId) {
      return NextResponse.json({ error: 'Missing feedbackId' }, { status: 400 });
    }

    // Delete the feedback
    const { error: deleteError } = await supabase
      .from('onboarding_feedback')
      .delete()
      .eq('id', parseInt(feedbackId));

    if (deleteError) {
      console.error('Error deleting feedback:', deleteError);
      return NextResponse.json({ error: 'Failed to delete feedback', details: deleteError.message }, { status: 500 });
    }

    console.log('Successfully deleted feedback:', feedbackId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/feedback:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 