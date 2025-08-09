import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/growth/insights - Get insights for a specific employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newHireId = searchParams.get('newHireId');

    if (!newHireId) {
      return NextResponse.json({ error: 'Missing newHireId parameter' }, { status: 400 });
    }

    // Get all insights for the employee
    const { data: insights, error: insightsError } = await supabase
      .schema('api')
      .from('growth_insights')
      .select('*')
      .eq('new_hire_id', newHireId)
      .order('generated_at', { ascending: false });

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }

    // Get test results to generate additional insights
    const { data: testResults, error: testResultsError } = await supabase
      .schema('api')
      .from('growth_test_results')
      .select(`
        id,
        result_summary,
        insights,
        completed_at,
        growth_tests (
          name,
          category
        )
      `)
      .eq('new_hire_id', newHireId)
      .order('completed_at', { ascending: false });

    if (testResultsError) {
      console.error('Error fetching test results:', testResultsError);
    }

    // Generate additional insights based on test results
    const additionalInsights: Array<{
      insight_type: string;
      title: string;
      description: string;
      confidence_score: number;
      is_positive: boolean;
      actionable_items: string[];
    }> = [];
    if (testResults && testResults.length > 0) {
      // Group insights by type
      const personalityTests = testResults.filter(tr => {
        const testName = (tr.growth_tests as { name?: string })?.name || '';
        return testName.toLowerCase().includes('personality') || testName.toLowerCase().includes('myers') || testName.toLowerCase().includes('disc');
      });
      const leadershipTests = testResults.filter(tr => {
        const testName = (tr.growth_tests as { name?: string })?.name || '';
        return testName.toLowerCase().includes('leadership');
      });
      const communicationTests = testResults.filter(tr => {
        const testName = (tr.growth_tests as { name?: string })?.name || '';
        return testName.toLowerCase().includes('communication');
      });

      // Generate personality insights
      if (personalityTests.length > 0) {
        const personalitySummary = personalityTests.map(tr => tr.result_summary).join(', ');
        additionalInsights.push({
          insight_type: 'personality',
          title: 'Personality Profile',
          description: `Based on your personality assessments, you show strong ${personalitySummary.toLowerCase()}. This suggests you thrive in collaborative environments and are naturally empathetic.`,
          confidence_score: 0.9,
          is_positive: true,
          actionable_items: [
            'Leverage your natural empathy in team interactions',
            'Use your collaborative nature to build strong relationships',
            'Consider roles that allow you to work closely with others'
          ]
        });
      }

      // Generate leadership insights
      if (leadershipTests.length > 0) {
        additionalInsights.push({
          insight_type: 'leadership',
          title: 'Leadership Potential',
          description: 'Your leadership assessments indicate strong potential for people management. You naturally inspire and motivate others.',
          confidence_score: 0.85,
          is_positive: true,
          actionable_items: [
            'Seek opportunities to lead small projects or initiatives',
            'Practice giving constructive feedback',
            'Develop your strategic thinking skills'
          ]
        });
      }

      // Generate communication insights
      if (communicationTests.length > 0) {
        additionalInsights.push({
          insight_type: 'communication',
          title: 'Communication Style',
          description: 'Your communication preferences suggest you excel at building rapport and explaining complex ideas simply.',
          confidence_score: 0.8,
          is_positive: true,
          actionable_items: [
            'Use your natural communication skills in presentations',
            'Help bridge communication gaps in team settings',
            'Consider mentoring or training opportunities'
          ]
        });
      }

      // Generate overall development insights
      if (testResults.length >= 3) {
        const completionRate = (testResults.length / 6) * 100; // Assuming 6 total tests
        additionalInsights.push({
          insight_type: 'development',
          title: 'Development Progress',
          description: `You've completed ${testResults.length} assessments with a ${completionRate.toFixed(0)}% completion rate. This shows strong commitment to self-development.`,
          confidence_score: 0.95,
          is_positive: true,
          actionable_items: [
            'Continue taking recommended assessments',
            'Review and apply insights regularly',
            'Share your learnings with your manager'
          ]
        });
      }
    }

    return NextResponse.json({
      insights: insights || [],
      additionalInsights,
      testResults: testResults || []
    });
  } catch (error) {
    console.error('Error in GET /api/growth/insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/growth/insights - Generate new insights
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newHireId, insightType, prompt } = body;

    if (!newHireId || !insightType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Here you would integrate with OpenAI to generate insights
    // For now, we'll create a placeholder insight
    const newInsight = {
      new_hire_id: newHireId,
      insight_type: insightType,
      title: 'AI-Generated Insight',
      description: 'This is a placeholder insight that would be generated by AI based on the provided prompt and test results.',
      confidence_score: 0.85,
      is_positive: true,
      actionable_items: ['Apply this insight in your daily work', 'Discuss with your manager']
    };

    const { data: result, error: insertError } = await supabase
      .from('growth_insights')
      .insert(newInsight)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting insight:', insertError);
      return NextResponse.json({ error: 'Failed to save insight' }, { status: 500 });
    }

    return NextResponse.json({ insight: result });
  } catch (error) {
    console.error('Error in POST /api/growth/insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 