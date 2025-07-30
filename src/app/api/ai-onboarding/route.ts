import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const teamData = searchParams.get('teamData');
    const type = searchParams.get('type') || 'team';

    if (action === 'recommendations' && teamData) {
      // TEMPORARILY DISABLED - OpenAI API usage paused
      // const parsedTeamData = JSON.parse(decodeURIComponent(teamData));
      // const recommendations = await generateManagerRecommendations(parsedTeamData);
      
      // Return mock data based on insight type
      let mockRecommendations;
      
      switch (type) {
        case 'individual':
          mockRecommendations = {
            insights: [
              "Focus on personalised development paths for each team member",
              "Individual performance varies significantly across different roles",
              "Some team members may need additional support in specific areas"
            ],
            actions: [
              "Schedule individual 1:1 meetings to understand personal challenges",
              "Create role-specific development plans for each team member",
              "Provide targeted training based on individual skill gaps"
            ],
            trends: [
              "Team members in technical roles progress faster through milestones",
              "New hires with previous experience adapt more quickly",
              "Individual learning styles affect onboarding effectiveness"
            ]
          };
          break;
          
        case 'strategic':
          mockRecommendations = {
            insights: [
              "Long-term onboarding strategy needs refinement",
              "Team scaling requires systematic approach to knowledge transfer",
              "Strategic alignment between individual goals and company objectives"
            ],
            actions: [
              "Develop comprehensive onboarding framework for future scaling",
              "Implement knowledge management system for better retention",
              "Align onboarding with company's strategic objectives"
            ],
            trends: [
              "Onboarding effectiveness correlates with long-term retention",
              "Strategic onboarding reduces time to full productivity",
              "Systematic approach improves overall team performance"
            ]
          };
          break;
          
        default: // team
          mockRecommendations = {
            insights: [
              "Focus on completing Day 1 tasks for new hires starting soon",
              "Consider assigning buddies to team members without one",
              "Monitor progress of team members in Day 60 milestone"
            ],
            actions: [
              "Schedule 1:1 meetings with new hires in Week 1",
              "Review onboarding progress weekly",
              "Provide additional support for team members behind schedule"
            ],
            trends: [
              "Most new hires are progressing well through their milestones",
              "Consider standardising the onboarding process across roles"
            ]
          };
      }

      return NextResponse.json(mockRecommendations);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in AI onboarding API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // TEMPORARILY DISABLED - OpenAI API usage paused
  return NextResponse.json({ 
    error: 'AI onboarding temporarily disabled',
    message: 'OpenAI API usage has been paused to prevent charges'
  }, { status: 503 });
} 