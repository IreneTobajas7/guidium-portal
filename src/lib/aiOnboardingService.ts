// Advanced AI Onboarding Plan Generator Service
// This service generates highly personalized, context-aware onboarding plans

export interface OnboardingTask {
  id: number;
  name: string;
  description: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  assignee: 'new_hire' | 'manager' | 'buddy' | 'hr';
  estimated_hours: number;
  tags: string[];
  resources: string[];
  checklist: string[];
  dependencies?: string[];
  learning_objectives: string[];
  success_metrics: string[];
}

export interface OnboardingMilestone {
  id: string;
  label: string;
  color: string;
  icon: string;
  tasks: OnboardingTask[];
  objectives: string[];
  key_outcomes: string[];
}

export interface OnboardingPlan {
  milestones: OnboardingMilestone[];
  role_specific_tasks: {
    category: string;
    tasks: OnboardingTask[];
  }[];
  company_culture: {
    category: string;
    activities: {
      name: string;
      description: string;
      duration: string;
      resources: string[];
    }[];
  }[];
  personalized_insights: {
    role_analysis: string;
    learning_path: string;
    success_factors: string[];
    potential_challenges: string[];
    recommended_resources: string[];
  };
}

// Advanced role analysis and task generation
const ADVANCED_ROLE_ANALYSIS = {
  'software_engineer': {
    role_analysis: "Software Engineers are responsible for designing, developing, and maintaining software applications. This role requires strong technical skills, problem-solving abilities, and collaboration with cross-functional teams.",
    core_competencies: [
      'Programming and software development',
      'System design and architecture',
      'Code review and quality assurance',
      'Testing and debugging',
      'Version control and collaboration',
      'Agile development practices'
    ],
    technical_skills: [
      'Programming languages (JavaScript, Python, Java, etc.)',
      'Frameworks and libraries',
      'Database design and management',
      'API development and integration',
      'DevOps and CI/CD practices',
      'Cloud platforms (AWS, Azure, GCP)'
    ],
    soft_skills: [
      'Communication and collaboration',
      'Problem-solving and critical thinking',
      'Time management and prioritization',
      'Continuous learning and adaptation',
      'Teamwork and mentorship'
    ],
    success_metrics: [
      'Code quality and maintainability',
      'Feature delivery speed',
      'Bug resolution time',
      'Team collaboration effectiveness',
      'Knowledge sharing and documentation'
    ]
  },
  'product_manager': {
    role_analysis: "Product Managers drive product strategy, roadmap, and execution. They bridge technical and business requirements, ensuring products meet user needs and business objectives.",
    core_competencies: [
      'Product strategy and vision',
      'Market research and analysis',
      'User experience design',
      'Data analysis and metrics',
      'Cross-functional leadership',
      'Agile product development'
    ],
    technical_skills: [
      'Product analytics tools',
      'User research methods',
      'Prototyping and wireframing',
      'A/B testing and experimentation',
      'Data visualization',
      'Project management tools'
    ],
    soft_skills: [
      'Leadership and influence',
      'Strategic thinking',
      'User empathy and advocacy',
      'Stakeholder management',
      'Decision-making and prioritization'
    ],
    success_metrics: [
      'Product adoption and engagement',
      'Feature usage and retention',
      'User satisfaction scores',
      'Time to market',
      'Business impact and ROI'
    ]
  },
  'designer': {
    role_analysis: "Designers create user-centered experiences through research, ideation, and visual design. They ensure products are both functional and delightful to use.",
    core_competencies: [
      'User research and testing',
      'Information architecture',
      'Visual design and branding',
      'Prototyping and interaction design',
      'Design systems and consistency',
      'User experience optimization'
    ],
    technical_skills: [
      'Design tools (Figma, Sketch, Adobe Creative Suite)',
      'Prototyping tools (InVision, Framer)',
      'User research platforms',
      'Design system management',
      'Animation and micro-interactions',
      'Accessibility and inclusive design'
    ],
    soft_skills: [
      'User empathy and advocacy',
      'Creative problem-solving',
      'Visual communication',
      'Collaboration and feedback',
      'Design thinking and innovation'
    ],
    success_metrics: [
      'User satisfaction and usability scores',
      'Design consistency and quality',
      'Conversion and engagement rates',
      'Accessibility compliance',
      'Design system adoption'
    ]
  },
  'marketing_specialist': {
    role_analysis: "Marketing Specialists develop and execute marketing strategies to drive brand awareness, lead generation, and customer acquisition.",
    core_competencies: [
      'Marketing strategy and planning',
      'Content creation and management',
      'Digital marketing channels',
      'Campaign management and optimization',
      'Data analysis and reporting',
      'Brand management and positioning'
    ],
    technical_skills: [
      'Marketing automation platforms',
      'Analytics and tracking tools',
      'Content management systems',
      'Social media platforms',
      'Email marketing tools',
      'SEO and SEM practices'
    ],
    soft_skills: [
      'Creative thinking and storytelling',
      'Data-driven decision making',
      'Project management',
      'Stakeholder communication',
      'Trend analysis and adaptation'
    ],
    success_metrics: [
      'Lead generation and conversion rates',
      'Brand awareness and engagement',
      'Campaign performance and ROI',
      'Content engagement metrics',
      'Customer acquisition cost'
    ]
  }
};

// Generate highly personalized onboarding plan
export function generateOnboardingPlan(role: string, startDate: string, newHireName: string): OnboardingPlan {
  const start = new Date(startDate);
  const roleAnalysis = ADVANCED_ROLE_ANALYSIS[role as keyof typeof ADVANCED_ROLE_ANALYSIS] || ADVANCED_ROLE_ANALYSIS.software_engineer;

  // Helper functions for date calculations
  function addWorkingDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return result;
  }

  function getWorkingDaysSinceStart(dueDate: Date): number {
    const startDate = new Date(start);
    let workingDays = 0;
    const current = new Date(startDate);
    
    if (dueDate.getTime() === startDate.getTime()) return 0;
    
    while (current < dueDate) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) workingDays++;
    }
    
    return workingDays;
  }

  function getMilestoneForTask(dueDate: Date): string {
    const workingDaysSinceStart = getWorkingDaysSinceStart(dueDate);
    
    if (workingDaysSinceStart === 0) return 'day_1';
    if (workingDaysSinceStart >= 1 && workingDaysSinceStart <= 4) return 'week_1';
    if (workingDaysSinceStart >= 5 && workingDaysSinceStart <= 29) return 'day_30';
    if (workingDaysSinceStart >= 30 && workingDaysSinceStart <= 59) return 'day_60';
    if (workingDaysSinceStart >= 60 && workingDaysSinceStart <= 89) return 'day_90';
    
    return 'day_90';
  }

  // Generate role-specific tasks with rich context
  function generateRoleSpecificTasks(): OnboardingTask[] {
    const baseTasks: OnboardingTask[] = [];
    let taskId = 100; // Start role-specific tasks from ID 100

    // Day 1 Role-Specific Tasks
    baseTasks.push({
      id: taskId++,
      name: `Complete ${role.replace('_', ' ')} role orientation`,
      description: `Deep dive into your specific role as a ${role.replace('_', ' ')}. Understand your responsibilities, key performance indicators, and how your role contributes to the company's success.`,
      due_date: start.toISOString().split('T')[0],
      status: 'not_started',
      priority: 'high',
      assignee: 'new_hire',
      estimated_hours: 3,
      tags: ['Role-Specific', 'Orientation'],
      resources: [
        'Role Description Document',
        'Team Structure Overview',
        'Performance Expectations Guide',
        'Key Metrics Dashboard'
      ],
      checklist: [
        'Review detailed role description',
        'Understand key responsibilities',
        'Identify success metrics and KPIs',
        'Map out stakeholder relationships',
        'Set up role-specific tools and access'
      ],
      learning_objectives: [
        'Understand role expectations and deliverables',
        'Identify key stakeholders and relationships',
        'Learn role-specific tools and processes'
      ],
      success_metrics: [
        'Clear understanding of role responsibilities',
        'Access to all necessary tools and systems',
        'Established relationships with key stakeholders'
      ]
    });

    // Week 1 Role-Specific Tasks
    baseTasks.push({
      id: taskId++,
      name: `Master ${role.replace('_', ' ')} tools and platforms`,
      description: `Get hands-on experience with the essential tools, platforms, and systems used by ${role.replace('_', ' ')}s in our organization.`,
      due_date: addWorkingDays(start, 2).toISOString().split('T')[0],
      status: 'not_started',
      priority: 'high',
      assignee: 'new_hire',
      estimated_hours: 6,
      tags: ['Technical', 'Tools'],
      resources: [
        'Tool Access Guide',
        'Platform Documentation',
        'Best Practices Handbook',
        'Training Videos and Tutorials'
      ],
      checklist: [
        'Set up all required tools and platforms',
        'Complete platform-specific training modules',
        'Practise with sample projects or data',
        'Configure personal workspace and preferences',
        'Learn keyboard shortcuts and productivity tips'
      ],
      learning_objectives: [
        'Proficiency in role-specific tools and platforms',
        'Understanding of tool workflows and integrations',
        'Ability to work efficiently with team tools'
      ],
      success_metrics: [
        'Successfully completed all tool training modules',
        'Able to perform basic tasks in all required platforms',
        'Configured workspace for optimal productivity'
      ]
    });

    // Day 30 Role-Specific Tasks
    baseTasks.push({
      id: taskId++,
      name: `Deliver first ${role.replace('_', ' ')} project`,
      description: `Complete your first significant project or deliverable as a ${role.replace('_', ' ')}. This should demonstrate your understanding of the role and contribute real value to the team.`,
      due_date: addWorkingDays(start, 15).toISOString().split('T')[0],
      status: 'not_started',
      priority: 'high',
      assignee: 'new_hire',
      estimated_hours: 20,
      tags: ['Project', 'Deliverable'],
      resources: [
        'Project Guidelines and Templates',
        'Team Collaboration Tools',
        'Feedback and Review Process',
        'Success Criteria Documentation'
      ],
      checklist: [
        'Understand project requirements and objectives',
        'Create detailed project plan and timeline',
        'Execute project tasks with regular check-ins',
        'Seek feedback and iterate on deliverables',
        'Present final project to stakeholders',
        'Document lessons learned and best practices'
      ],
      learning_objectives: [
        'Apply role-specific skills to real projects',
        'Navigate project lifecycle and stakeholder management',
        'Deliver high-quality work that meets team standards'
      ],
      success_metrics: [
        'Project delivered on time and within scope',
        'Positive feedback from stakeholders and team',
        'Demonstrated role-specific competencies'
      ]
    });

    // Day 60 Role-Specific Tasks
    baseTasks.push({
      id: taskId++,
      name: `Lead ${role.replace('_', ' ')} initiative`,
      description: `Take ownership of a ${role.replace('_', ' ')} initiative or process improvement. This demonstrates leadership potential and deep understanding of your role.`,
      due_date: addWorkingDays(start, 45).toISOString().split('T')[0],
      status: 'not_started',
      priority: 'medium',
      assignee: 'new_hire',
      estimated_hours: 16,
      tags: ['Leadership', 'Initiative'],
      resources: [
        'Leadership Development Resources',
        'Process Improvement Frameworks',
        'Stakeholder Management Guide',
        'Project Management Tools'
      ],
      checklist: [
        'Identify improvement opportunity or new initiative',
        'Develop proposal and business case',
        'Gain stakeholder buy-in and approval',
        'Plan and execute initiative',
        'Measure impact and document results',
        'Share learnings with the team'
      ],
      learning_objectives: [
        'Develop leadership and initiative-taking skills',
        'Understand process improvement methodologies',
        'Build stakeholder management capabilities'
      ],
      success_metrics: [
        'Successfully led initiative from conception to completion',
        'Measurable positive impact on team or process',
        'Recognition from stakeholders and leadership'
      ]
    });

    // Day 90 Role-Specific Tasks
    baseTasks.push({
      id: taskId++,
      name: `Mentor and knowledge sharing`,
      description: `Share your expertise and mentor others in ${role.replace('_', ' ')} best practices. This demonstrates mastery and contributes to team growth.`,
      due_date: addWorkingDays(start, 75).toISOString().split('T')[0],
      status: 'not_started',
      priority: 'medium',
      assignee: 'new_hire',
      estimated_hours: 8,
      tags: ['Mentorship', 'Knowledge Sharing'],
      resources: [
        'Mentorship Guidelines',
        'Knowledge Sharing Templates',
        'Presentation Tools',
        'Documentation Standards'
      ],
      checklist: [
        'Identify knowledge sharing opportunities',
        'Prepare training materials or documentation',
        'Conduct training sessions or workshops',
        'Mentor junior team members',
        'Create reusable resources and templates',
        'Gather feedback and iterate on materials'
      ],
      learning_objectives: [
        'Develop teaching and mentoring skills',
        'Create effective knowledge sharing materials',
        'Contribute to team capability building'
      ],
      success_metrics: [
        'Successfully mentored or trained team members',
        'Created valuable knowledge sharing resources',
        'Positive feedback from mentees and team'
      ]
    });

    return baseTasks;
  }

  // Generate comprehensive onboarding plan
  const roleSpecificTasks = generateRoleSpecificTasks();
  
  // Create milestones with rich objectives and outcomes
  const milestones: OnboardingMilestone[] = [
    {
      id: 'day_1',
      label: 'Day 1 - Welcome & Foundation',
      color: '#2A9D8F',
      icon: '🎯',
      tasks: roleSpecificTasks.filter(task => getMilestoneForTask(new Date(task.due_date)) === 'day_1'),
      objectives: [
        'Establish strong foundation and first impressions',
        'Complete essential administrative tasks',
        'Build initial relationships with team and buddy',
        'Understand role expectations and immediate priorities'
      ],
      key_outcomes: [
        'All paperwork and IT setup completed',
        'Strong first impression with team',
        'Clear understanding of Day 1 priorities',
        'Established connection with buddy and manager'
      ]
    },
    {
      id: 'week_1',
      label: 'Week 1 - Tools & Integration',
      color: '#E9C46A',
      icon: '🛠️',
      tasks: roleSpecificTasks.filter(task => getMilestoneForTask(new Date(task.due_date)) === 'week_1'),
      objectives: [
        'Master essential tools and platforms',
        'Deepen team relationships and understanding',
        'Begin hands-on work and contribution',
        'Establish productive work routines'
      ],
      key_outcomes: [
        'Proficiency in all required tools and systems',
        'Active participation in team activities',
        'First meaningful contributions to team work',
        'Established productive daily routines'
      ]
    },
    {
      id: 'day_30',
      label: 'Day 30 - First Deliverables',
      color: '#F4A261',
      icon: '📊',
      tasks: roleSpecificTasks.filter(task => getMilestoneForTask(new Date(task.due_date)) === 'day_30'),
      objectives: [
        'Deliver first significant project or contribution',
        'Demonstrate role-specific competencies',
        'Receive and incorporate feedback',
        'Establish credibility and trust with team'
      ],
      key_outcomes: [
        'Successfully completed first major project',
        'Positive feedback from stakeholders',
        'Demonstrated role-specific skills',
        'Established credibility within the team'
      ]
    },
    {
      id: 'day_60',
      label: 'Day 60 - Leadership & Initiative',
      color: '#E76F51',
      icon: '🚀',
      tasks: roleSpecificTasks.filter(task => getMilestoneForTask(new Date(task.due_date)) === 'day_60'),
      objectives: [
        'Take ownership of initiatives or improvements',
        'Demonstrate leadership potential',
        'Contribute to process improvements',
        'Build broader organizational relationships'
      ],
      key_outcomes: [
        'Successfully led an initiative or improvement',
        'Demonstrated leadership and initiative',
        'Positive impact on team or process',
        'Expanded network within organization'
      ]
    },
    {
      id: 'day_90',
      label: 'Day 90 - Mastery & Mentorship',
      color: '#264653',
      icon: '🏆',
      tasks: roleSpecificTasks.filter(task => getMilestoneForTask(new Date(task.due_date)) === 'day_90'),
      objectives: [
        'Achieve mastery in role-specific skills',
        'Contribute to team knowledge and growth',
        'Mentor and support others',
        'Plan for continued growth and development'
      ],
      key_outcomes: [
        'Demonstrated mastery of role competencies',
        'Successfully mentored or trained others',
        'Contributed to team knowledge sharing',
        'Clear plan for continued development'
      ]
    }
  ];

  // Generate personalized insights
  const personalizedInsights = {
    role_analysis: roleAnalysis.role_analysis,
    learning_path: `As a ${role.replace('_', ' ')}, your learning journey will focus on ${roleAnalysis.core_competencies.slice(0, 3).join(', ')}. You'll progress from foundational skills to advanced competencies, with opportunities to lead initiatives and mentor others.`,
    success_factors: [
      'Strong foundation in core competencies',
      'Proactive learning and skill development',
      'Effective collaboration and communication',
      'Results-oriented approach to work',
      'Continuous improvement mindset'
    ],
    potential_challenges: [
      'Balancing learning with immediate deliverables',
      'Navigating complex stakeholder relationships',
      'Adapting to team-specific processes and tools',
      'Managing time across multiple priorities',
      'Building credibility while learning'
    ],
    recommended_resources: [
      'Role-specific training modules and courses',
      'Industry best practices and frameworks',
      'Mentorship and coaching programs',
      'Professional development opportunities',
      'Team knowledge sharing sessions'
    ]
  };

  return {
    milestones,
    role_specific_tasks: [{
      category: `${role.replace('_', ' ')} Specific Tasks`,
      tasks: roleSpecificTasks
    }],
    company_culture: [{
      category: 'Team Integration',
      activities: [
        {
          name: 'Team Lunch & Learn',
          description: 'Join team members for lunch and participate in knowledge sharing sessions',
          duration: '1 hour',
          resources: ['Team Calendar', 'Lunch Venues', 'Discussion Topics']
        },
        {
          name: 'Cross-functional Collaboration',
          description: 'Work on projects with team members from different functions',
          duration: 'Ongoing',
          resources: ['Project Management Tools', 'Communication Platforms', 'Collaboration Guidelines']
        }
      ]
    }],
    personalized_insights: personalizedInsights
  };
}

// Fallback for unknown roles
export function generateGenericPlan(role: string, startDate: string, newHireName: string): OnboardingPlan {
  return generateOnboardingPlan('software_engineer', startDate, newHireName);
} 