import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/comments?taskId=xxx&newHireId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const newHireId = searchParams.get('newHireId');

    console.log('GET /api/comments - taskId:', taskId, 'newHireId:', newHireId);

    if (!taskId || !newHireId) {
      return NextResponse.json({ error: 'Missing taskId or newHireId' }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .eq('new_hire_id', parseInt(newHireId))
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments', details: error.message }, { status: 500 });
    }

    console.log('Successfully fetched comments:', comments);
    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, newHireId, authorName, authorEmail, commentText } = body;

    console.log('POST /api/comments - body:', body);

    if (!taskId || !newHireId || !authorName || !authorEmail || !commentText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert the comment
    const { data: comment, error: insertError } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        new_hire_id: parseInt(newHireId),
        author_name: authorName,
        author_email: authorEmail,
        comment_text: commentText
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      return NextResponse.json({ error: 'Failed to add comment', details: insertError.message }, { status: 500 });
    }

    console.log('Successfully added comment:', comment);

    // Update comment count in onboarding_plans table
    const { data: currentPlan, error: fetchError } = await supabase
      .from('onboarding_plans')
      .select('comment_count')
      .eq('new_hire_id', parseInt(newHireId))
      .single();

    if (!fetchError && currentPlan) {
      const { error: updateError } = await supabase
        .from('onboarding_plans')
        .update({ 
          comment_count: (currentPlan.comment_count || 0) + 1
        })
        .eq('new_hire_id', parseInt(newHireId));

      if (updateError) {
        console.error('Error updating comment count:', updateError);
        // Don't fail the request if comment count update fails
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PUT /api/comments
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, commentText } = body;

    console.log('PUT /api/comments - body:', body);

    if (!commentId || !commentText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the comment
    const { data: comment, error: updateError } = await supabase
      .from('task_comments')
      .update({
        comment_text: commentText,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json({ error: 'Failed to update comment', details: updateError.message }, { status: 500 });
    }

    console.log('Successfully updated comment:', comment);
    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error in PUT /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// DELETE /api/comments
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    console.log('DELETE /api/comments - commentId:', commentId);

    if (!commentId) {
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', parseInt(commentId));

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comment', details: deleteError.message }, { status: 500 });
    }

    console.log('Successfully deleted comment:', commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 