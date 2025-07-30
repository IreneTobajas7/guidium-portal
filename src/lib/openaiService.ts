// OpenAI Service for Advanced AI-Powered Onboarding Plans
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIOnboardingContext {
  role: string;
  startDate: string;
  newHireName: string;
  companyContext?: {
    industry: string;
    size: string;
    culture: string;
    tools: string[];
    processes: string[];
  };
  teamContext?: {
    teamSize: number;
    existingMembers: string[];
    managerStyle: string;
    communicationStyle: string;
  };
}

export interface AIGeneratedTask {
  name: string;
  description: string;
  due_date: string;
  status: 'not_started';
  priority: 'low' | 'medium' | 'high';
  assignee: 'new_hire' | 'manager' | 'buddy' | 'hr';
  estimated_hours: number;
  tags: string[];
  resources: string[];
  checklist: string[];
  learning_objectives: string[];
  success_metrics: string[];
  ai_insights: string;
}

export interface AIGeneratedMilestone {
  id: string;
  label: string;
  color: string;
  icon: string;
  tasks: AIGeneratedTask[];
  objectives: string[];
  key_outcomes: string[];
  ai_recommendations: string[];
}

export interface AIGeneratedPlan {
  milestones: AIGeneratedMilestone[];
  personalized_insights: {
    role_analysis: string;
    learning_path: string;
    success_factors: string[];
    potential_challenges: string[];
    recommended_resources: string[];
    ai_generated_tips: string[];
  };
  company_culture: {
    category: string;
    activities: {
      name: string;
      description: string;
      duration: string;
      resources: string[];
    }[];
  }[];
}

// Generate AI-powered onboarding plan
export async function generateAIOnboardingPlan(context: AIOnboardingContext): Promise<AIGeneratedPlan> {
  try {
    const systemPrompt = `You are an expert HR and onboarding specialist with deep knowledge of modern workplace practices. Your task is to create a highly personalised, comprehensive onboarding plan that will set new hires up for success.

IMPORTANT: You must return a valid JSON object with this EXACT structure:
{
  "milestones": [
    {
      "id": "day_1",
      "label": "Day 1",
      "color": "#2A9D8F",
      "icon": "🚀",
      "tasks": [
        {
          "name": "Task Name",
          "description": "Task description",
          "due_date": "2025-08-04",
          "status": "not_started",
          "priority": "high",
          "assignee": "new_hire",
          "estimated_hours": 2,
          "tags": ["HR", "Required"],
          "resources": ["Resource 1", "Resource 2"],
          "checklist": ["Item 1", "Item 2"],
          "learning_objectives": ["Objective 1"],
          "success_metrics": ["Metric 1"],
          "ai_insights": "AI insight text"
        }
      ],
      "objectives": ["Objective 1"],
      "key_outcomes": ["Outcome 1"],
      "ai_recommendations": ["Recommendation 1"]
    }
  ],
  "personalized_insights": {
    "role_analysis": "Analysis text",
    "learning_path": "Learning path text",
    "success_factors": ["Factor 1"],
    "potential_challenges": ["Challenge 1"],
    "recommended_resources": ["Resource 1"],
    "ai_generated_tips": ["Tip 1"]
  },
  "company_culture": [
    {
      "category": "Values & Mission",
      "activities": [
        {
          "name": "Activity Name",
          "description": "Activity description",
          "duration": "1 hour",
          "resources": ["Resource 1"]
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. You MUST generate EXACTLY 5 milestones: Day 1, Week 1, Day 30, Day 60, Day 90
2. Each milestone should have the optimal number of specific, actionable tasks for the role
3. Include role-specific technical skills, soft skills, and company culture elements
4. Provide actionable tasks with clear due dates, priorities, and success metrics
5. Include learning objectives, resources, and checklists for each task
6. Add personalised insights based on the role and industry best practices
7. Ensure tasks are realistic and achievable within the timeframe
8. Add personalised tips and best practices
9. Return ONLY the JSON object with the exact structure above.`;

    const userPrompt = `Create a comprehensive onboarding plan for:

Role: ${context.role}
New Hire Name: ${context.newHireName}
Start Date: ${context.startDate}

CRITICAL: You MUST generate EXACTLY 5 milestones in this specific order:
1. Day 1
2. Week 1  
3. Day 30
4. Day 60
5. Day 90

Requirements:
1. Generate EXACTLY 5 milestones: Day 1, Week 1, Day 30, Day 60, Day 90
2. Each milestone should have the optimal number of specific, actionable tasks for the role
3. Include role-specific technical training and soft skills development
4. Add company culture integration activities
5. Provide clear learning objectives and success metrics for each task
6. Include estimated time requirements and priority levels
7. Add personalised tips and best practices
8. Ensure all dates are calculated relative to the start date

Milestone Structure:
- Day 1: Orientation, team introduction, basic setup (optimal number of tasks)
- Week 1: Role-specific training, company culture, initial projects (optimal number of tasks)
- Day 30: First month review, skill development, team integration (optimal number of tasks)
- Day 60: Mid-term assessment, advanced training, project participation (optimal number of tasks)
- Day 90: Final review, performance evaluation, future planning (optimal number of tasks)

IMPORTANT: 
- Do not skip any milestones. You must include all 5 milestones with tasks.
- Generate the optimal number of tasks for each milestone based on the role requirements.
- Make tasks specific and actionable for the role.
- Ensure due dates align with milestone periods (Day 1 tasks on start date, Week 1 tasks within first week, etc.).

Return ONLY a valid JSON object with the exact structure specified in the system prompt.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000 // Increased from 2500 to ensure all 5 milestones are generated
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let plan: AIGeneratedPlan;
    try {
      plan = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', response);
      throw new Error('Invalid JSON response from AI');
    }

    // Enhance the AI-generated plan with additional context
    return enhanceAIPlan(plan, context);

  } catch (error) {
    console.error('Error generating AI onboarding plan:', error);
    console.log('Using fallback onboarding plan');
    return generateFallbackPlan(context);
  }
}

// Generate a fallback plan when AI generation fails
function generateFallbackPlan(context: AIOnboardingContext): AIGeneratedPlan {
  const milestones: AIGeneratedMilestone[] = [
    {
      id: "day_1",
      label: "Day 1",
      color: "#2A9D8F",
      icon: "🚀",
      tasks: [
        {
          name: "Company Orientation",
          description: "Complete company orientation and HR documentation",
          due_date: context.startDate,
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 4,
          tags: ["HR", "Required"],
          resources: ["Employee Handbook", "HR Policies"],
          checklist: ["Complete paperwork", "Review policies", "Set up accounts"],
          learning_objectives: ["Understand company policies and procedures"],
          success_metrics: ["All documentation completed"],
          ai_insights: "First impressions matter - take time to understand the company culture."
        },
        {
          name: "Meet the Team",
          description: "Introduce yourself to team members and understand their roles",
          due_date: context.startDate,
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 2,
          tags: ["Team", "Required"],
          resources: ["Team Directory", "Organizational Chart"],
          checklist: ["Meet each team member", "Learn their roles", "Exchange contact info"],
          learning_objectives: ["Build relationships with team members"],
          success_metrics: ["Know all team members and their roles"],
          ai_insights: "Strong team relationships are crucial for success in any role."
        },
        {
          name: "Workstation Setup",
          description: "Set up your workstation and access necessary systems",
          due_date: context.startDate,
          status: "not_started",
          priority: "medium",
          assignee: "new_hire",
          estimated_hours: 2,
          tags: ["IT", "Setup"],
          resources: ["IT Support", "System Access Guide"],
          checklist: ["Set up computer", "Install software", "Configure accounts"],
          learning_objectives: ["Become familiar with company systems"],
          success_metrics: ["All systems accessible and functional"],
          ai_insights: "Proper setup ensures you can be productive from day one."
        }
      ],
      objectives: ["Complete orientation", "Meet team members", "Set up workspace"],
      key_outcomes: ["Familiar with company policies", "Team relationships established", "Ready to work"],
      ai_recommendations: ["Take notes during orientation", "Ask questions about team structure", "Test all systems"]
    },
    {
      id: "week_1",
      label: "Week 1",
      color: "#E9C46A",
      icon: "📚",
      tasks: [
        {
          name: "Role-Specific Training",
          description: "Complete training specific to your role and responsibilities",
          due_date: new Date(new Date(context.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 16,
          tags: ["Training", "Role-Specific"],
          resources: ["Training Materials", "Mentor"],
          checklist: ["Complete online modules", "Attend training sessions", "Practice skills"],
          learning_objectives: ["Master role-specific skills and tools"],
          success_metrics: ["Training completed with 80%+ score"],
          ai_insights: "Role-specific training is the foundation of your success in this position."
        },
        {
          name: "Company Culture Workshop",
          description: "Participate in company culture and values workshop",
          due_date: new Date(new Date(context.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "medium",
          assignee: "new_hire",
          estimated_hours: 4,
          tags: ["Culture", "Workshop"],
          resources: ["Culture Guide", "Workshop Materials"],
          checklist: ["Attend workshop", "Participate in discussions", "Complete reflection"],
          learning_objectives: ["Understand and embrace company culture"],
          success_metrics: ["Active participation and understanding demonstrated"],
          ai_insights: "Company culture alignment is key to long-term success and satisfaction."
        },
        {
          name: "First Project Introduction",
          description: "Get introduced to your first project and understand your role",
          due_date: new Date(new Date(context.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 8,
          tags: ["Project", "Role"],
          resources: ["Project Documentation", "Team Lead"],
          checklist: ["Review project scope", "Understand deliverables", "Identify questions"],
          learning_objectives: ["Understand project requirements and your role"],
          success_metrics: ["Can explain project goals and your responsibilities"],
          ai_insights: "Early project involvement helps you understand expectations and build confidence."
        }
      ],
      objectives: ["Complete role training", "Understand company culture", "Start first project"],
      key_outcomes: ["Role skills developed", "Culture integration", "Project understanding"],
      ai_recommendations: ["Take detailed notes during training", "Ask questions about culture", "Document project requirements"]
    },
    {
      id: "day_30",
      label: "Day 30",
      color: "#F4A261",
      icon: "🎯",
      tasks: [
        {
          name: "First Month Review",
          description: "Complete first month performance review and feedback session",
          due_date: new Date(new Date(context.startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 2,
          tags: ["Review", "Feedback"],
          resources: ["Review Form", "Manager"],
          checklist: ["Complete self-assessment", "Prepare questions", "Attend review meeting"],
          learning_objectives: ["Receive feedback and identify improvement areas"],
          success_metrics: ["Review completed and action plan created"],
          ai_insights: "Regular feedback is essential for growth and development."
        },
        {
          name: "Skill Development Assessment",
          description: "Assess current skill levels and identify development needs",
          due_date: new Date(new Date(context.startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "medium",
          assignee: "new_hire",
          estimated_hours: 4,
          tags: ["Assessment", "Development"],
          resources: ["Skill Assessment Tool", "Mentor"],
          checklist: ["Complete skill assessment", "Review results", "Create development plan"],
          learning_objectives: ["Identify skill gaps and development opportunities"],
          success_metrics: ["Clear development plan with timeline"],
          ai_insights: "Understanding your skill gaps helps focus your development efforts."
        },
        {
          name: "Team Integration Check",
          description: "Evaluate team integration and relationship building progress",
          due_date: new Date(new Date(context.startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "medium",
          assignee: "new_hire",
          estimated_hours: 2,
          tags: ["Team", "Integration"],
          resources: ["Team Feedback", "Self-Reflection"],
          checklist: ["Assess team relationships", "Identify collaboration opportunities", "Plan team activities"],
          learning_objectives: ["Strengthen team relationships and collaboration"],
          success_metrics: ["Positive team feedback and active participation"],
          ai_insights: "Strong team relationships enhance productivity and job satisfaction."
        }
      ],
      objectives: ["Complete first month review", "Assess skill development", "Evaluate team integration"],
      key_outcomes: ["Performance feedback received", "Development plan created", "Team relationships strengthened"],
      ai_recommendations: ["Be honest in self-assessment", "Act on feedback promptly", "Continue building relationships"]
    },
    {
      id: "day_60",
      label: "Day 60",
      color: "#E76F51",
      icon: "🌟",
      tasks: [
        {
          name: "Mid-Term Assessment",
          description: "Complete comprehensive mid-term performance and progress assessment",
          due_date: new Date(new Date(context.startDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 3,
          tags: ["Assessment", "Mid-Term"],
          resources: ["Assessment Tool", "Manager", "Mentor"],
          checklist: ["Complete assessment", "Review progress", "Update goals"],
          learning_objectives: ["Evaluate progress and adjust development plan"],
          success_metrics: ["Assessment completed and goals updated"],
          ai_insights: "Mid-term assessments help ensure you're on track for success."
        },
        {
          name: "Advanced Training",
          description: "Complete advanced training specific to your role and career development",
          due_date: new Date(new Date(context.startDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 16,
          tags: ["Training", "Advanced"],
          resources: ["Advanced Training Materials", "Expert Trainer"],
          checklist: ["Complete advanced modules", "Practice advanced skills", "Apply to projects"],
          learning_objectives: ["Master advanced skills and techniques"],
          success_metrics: ["Advanced training completed with 90%+ score"],
          ai_insights: "Advanced training prepares you for more complex responsibilities."
        },
        {
          name: "Project Leadership",
          description: "Take on leadership role in a project or initiative",
          due_date: new Date(new Date(context.startDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "medium",
          assignee: "new_hire",
          estimated_hours: 20,
          tags: ["Leadership", "Project"],
          resources: ["Project Management Tools", "Team Support"],
          checklist: ["Lead project planning", "Coordinate team efforts", "Deliver results"],
          learning_objectives: ["Develop leadership and project management skills"],
          success_metrics: ["Project completed successfully with team satisfaction"],
          ai_insights: "Leadership experience builds confidence and career advancement opportunities."
        }
      ],
      objectives: ["Complete mid-term assessment", "Finish advanced training", "Lead a project"],
      key_outcomes: ["Progress evaluated", "Advanced skills developed", "Leadership experience gained"],
      ai_recommendations: ["Use assessment to guide development", "Apply training to real projects", "Seek feedback on leadership"]
    },
    {
      id: "day_90",
      label: "Day 90",
      color: "#264653",
      icon: "🏆",
      tasks: [
        {
          name: "Final Onboarding Review",
          description: "Complete comprehensive final onboarding review and evaluation",
          due_date: new Date(new Date(context.startDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 3,
          tags: ["Review", "Final"],
          resources: ["Final Review Form", "Manager", "HR"],
          checklist: ["Complete final assessment", "Review entire journey", "Plan next steps"],
          learning_objectives: ["Evaluate overall onboarding success and plan future"],
          success_metrics: ["Final review completed and future plan established"],
          ai_insights: "The final review marks your transition from onboarding to full team member."
        },
        {
          name: "Performance Evaluation",
          description: "Complete formal performance evaluation and goal setting for next period",
          due_date: new Date(new Date(context.startDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "high",
          assignee: "new_hire",
          estimated_hours: 2,
          tags: ["Performance", "Evaluation"],
          resources: ["Performance Review Form", "Manager"],
          checklist: ["Complete performance review", "Set future goals", "Create development plan"],
          learning_objectives: ["Receive performance feedback and set future objectives"],
          success_metrics: ["Performance review completed and goals set"],
          ai_insights: "Performance evaluations guide your career development and growth."
        },
        {
          name: "Onboarding Feedback",
          description: "Provide feedback on the onboarding process to help improve it for future hires",
          due_date: new Date(new Date(context.startDate).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "not_started",
          priority: "low",
          assignee: "new_hire",
          estimated_hours: 1,
          tags: ["Feedback", "Process Improvement"],
          resources: ["Feedback Form", "HR Team"],
          checklist: ["Complete feedback form", "Share suggestions", "Submit to HR"],
          learning_objectives: ["Contribute to process improvement"],
          success_metrics: ["Feedback submitted and acknowledged"],
          ai_insights: "Your feedback helps improve the onboarding experience for future team members."
        }
      ],
      objectives: ["Complete final review", "Evaluate performance", "Provide onboarding feedback"],
      key_outcomes: ["Onboarding completed", "Performance evaluated", "Process improved"],
      ai_recommendations: ["Reflect on your journey", "Set ambitious goals", "Share constructive feedback"]
    }
  ];

  return {
    milestones,
    personalized_insights: {
      role_analysis: `As a ${context.role}, you'll be responsible for contributing to your team's success through your specialized skills and expertise.`,
      learning_path: 'Progressive skill development from foundational to advanced competencies.',
      success_factors: ['Strong communication skills', 'Technical proficiency', 'Team collaboration'],
      potential_challenges: ['Learning curve with new tools', 'Building relationships remotely'],
      recommended_resources: ['Company documentation', 'Industry best practices', 'Team knowledge base'],
      ai_generated_tips: [
        `As a ${context.role}, focus on building strong relationships with your team early on.`,
        'Take initiative in your learning - don\'t wait for others to guide every step.',
        'Document your progress and challenges - this will help with future onboarding improvements.',
        'Seek feedback regularly and be open to constructive criticism.',
        'Balance learning with contributing - start adding value to the team as soon as possible.'
      ]
    },
    company_culture: [
      {
        category: 'Values & Mission',
        activities: [
          {
            name: 'Company Orientation',
            description: 'Learn about company values and mission',
            duration: '2 hours',
            resources: ['Company Handbook']
          }
        ]
      }
    ]
  };
}

// Generate AI recommendations for managers
export async function generateAIRecommendations(teamData: any): Promise<string[]> {
  try {
    const systemPrompt = `You are an expert HR analytics specialist and management consultant. Analyze the team data and provide 5 highly actionable, specific recommendations for managers to improve their onboarding process and team performance.

Focus on:
1. Specific actions managers can take immediately
2. Data-driven insights based on the team metrics
3. Best practices for onboarding and team management
4. Risk mitigation strategies
5. Performance optimization opportunities

IMPORTANT: You must respond with ONLY a valid JSON array of strings. Do not include any other text, explanations, or formatting.`;

    const userPrompt = `Analyze this team data and provide 5 specific, actionable recommendations:

Team Overview:
- Total New Hires: ${teamData.totalNewHires}
- Overdue: ${teamData.overdueCount}
- In Progress: ${teamData.inProgressCount}
- Completed: ${teamData.completedCount}
- Not Started: ${teamData.notStartedCount}
- Average Progress: ${teamData.averageProgress}/5 milestones
- New Hires without Buddies: ${teamData.newHiresWithoutBuddies}

Individual New Hires:
${teamData.newHires.map((hire: any) => 
  `- ${hire.name} (${hire.role}): ${hire.status}, Milestone: ${hire.currentMilestone}, Start: ${hire.startDate}, Has Buddy: ${hire.hasBuddy}`
).join('\n')}

Provide 5 specific, actionable recommendations that address:
1. Immediate actions needed
2. Process improvements
3. Risk mitigation
4. Performance optimization
5. Best practices implementation

Return ONLY a JSON array of strings, like: ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 800 // Reduced from 1000 for faster generation
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed as string[];
      } else {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', response);
      // Fallback: extract recommendations from plain text
      const lines = response.split('\n').filter(line =>
        line.trim().length > 0 && 
        !line.trim().startsWith('```') && 
        !line.trim().startsWith('{') && 
        !line.trim().startsWith('[') && 
        !line.trim().startsWith('**')
      );
      
      if (lines.length > 0) {
        return lines.slice(0, 5).map(line => line.trim().replace(/^[-*•]\s*/, ''));
      }
      
      throw new Error('Could not parse AI response');
    }

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return [
      "Schedule regular 1:1 meetings with new hires in early onboarding stages to provide additional support and guidance.",
      "Review onboarding progress weekly and identify any bottlenecks or areas where new hires may need additional resources.",
      "Consider pairing new hires without buddies with experienced team members for mentorship and support.",
      "Implement a feedback system to gather insights from new hires about their onboarding experience and areas for improvement.",
      "Plan team-building activities to strengthen relationships and foster a collaborative environment."
    ];
  }
}

// Enhance AI-generated plan with additional context and validation
function enhanceAIPlan(plan: AIGeneratedPlan, context: AIOnboardingContext): AIGeneratedPlan {
  // Check if the plan has the wrong structure (AIGeneratedPlan nested structure)
  if (plan.milestones && plan.milestones.length === 0 && (plan as any).AIGeneratedPlan) {
    console.log('Converting malformed AI response to correct format...');
    return convertMalformedPlan(plan as any, context);
  }

  // Ensure plan structure exists
  if (!plan.milestones) {
    plan.milestones = [];
  }
  
  if (!plan.personalized_insights) {
    plan.personalized_insights = {
      role_analysis: '',
      learning_path: '',
      success_factors: [],
      potential_challenges: [],
      recommended_resources: [],
      ai_generated_tips: []
    };
  }

  // Add AI-generated insights to each task
  plan.milestones.forEach(milestone => {
    if (!milestone.tasks) {
      milestone.tasks = [];
    }
    
    milestone.tasks.forEach(task => {
      if (!task.ai_insights) {
        const learningObjective = task.learning_objectives && task.learning_objectives.length > 0 
          ? task.learning_objectives[0]?.toLowerCase() 
          : 'essential skills';
        const tags = task.tags && task.tags.length > 0 
          ? task.tags.join(', ').toLowerCase() 
          : 'key areas';
        
        task.ai_insights = `AI Recommendation: This task is designed to build ${learningObjective} while providing hands-on experience in ${tags}.`;
      }
    });
  });

  // Add personalised tips
  if (!plan.personalized_insights.ai_generated_tips || plan.personalized_insights.ai_generated_tips.length === 0) {
    plan.personalized_insights.ai_generated_tips = [
      `As a ${context.role}, focus on building strong relationships with your team early on.`,
      `Take initiative in your learning - don't wait for others to guide every step.`,
      `Document your progress and challenges - this will help with future onboarding improvements.`,
      `Seek feedback regularly and be open to constructive criticism.`,
      `Balance learning with contributing - start adding value to the team as soon as possible.`
    ];
  }

  return plan;
}

// Convert malformed AI response to correct format
function convertMalformedPlan(malformedPlan: any, context: AIOnboardingContext): AIGeneratedPlan {
  const aiPlan = malformedPlan.AIGeneratedPlan;
  const milestones: AIGeneratedMilestone[] = [];
  
  // Extract milestones from the malformed structure
  if (aiPlan && aiPlan.Milestones) {
    aiPlan.Milestones.forEach((milestoneData: any, index: number) => {
      const milestoneKey = Object.keys(milestoneData)[0];
      const milestoneContent = milestoneData[milestoneKey];
      
      const milestone: AIGeneratedMilestone = {
        id: milestoneKey.toLowerCase().replace(/\s+/g, '_'),
        label: milestoneKey,
        color: getMilestoneColor(index),
        icon: getMilestoneIcon(index),
        tasks: [],
        objectives: [],
        key_outcomes: [],
        ai_recommendations: []
      };
      
      // Convert tasks
      if (milestoneContent.Tasks) {
        milestoneContent.Tasks.forEach((taskData: any, taskIndex: number) => {
          const task: AIGeneratedTask = {
            name: taskData.TaskName || taskData.Title || 'Task',
            description: taskData.Description || taskData.TaskName || 'Task description',
            due_date: taskData.DueDate || taskData['Due Date'] || context.startDate,
            status: 'not_started',
            priority: (taskData.Priority || 'medium').toLowerCase(),
            assignee: 'new_hire',
            estimated_hours: parseInt(taskData.EstimatedTime || taskData['Time Requirement'] || '2'),
            tags: [taskData.Priority || 'General'],
            resources: Array.isArray(taskData.Resources) ? taskData.Resources : [taskData.Resources || 'General'],
            checklist: [],
            learning_objectives: [taskData.LearningObjective || 'Learn essential skills'],
            success_metrics: [taskData.SuccessMetrics || 'Task completed successfully'],
            ai_insights: taskData.PersonalizedTips || taskData.Tips || 'AI-generated task for your role.'
          };
          milestone.tasks.push(task);
        });
      }
      
      milestones.push(milestone);
    });
  }
  
  return {
    milestones,
    personalized_insights: {
      role_analysis: `As a ${context.role}, you'll be focusing on key responsibilities and growth opportunities.`,
      learning_path: 'Structured onboarding to build essential skills and knowledge.',
      success_factors: ['Communication', 'Technical skills', 'Team collaboration'],
      potential_challenges: ['Learning curve', 'Building relationships'],
      recommended_resources: ['Company wiki', 'Team documentation'],
      ai_generated_tips: malformedPlan.personalized_insights?.ai_generated_tips || [
        'Take initiative in learning',
        'Ask questions early',
        'Build relationships with your team'
      ]
    },
    company_culture: [
      {
        category: 'Values & Mission',
        activities: [
          {
            name: 'Company Orientation',
            description: 'Learn about company values and mission',
            duration: '2 hours',
            resources: ['Company Handbook']
          }
        ]
      }
    ]
  };
}

function getMilestoneColor(index: number): string {
  const colors = ['#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#264653'];
  return colors[index % colors.length];
}

function getMilestoneIcon(index: number): string {
  const icons = ['🚀', '📚', '🎯', '🌟', '🏆'];
  return icons[index % icons.length];
}

// Generate role-specific insights
export async function generateRoleInsights(role: string, companyContext?: any): Promise<string> {
  try {
    const prompt = `Provide a comprehensive analysis of the ${role} role, including:
1. Key responsibilities and expectations
2. Essential skills and competencies
3. Common challenges and how to overcome them
4. Success factors and best practices
5. Career development opportunities

Company Context: ${companyContext ? JSON.stringify(companyContext) : 'Standard tech company'}

Provide this as a detailed, professional analysis suitable for new hires.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert career counselor and role specialist." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || 'Role analysis unavailable.';
    
  } catch (error) {
    console.error('Error generating role insights:', error);
    return `As a ${role}, you'll be responsible for contributing to your team's success through your specialized skills and expertise.`;
  }
} 