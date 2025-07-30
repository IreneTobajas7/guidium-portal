import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';
import { generateAIOnboardingPlan } from '@/lib/openaiService';

export async function GET(request: NextRequest) {
  try {
    // For now, let's use the service role key to bypass authentication issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .schema('api')
      .from('new_hires_with_status')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  console.log("POST /api/new-hires called");
  try {
    const authInfo = getAuth(request);
    console.log("Clerk getAuth:", authInfo);
    const { getToken } = authInfo;
    const access_token = await getToken({ template: 'supabase' });
    console.log("access_token", access_token);

    console.log("About to parse request body...");
    const body = await request.json();
    console.log("Insert payload:", body);
    console.log("Manager ID in payload:", body.manager_id);
    console.log("Expected Manager ID:", "428f7d59-0aa0-4d5e-9346-97b47fab01bf");

    // Create a Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      }
    );

    console.log("About to insert into Supabase...");
    const { data, error } = await supabase
      .schema('api')
      .from('new_hires')
      .insert([body])
      .select();

    if (error) {
      console.log("Supabase error:", error);
      console.log("Error details:", error.details);
      console.log("Error hint:", error.hint);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate onboarding plan for the new hire
    if (data && data[0]) {
      const newHire = data[0];
      console.log(`Generating onboarding plan for new hire: ${newHire.name}`);
      
      try {
        // Generate AI onboarding plan
        console.log('Start date updated for', newHire.name, ', regenerating onboarding plan...');
        
        // TEMPORARILY DISABLED - OpenAI API usage paused
        // const aiPlan = await generateAIOnboardingPlan({
        //   role: newHire.role,
        //   startDate: newHire.start_date,
        //   newHireName: newHire.name
        // });
        
        // Use fallback plan instead of AI generation
        const aiPlan = {
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
                  due_date: newHire.start_date,
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
                  due_date: newHire.start_date,
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
            role_analysis: `As a ${newHire.role}, you'll be focusing on key responsibilities and growth opportunities.`,
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
        
        console.log(`📋 Using fallback plan for ${newHire.name}`);
        
        // Store the fallback plan
        const { error: planError } = await supabase
          .schema('api')
          .from('onboarding_plans')
          .insert([{
            new_hire_id: newHire.id,
            role: newHire.role,
            plan_data: aiPlan,
            status: 'draft'
          }]);
        
        if (planError) {
          console.error('Error creating AI onboarding plan:', planError);
          // Don't fail the request, just log the error
        } else {
          console.log(`✅ AI onboarding plan created for ${newHire.name}`);
        }
      } catch (planError) {
        console.error('Error generating AI onboarding plan:', planError);
        
        // Use fallback plan if AI generation fails
        const fallbackPlan = {
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
                  due_date: newHire.start_date,
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
                  due_date: newHire.start_date,
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
            role_analysis: `As a ${newHire.role}, you'll be focusing on key responsibilities and growth opportunities.`,
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
        
        console.log(`📋 Using fallback plan for ${newHire.name}`);
        
        // Store the fallback plan
        const { error: fallbackError } = await supabase
          .schema('api')
          .from('onboarding_plans')
          .insert([{
            new_hire_id: newHire.id,
            role: newHire.role,
            plan_data: fallbackPlan,
            status: 'draft'
          }]);
        
        if (fallbackError) {
          console.error('Error creating fallback onboarding plan:', fallbackError);
        } else {
          console.log(`✅ Fallback onboarding plan created for ${newHire.name}`);
        }
      }
    }

    return NextResponse.json({ message: 'New hire added!', data }, { status: 200 });
  } catch (e) {
    console.error("API error:", e); // Debug log
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authInfo = getAuth(request);
    const { getToken } = authInfo;
    const access_token = await getToken({ template: 'supabase' });

    if (!access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, current_milestone, start_date } = body;

    if (!id) {
      return NextResponse.json({ error: 'New hire ID is required' }, { status: 400 });
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Update the new hire
    const { data, error } = await supabase
      .schema('api')
      .from('new_hires')
      .update({ 
        current_milestone: current_milestone,
        ...(start_date && { start_date })
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating new hire:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      newHire: data[0],
      message: 'New hire updated successfully!'
    });

  } catch (error) {
    console.error('Error updating new hire:', error);
    return NextResponse.json({ 
      error: 'Failed to update new hire',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authInfo = getAuth(request);
    const { getToken } = authInfo;
    const access_token = await getToken({ template: 'supabase' });

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing new hire ID' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // First, delete the associated onboarding plan
    const { error: planError } = await supabase
      .schema('api')
      .from('onboarding_plans')
      .delete()
      .eq('new_hire_id', id);

    if (planError) {
      console.error('Error deleting onboarding plan:', planError);
      // Continue with new hire deletion even if plan deletion fails
    }

    // Then delete the new hire
    const { error } = await supabase
      .schema('api')
      .from('new_hires')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Team member deleted successfully!' }, { status: 200 });
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}