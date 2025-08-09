// API utility functions for fetching data from Supabase

export interface Manager {
  id: string;
  name: string;
  "surname (s)": string | null;
  email: string;
}

export interface NewHire {
  id: number;
  name: string;
  "surname(s)": string;
  email: string;
  start_date: string;
  status: string | null;
  manager_id: string;
  buddy_id: string;
  role: string | null;
  current_milestone: string;
  onboarding_completed_at: string | null;
  workdays_since_start: number;
  expected_milestone: string;
  calculated_status: string;
  manager?: Manager;
  buddy?: Buddy;
}

export interface Buddy {
  id: string;
  name: string;
  "surname (s)": string | null;
  email: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'link' | 'file';
  url?: string;
  file_path?: string;
  category: string;
  accessible_to: 'all' | 'specific';
  accessible_employees: number[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Fetch all managers with their new hires
export async function fetchManagers(): Promise<Manager[]> {
  try {
    const response = await fetch('/api/managers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch managers');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching managers:', error);
    return [];
  }
}

// Fetch all new hires with their manager and buddy relationships
export async function fetchNewHires(): Promise<NewHire[]> {
  try {
    const response = await fetch('/api/new-hires', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch new hires');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching new hires:', error);
    return [];
  }
}

// Fetch all buddies with their assigned new hires
export async function fetchBuddies(): Promise<Buddy[]> {
  try {
    const response = await fetch('/api/buddies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch buddies');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching buddies:', error);
    return [];
  }
}

// Fetch all resources (optionally filter for employee access)
export async function fetchResources(employeeId?: number): Promise<Resource[]> {
  try {
    console.log('fetchResources - Making API call to /api/resources');
    
    const response = await fetch('/api/resources', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    console.log('fetchResources - Response status:', response.status, 'Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('fetchResources - Response not ok. Status:', response.status, 'Error:', errorText);
      throw new Error(`Failed to fetch resources: ${response.status} ${errorText}`);
    }
    
    const resources: Resource[] = await response.json();
    
    console.log('fetchResources - All resources:', resources);
    console.log('fetchResources - Employee ID:', employeeId, 'Type:', typeof employeeId);
    
    if (employeeId !== undefined) {
      const filteredResources = resources.filter(r => {
        const isAccessible = r.accessible_to === 'all' || (Array.isArray(r.accessible_employees) && r.accessible_employees.includes(employeeId));
        console.log(`Resource "${r.title}": accessible_to=${r.accessible_to}, accessible_employees=${JSON.stringify(r.accessible_employees)}, isAccessible=${isAccessible}`);
        return isAccessible;
      });
      console.log('fetchResources - Filtered resources:', filteredResources);
      return filteredResources;
    }
    return resources;
  } catch (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
}

// Create a new resource
export async function createResource(resource: Partial<Resource>): Promise<Resource | null> {
  try {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(resource),
    });
    if (!response.ok) throw new Error('Failed to create resource');
    return await response.json();
  } catch (error) {
    console.error('Error creating resource:', error);
    return null;
  }
}

// Update a resource by id
export async function updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null> {
  try {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update resource');
    return await response.json();
  } catch (error) {
    console.error('Error updating resource:', error);
    return null;
  }
}

// Delete a resource by id
export async function deleteResource(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete resource');
    return true;
  } catch (error) {
    console.error('Error deleting resource:', error);
    return false;
  }
}

// Calculate working days between two dates (excluding weekends)
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends (0 = Sunday, 6 = Saturday)
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

// Calculate working days until start date (for future dates)
export function calculateWorkingDaysUntilStart(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  
  // Reset time to start of day for accurate comparison
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  if (start <= today) return 0; // Already started or starting today
  
  // Calculate working days from today to start date (exclusive)
  let workingDays = 0;
  const current = new Date(today);
  
  while (current < start) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends (0 = Sunday, 6 = Saturday)
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

// Calculate task due date based on milestone and task position
export function calculateTaskDueDate(startDate: string, milestone: string, taskIndex: number): string {
  const start = new Date(startDate);
  
  // Calculate due date based on milestone
  let dueDate: Date;
  
  switch (milestone) {
    case 'day_1':
      // Day 1 tasks are all on the start date
      dueDate = new Date(start);
      break;
    case 'week_1':
      // Week 1 tasks are spread across the first week (days 2-7)
      const week1Day = Math.min(taskIndex + 1, 6); // Days 2-7
      dueDate = new Date(start.getTime() + week1Day * 24 * 60 * 60 * 1000);
      break;
    case 'day_30':
      // Day 30 tasks are around day 30 (days 25-35)
      const day30Offset = Math.min(taskIndex * 3 + 25, 35); // Spread tasks between day 25-35
      dueDate = new Date(start.getTime() + day30Offset * 24 * 60 * 60 * 1000);
      break;
    case 'day_60':
      // Day 60 tasks are around day 60 (days 55-65)
      const day60Offset = Math.min(taskIndex * 3 + 55, 65); // Spread tasks between day 55-65
      dueDate = new Date(start.getTime() + day60Offset * 24 * 60 * 60 * 1000);
      break;
    case 'day_90':
      // Day 90 tasks are around day 90 (days 85-95)
      const day90Offset = Math.min(taskIndex * 3 + 85, 95); // Spread tasks between day 85-95
      dueDate = new Date(start.getTime() + day90Offset * 24 * 60 * 60 * 1000);
      break;
    default:
      // Fallback to start date
      dueDate = new Date(start);
  }
  
  return dueDate.toISOString().split('T')[0];
}

// Format due date for display
export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}

// Fetch onboarding plan for a specific new hire
export async function fetchOnboardingPlan(newHireId: number): Promise<any> {
  try {
    const response = await fetch(`/api/onboarding-plans?new_hire_id=${newHireId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch onboarding plan');
    }
    const data = await response.json();
    console.log('Fetched onboarding plan data:', data); // Debug log
    
    // The API returns an array, so we need to get the first (and should be only) plan
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    } else {
      console.log('No onboarding plan found for new hire ID:', newHireId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching onboarding plan:', error);
    return null;
  }
}

// Calculate scheduled progress as milestone fraction (1/5, 2/5, etc.)
export function calculateScheduledProgress(workdaysSinceStart: number): number {
  if (workdaysSinceStart <= 0) return 0;
  if (workdaysSinceStart >= 90) return 5;
  
  // Convert workdays to milestone progress (1/5 per milestone)
  if (workdaysSinceStart <= 5) return 1; // Week 1
  if (workdaysSinceStart <= 30) return 2; // Day 30
  if (workdaysSinceStart <= 60) return 3; // Day 60
  if (workdaysSinceStart <= 90) return 4; // Day 90
  return 5; // Completed
}

// Calculate scheduled progress for future start dates (always 0)
export function calculateScheduledProgressForFuture(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  
  if (start > today) {
    return 0; // Future start dates have 0 scheduled progress
  }
  
  return calculateScheduledProgress(0); // This will return 0 for past dates with 0 workdays
}

// Calculate actual progress as milestone fraction (1/5, 2/5, etc.) based on task completion
export function calculateActualProgress(currentMilestone: string, status: string): number {
  if (status === 'completed') return 5;
  if (status === 'not_started') return 0;
  
  // Calculate progress based on milestone completion
  switch (currentMilestone) {
    case 'not_started': return 0;
    case 'day_1': return 1;
    case 'week_1': return 2;
    case 'day_30': return 3;
    case 'day_60': return 4;
    case 'day_90': return 5;
    case 'overdue': return 5;
    default: return 0;
  }
}

// Calculate actual progress based on completed tasks within milestones
export function calculateActualProgressFromTasks(onboardingPlan: any): number {
  if (!onboardingPlan || !onboardingPlan.plan_data || !onboardingPlan.plan_data.milestones) {
    return 0;
  }

  const milestones = onboardingPlan.plan_data.milestones;
  const milestoneOrder = ['day_1', 'week_1', 'day_30', 'day_60', 'day_90'];
  
  let completedMilestones = 0;
  
  for (const milestoneId of milestoneOrder) {
    const milestone = milestones.find((m: any) => m.id === milestoneId);
    if (milestone && milestone.tasks && milestone.tasks.length > 0) {
      const completedTasks = milestone.tasks.filter((task: any) => task.status === 'completed').length;
      const totalTasks = milestone.tasks.length;
      
      // Milestone is considered completed if all tasks are completed
      if (completedTasks === totalTasks && totalTasks > 0) {
        completedMilestones++;
      } else {
        // If this milestone is not fully completed, break (milestones must be completed in order)
        break;
      }
    } else {
      break;
    }
  }
  
  return completedMilestones;
}

// Determine current milestone based on task completion
export function getCurrentMilestoneFromTasks(onboardingPlan: any): string {
  if (!onboardingPlan || !onboardingPlan.plan_data || !onboardingPlan.plan_data.milestones) {
    return 'day_1';
  }

  const milestones = onboardingPlan.plan_data.milestones;
  const milestoneOrder = ['day_1', 'week_1', 'day_30', 'day_60', 'day_90'];
  
  for (const milestoneId of milestoneOrder) {
    const milestone = milestones.find((m: any) => m.id === milestoneId);
    if (milestone && milestone.tasks && milestone.tasks.length > 0) {
      const completedTasks = milestone.tasks.filter((task: any) => task.status === 'completed').length;
      const totalTasks = milestone.tasks.length;
      
      // If this milestone is not fully completed, this is the current milestone
      if (completedTasks < totalTasks) {
        return milestoneId;
      }
    }
  }
  
  // If all milestones are completed, return 'completed'
  return 'completed';
}

// Legacy function for backward compatibility
export function calculateOnboardingProgress(workdaysSinceStart: number, status: string): number {
  return calculateActualProgress(status, status);
}

// Get status color based on onboarding status
export function getStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    'not_started': '#6B7280', // gray
    'in_progress': '#F59E0B', // orange
    'completed': '#10B981', // teal
    'overdue': '#EF4444' // red
  };
  return colorMap[status] || '#6B7280';
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get initials from name for avatar fallback
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export interface TaskComment {
  id: number;
  task_id: string;
  new_hire_id: number;
  author_name: string;
  author_email: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

// Fetch comments for a specific task
export async function fetchTaskComments(taskId: string, newHireId: number): Promise<TaskComment[]> {
  try {
    const response = await fetch(`/api/comments?taskId=${encodeURIComponent(taskId)}&newHireId=${newHireId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    const data = await response.json();
    return data.comments || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    // Fallback to in-memory store if API fails
    try {
      const { fetchTaskComments: fetchFromStore } = await import('./commentsStore');
      return await fetchFromStore(taskId, newHireId);
    } catch (fallbackError) {
      console.error('Error with fallback to in-memory store:', fallbackError);
      return [];
    }
  }
}

// Add a comment to a task
export async function addTaskComment(
  taskId: string, 
  newHireId: number, 
  authorName: string, 
  authorEmail: string, 
  commentText: string
): Promise<TaskComment | null> {
  try {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        taskId,
        newHireId,
        authorName,
        authorEmail,
        commentText
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to add comment');
    }
    const data = await response.json();
    return data.comment;
  } catch (error) {
    console.error('Error adding comment:', error);
    // Fallback to in-memory store if API fails
    try {
      const { addTaskComment: addToStore } = await import('./commentsStore');
      return await addToStore(taskId, newHireId, authorName, authorEmail, commentText);
    } catch (fallbackError) {
      console.error('Error with fallback to in-memory store:', fallbackError);
      return null;
    }
  }
}

// Update a comment
export async function updateTaskComment(
  commentId: number,
  commentText: string
): Promise<TaskComment | null> {
  try {
    const response = await fetch('/api/comments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        commentId,
        commentText
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update comment');
    }
    const data = await response.json();
    return data.comment;
  } catch (error) {
    console.error('Error updating comment:', error);
    return null;
  }
}

// Delete a comment
export async function deleteTaskComment(commentId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/comments?commentId=${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

// Growth API functions
export async function getGrowthTests(newHireId?: number): Promise<{
  tests: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    estimated_duration: number;
    isCompleted?: boolean;
    completedResult?: any;
  }>;
  completedTests: any[];
} | null> {
  try {
    const url = newHireId ? `/api/growth/tests?newHireId=${newHireId}` : '/api/growth/tests';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch growth tests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching growth tests:', error);
    return { tests: [], completedTests: [] };
  }
}

export async function submitTestResult(
  newHireId: number,
  testId: number,
  answers: any,
  resultSummary: string,
  insights: string[] = []
): Promise<any> {
  try {
    const response = await fetch('/api/growth/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        newHireId,
        testId,
        answers,
        resultSummary,
        insights
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to submit test result');
    }
    return await response.json();
  } catch (error) {
    console.error('Error submitting test result:', error);
    return null;
  }
}

export async function getGrowthInsights(newHireId: number): Promise<any> {
  try {
    const response = await fetch(`/api/growth/insights?newHireId=${newHireId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch growth insights');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching growth insights:', error);
    return { insights: [], additionalInsights: [], testResults: [] };
  }
}

export async function generateInsight(
  newHireId: number,
  insightType: string,
  prompt?: string
): Promise<any> {
  try {
    const response = await fetch('/api/growth/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        newHireId,
        insightType,
        prompt
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to generate insight');
    }
    return await response.json();
  } catch (error) {
    console.error('Error generating insight:', error);
    return null;
  }
}

// Get comment count for a specific task
export async function getTaskCommentCount(taskId: string, newHireId: number): Promise<number> {
  try {
    const response = await fetch(`/api/comments?taskId=${encodeURIComponent(taskId)}&newHireId=${newHireId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch comment count');
    }
    const data = await response.json();
    return data.comments?.length || 0;
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return 0;
  }
}

// Feedback interfaces and functions
export interface OnboardingFeedback {
  id: number;
  new_hire_id: number;
  author_id: string;
  author_name: string;
  author_role: 'employee' | 'manager' | 'buddy';
  feedback_type: 'general' | 'milestone' | 'task' | 'self_assessment';
  feedback_text: string;
  rating?: number;
  milestone_id?: string;
  task_id?: string;
  created_at: string;
  updated_at: string;
}

// Fetch feedback for a specific new hire
export async function fetchOnboardingFeedback(newHireId: number): Promise<OnboardingFeedback[]> {
  try {
    const response = await fetch(`/api/feedback?newHireId=${newHireId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch feedback');
    }
    const data = await response.json();
    return data.feedback || [];
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

// Add feedback for a new hire
export async function addOnboardingFeedback(
  newHireId: number,
  authorId: string,
  authorName: string,
  authorRole: 'employee' | 'manager' | 'buddy',
  feedbackType: 'general' | 'milestone' | 'task' | 'self_assessment',
  feedbackText: string,
  rating?: number,
  milestoneId?: string,
  taskId?: string
): Promise<OnboardingFeedback | null> {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        newHireId,
        authorId,
        authorName,
        authorRole,
        feedbackType,
        feedbackText,
        rating,
        milestoneId,
        taskId
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to add feedback');
    }
    const data = await response.json();
    return data.feedback;
  } catch (error) {
    console.error('Error adding feedback:', error);
    return null;
  }
}

// Update feedback
export async function updateOnboardingFeedback(
  feedbackId: number,
  feedbackText: string,
  feedbackType: 'general' | 'milestone' | 'task' | 'self_assessment',
  rating?: number
): Promise<OnboardingFeedback | null> {
  try {
    const response = await fetch('/api/feedback', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        feedbackId,
        feedbackText,
        feedbackType,
        rating
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update feedback');
    }
    const data = await response.json();
    return data.feedback;
  } catch (error) {
    console.error('Error updating feedback:', error);
    return null;
  }
}

// Delete feedback
export async function deleteOnboardingFeedback(feedbackId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/feedback?feedbackId=${feedbackId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete feedback');
    }
    return true;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
} 