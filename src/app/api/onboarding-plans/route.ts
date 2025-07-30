import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';
import { generateAIOnboardingPlan } from '@/lib/openaiService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Try to get authentication, but don't fail if not available
    let access_token = null;
    try {
      const authInfo = getAuth(request);
      const { getToken } = authInfo;
      access_token = await getToken({ template: 'supabase' });
    } catch (authError) {
      console.log('Authentication not available, proceeding without token');
    }

    const body = await request.json();
    const { new_hire_id, role, start_date, new_hire_name, companyContext, teamContext } = body;

    if (!new_hire_id || !role || !start_date || !new_hire_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: new_hire_id, role, start_date, new_hire_name' 
      }, { status: 400 });
    }

    // Generate AI-powered onboarding plan
    let aiPlan;
    
    // TEMPORARILY DISABLED - OpenAI API usage paused
    // try {
    //   aiPlan = await generateAIOnboardingPlan({
    //     role,
    //     startDate: start_date,
    //     newHireName: new_hire_name,
    //     companyContext,
    //     teamContext
    //   });
    // } catch (error) {
    //   console.error('Error generating AI onboarding plan:', error);
    //   // Use fallback plan if AI generation fails
    // }
    
    // Use fallback plan instead of AI generation
    aiPlan = {
      milestones: [
        {
          id: "day_1",
          label: "Day 1",
          color: "#2A9D8F",
          tasks: [
            {
              id: 1,
              name: "Complete paperwork",
              description: "Fill out all required HR forms",
              due_date: start_date,
              status: "not_started",
              assignee: "new_hire",
              estimated_hours: 2,
              tags: ["HR", "Required"],
              resources: ["HR Portal", "Employee Handbook"],
              checklist: [
                "Tax forms completed",
                "Benefits enrollment", 
                "Emergency contacts added"
              ]
            }
          ]
        },
        {
          id: "week_1",
          label: "Week 1",
          color: "#E9C46A",
          tasks: [
            {
              id: 2,
              name: "Meet with manager",
              description: "Schedule and attend 1:1 meeting with your manager",
              due_date: start_date,
              status: "not_started",
              assignee: "new_hire",
              estimated_hours: 1,
              tags: ["Management", "Required"],
              resources: ["Calendar", "Meeting Room"],
              checklist: [
                "Schedule meeting",
                "Prepare questions",
                "Discuss goals"
              ]
            }
          ]
        }
      ],
      personalized_insights: {
        role_analysis: `As a ${role}, you'll be focusing on key responsibilities and growth opportunities.`,
        learning_path: "Structured onboarding to build essential skills and knowledge.",
        success_factors: ["Communication", "Technical skills", "Team collaboration"],
        potential_challenges: ["Learning curve", "Building relationships"],
        recommended_resources: ["Company wiki", "Team documentation"],
        ai_generated_tips: ["Take initiative in learning", "Ask questions early"]
      },
      company_culture: [
        {
          category: "Values & Mission",
          activities: [
            "Review company values and mission statement",
            "Understand company culture and expectations"
          ]
        }
      ]
    };

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Store the AI-generated plan
    const { data, error } = await supabase
      .schema('api')
      .from('onboarding_plans')
      .insert([{
        new_hire_id,
        role,
        plan_data: aiPlan,
        status: 'draft'
      }])
      .select();

    if (error) {
      console.error('Error storing AI onboarding plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      plan: data[0],
      message: 'AI-powered onboarding plan generated and stored successfully!'
    });

  } catch (error) {
    console.error('AI onboarding plan generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI onboarding plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get authentication, but don't fail if not available
    let access_token = null;
    try {
      const authInfo = getAuth(request);
      const { getToken } = authInfo;
      access_token = await getToken({ template: 'supabase' });
    } catch (authError) {
      console.log('Authentication not available, proceeding without token');
    }

    const { searchParams } = new URL(request.url);
    const new_hire_id = searchParams.get('new_hire_id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .schema('api')
      .from('onboarding_plans')
      .select('*');

    if (new_hire_id) {
      query = query.eq('new_hire_id', new_hire_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching onboarding plans:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching onboarding plans:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding plans' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authInfo = getAuth(request);
    const { getToken } = authInfo;
    const access_token = await getToken({ template: 'supabase' });

    if (!access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { new_hire_id, role, start_date, new_hire_name, companyContext, teamContext } = body;

    if (!new_hire_id || !role || !start_date || !new_hire_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: new_hire_id, role, start_date, new_hire_name' 
      }, { status: 400 });
    }

    // Regenerate AI onboarding plan
    let aiPlan;
    
    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    
    try {
      // TEMPORARILY DISABLED - OpenAI API usage paused
      // aiPlan = await generateAIOnboardingPlan({
      //   role,
      //   startDate: start_date,
      //   newHireName: new_hire_name,
      //   companyContext,
      //   teamContext
      // });
      
      // Use fallback plan instead of AI generation
      aiPlan = {
        milestones: [
          {
            id: "day_1",
            label: "Day 1",
            color: "#2A9D8F",
            tasks: [
              {
                id: 1,
                name: "Complete paperwork",
                description: "Fill out all required HR forms",
                due_date: start_date,
                status: "not_started",
                assignee: "new_hire",
                estimated_hours: 2,
                tags: ["HR", "Required"],
                resources: ["HR Portal", "Employee Handbook"],
                checklist: [
                  "Tax forms completed",
                  "Benefits enrollment", 
                  "Emergency contacts added"
                ]
              }
            ]
          },
          {
            id: "week_1",
            label: "Week 1",
            color: "#E9C46A",
            tasks: [
              {
                id: 2,
                name: "Meet with manager",
                description: "Schedule and attend 1:1 meeting with your manager",
                due_date: start_date,
                status: "not_started",
                assignee: "new_hire",
                estimated_hours: 1,
                tags: ["Management", "Required"],
                resources: ["Calendar", "Meeting Room"],
                checklist: [
                  "Schedule meeting",
                  "Prepare questions",
                  "Discuss goals"
                ]
              }
            ]
          }
        ],
        personalized_insights: {
          role_analysis: `As a ${role}, you'll be focusing on key responsibilities and growth opportunities.`,
          learning_path: "Structured onboarding to build essential skills and knowledge.",
          success_factors: ["Communication", "Technical skills", "Team collaboration"],
          potential_challenges: ["Learning curve", "Building relationships"],
          recommended_resources: ["Company wiki", "Team documentation"],
          ai_generated_tips: ["Take initiative in learning", "Ask questions early"]
        },
        company_culture: [
          {
            category: "Values & Mission",
            activities: [
              "Review company values and mission statement",
              "Understand company culture and expectations"
            ]
          }
        ]
      };
    } catch (error) {
      console.error('Error regenerating AI onboarding plan:', error);
      // Fallback to existing plan if regeneration fails
      const { data: existingPlan, error: fetchError } = await supabase
        .schema('api')
        .from('onboarding_plans')
        .select('*')
        .eq('new_hire_id', new_hire_id)
        .single();

      if (fetchError) {
        console.error('Error fetching existing plan for fallback:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch existing plan for fallback' }, { status: 500 });
      }
      aiPlan = existingPlan.plan_data;
    }

    // Update the existing plan with new AI-generated content
    const { data, error } = await supabase
      .schema('api')
      .from('onboarding_plans')
      .upsert([{
        new_hire_id,
        role,
        plan_data: aiPlan,
        status: 'updated',
        generated_at: new Date().toISOString()
      }], { onConflict: 'new_hire_id' })
      .select();

    if (error) {
      console.error('Error updating AI onboarding plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      plan: data[0],
      message: 'AI-powered onboarding plan regenerated successfully!'
    });

  } catch (error) {
    console.error('AI onboarding plan regeneration error:', error);
    return NextResponse.json({ 
      error: 'Failed to regenerate AI onboarding plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authInfo = getAuth(request);
    const { getToken } = authInfo;
    const access_token = await getToken({ template: 'supabase' });

    if (!access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { new_hire_id } = body;

    if (!new_hire_id) {
      return NextResponse.json({ error: 'Missing new_hire_id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase
      .schema('api')
      .from('onboarding_plans')
      .delete()
      .eq('new_hire_id', new_hire_id);

    if (error) {
      console.error('Error deleting onboarding plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding plan deleted successfully!' 
    });

  } catch (error) {
    console.error('Error deleting onboarding plan:', error);
    return NextResponse.json({ error: 'Failed to delete onboarding plan' }, { status: 500 });
  }
} 

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { newHireId, milestoneId, taskId, status } = body;

    if (!newHireId || !milestoneId || !taskId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch current onboarding plan
    const { data: currentPlans, error: fetchError } = await supabase
      .schema('api')
      .from('onboarding_plans')
      .select('*')
      .eq('new_hire_id', newHireId);

    if (fetchError) {
      console.error('Error fetching current plan:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current plan' }, { status: 500 });
    }

    if (!currentPlans || currentPlans.length === 0) {
      return NextResponse.json({ error: 'No onboarding plan found' }, { status: 404 });
    }

    // Use the first plan (or most recent if multiple exist)
    const currentPlan = currentPlans[0];

    // Update the specific task status in the plan_data
    const planData = currentPlan.plan_data;
    if (planData && planData.milestones) {
      const milestone = planData.milestones.find((m: any) => m.id === milestoneId);
      if (milestone && milestone.tasks) {
        const task = milestone.tasks.find((t: any) => t.id === taskId || t.name === taskId);
        if (task) {
          task.status = status;
        }
      }
    }

    // Update the plan in the database
    const { error: updateError } = await supabase
      .schema('api')
      .from('onboarding_plans')
      .update({ plan_data: planData })
      .eq('new_hire_id', newHireId);

    if (updateError) {
      console.error('Error updating task status:', updateError);
      return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/onboarding-plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 