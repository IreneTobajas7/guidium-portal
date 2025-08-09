"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { fetchManagers, fetchNewHires, fetchBuddies, fetchResources, createResource, updateResource, deleteResource, type Manager, type NewHire, type Buddy, type Resource, calculateScheduledProgress, calculateActualProgress, calculateActualProgressFromTasks, getCurrentMilestoneFromTasks, calculateWorkingDaysUntilStart, calculateScheduledProgressForFuture, getStatusColor, formatDate, getInitials, fetchOnboardingPlan, getGrowthTests, getGrowthInsights } from "@/lib/api";

// Color palette and constants (reuse from dashboard/page.tsx)
const COLORS = {
  darkBlue: "#264653",
  teal: "#2A9D8F",
  yellow: "#E9C46A",
  orange: "#F4A261",
  red: "#E76F51",
  white: "#fff",
  gray: "#f6f6f6",
  darkGray: "#6B7280", // Darker gray for NOT STARTED status
  lightGray: "#F3F4F6",
  borderGray: "#E5E7EB",
  textGray: "#6B7280",
  successGreen: "#10B981",
  warningAmber: "#F59E0B",
  errorRed: "#EF4444"
};
const NAV_TABS = {
  manager: ["Home", "Team", "Insights", "Resources"],
};
const GRADIENT_BG = "linear-gradient(135deg, #2A9D8F 0%, #264653 100%)";
const CARD_SHADOW = "0 4px 24px rgba(38,70,83,0.10)";
const CARD_RADIUS = 28;
const CARD_PADDING = 32;
const NAV_RADIUS = 32;
const NAV_BG = "rgba(255,255,255,0.85)";
const NAV_ACTIVE_BG = COLORS.teal;
const NAV_INACTIVE_BG = "rgba(255,255,255,0.5)";
const NAV_ACTIVE_COLOR = COLORS.white;
const NAV_INACTIVE_COLOR = COLORS.darkBlue;

export default function ManagerDashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(NAV_TABS.manager[0]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [onboardingPlans, setOnboardingPlans] = useState<{[key: number]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuddyAssignment, setShowBuddyAssignment] = useState(false);
  const [selectedNewHire, setSelectedNewHire] = useState<NewHire | null>(null);
  const [selectedBuddy, setSelectedBuddy] = useState<string>('');
  const [teamUpdatesCache, setTeamUpdatesCache] = useState<any>(null);
  const [lastTeamUpdatesFetch, setLastTeamUpdatesFetch] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<string>('name'); // name, start_date, status, actual_progress
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  // Growth state
  const [growthTests, setGrowthTests] = useState<any[]>([]);
  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [growthInsights, setGrowthInsights] = useState<any[]>([]);
  const [additionalInsights, setAdditionalInsights] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<NewHire | null>(null);
  const [activeGrowthCategory, setActiveGrowthCategory] = useState<'self-awareness' | 'goal-setting' | 'skill-building'>('self-awareness');
  
  // Goal and Skill management state
  const [goals, setGoals] = useState<Array<{
    id: number;
    title: string;
    description: string;
    timeframe: 'short-term' | 'medium-term' | 'long-term';
    priority: 'low' | 'medium' | 'high';
    progress: number;
    created_at: string;
    comments: Array<{
      id: number;
      text: string;
      author: string;
      created_at: string;
    }>;
  }>>([]);

  const [skills, setSkills] = useState<Array<{
    id: number;
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    targetDate: string;
    status: 'not-started' | 'in-progress' | 'completed';
    progress: number;
    created_at: string;
    comments: Array<{
      id: number;
      text: string;
      author: string;
      created_at: string;
    }>;
  }>>([]);

  // Comment editing state
  const [editingGoalComment, setEditingGoalComment] = useState<{goalId: number, commentId: number} | null>(null);
  const [editingSkillComment, setEditingSkillComment] = useState<{skillId: number, commentId: number} | null>(null);
  const [editingGoalCommentText, setEditingGoalCommentText] = useState('');
  const [editingSkillCommentText, setEditingSkillCommentText] = useState('');
  const [newGoalComment, setNewGoalComment] = useState('');
  const [newSkillComment, setNewSkillComment] = useState('');
  const [showGoalComments, setShowGoalComments] = useState<number | null>(null);
  const [showSkillComments, setShowSkillComments] = useState<number | null>(null);
  

  

  
  // Find the current manager based on authenticated user's email
  const currentManager = managers.find(manager => manager.email === user?.primaryEmailAddress?.emailAddress);
  const managerNewHires = newHires.filter(hire => hire.manager_id === currentManager?.id);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [managersData, newHiresData, buddiesData, resourcesData] = await Promise.all([
          fetchManagers(),
          fetchNewHires(),
          fetchBuddies(),
          fetchResources()
        ]);
        setManagers(managersData);
        setNewHires(newHiresData);
        setBuddies(buddiesData);
        setResources(resourcesData);

        // Fetch onboarding plans for manager's team members
        const currentManager = managersData.find(manager => manager.email === user?.primaryEmailAddress?.emailAddress);
        if (currentManager) {
          const managerNewHires = newHiresData.filter(hire => hire.manager_id === currentManager.id);
          const plans: {[key: number]: any} = {};
          
          for (const hire of managerNewHires) {
            const plan = await fetchOnboardingPlan(hire.id);
            if (plan) {
              plans[hire.id] = plan;
            }
          }
          
          setOnboardingPlans(plans);
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded]);

  // Function to schedule 1:1 meeting
  const scheduleOneOnOne = (newHire: NewHire) => {
    const managerEmail = currentManager?.email;
    const newHireEmail = newHire.email;
    
    if (!managerEmail || !newHireEmail) {
      alert('Email addresses not available for scheduling');
      return;
    }

    // Create calendar invite details
    const subject = `1:1 Meeting - ${newHire.name} & ${currentManager?.name}`;
    const description = `Onboarding 1:1 Meeting

Hi ${newHire.name},

This is a scheduled 1:1 meeting to discuss your onboarding progress and address any questions or concerns you may have.

Agenda:
- Onboarding progress review
- Questions and concerns
- Next steps and goals
- Feedback and support

Please come prepared with any questions or topics you'd like to discuss.

Best regards,
${currentManager?.name}`;

    // Create Google Calendar URL
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(subject)}&details=${encodeURIComponent(description)}&dates=${encodeURIComponent(new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace(/\.\d{3}/, '') + '/' + new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace(/[-:]/g, '').replace(/\.\d{3}/, ''))}&add=${encodeURIComponent(managerEmail)}&add=${encodeURIComponent(newHireEmail)}`;

    // Open calendar in new tab
    window.open(calendarUrl, '_blank');
  };

  // Function to assign buddies to new hires
  const assignBuddies = () => {
    const unassignedNewHires = managerNewHires.filter(hire => !hire.buddy_id);
    if (unassignedNewHires.length === 0) {
      alert('All team members already have buddies assigned!');
      return;
    }
    
    // Open the buddy assignment modal
    setShowBuddyAssignment(true);
  };

  // Function to assign a specific buddy to a new hire
  const assignBuddyToNewHire = async () => {
    if (!selectedNewHire || !selectedBuddy) {
      alert('Please select both a new hire and a buddy');
      return;
    }

    try {
      const response = await fetch('/api/new-hires', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedNewHire.id,
          buddy_id: selectedBuddy
        }),
      });

      if (response.ok) {
        // Update local state
        setNewHires(prev => prev.map(hire => 
          hire.id === selectedNewHire.id 
            ? { ...hire, buddy_id: selectedBuddy }
            : hire
        ));
        
        // Close modal and reset
        setShowBuddyAssignment(false);
        setSelectedNewHire(null);
        setSelectedBuddy('');
        
        alert(`Successfully assigned buddy to ${selectedNewHire.name}!`);
      } else {
        alert('Failed to assign buddy. Please try again.');
      }
    } catch (error) {
      console.error('Error assigning buddy:', error);
      alert('Failed to assign buddy. Please try again.');
    }
  };

  // Function to sort team members
  const getSortedTeamMembers = () => {
    const sorted = [...managerNewHires].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'start_date':
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          break;
        case 'status':
          const aActual = onboardingPlans[a.id] ? calculateActualProgressFromTasks(onboardingPlans[a.id]) : calculateActualProgress(a.current_milestone, a.calculated_status);
          const aScheduled = new Date(a.start_date) > new Date() ? calculateScheduledProgressForFuture(a.start_date) : calculateScheduledProgress(a.workdays_since_start);
          const bActual = onboardingPlans[b.id] ? calculateActualProgressFromTasks(onboardingPlans[b.id]) : calculateActualProgress(b.current_milestone, b.calculated_status);
          const bScheduled = new Date(b.start_date) > new Date() ? calculateScheduledProgressForFuture(b.start_date) : calculateScheduledProgress(b.workdays_since_start);
          
          // Create status priority (overdue = 1, in_schedule = 2, ahead = 3, not_started = 4)
          const getStatusPriority = (actual: number, scheduled: number, startDate: string) => {
            if (new Date(startDate) > new Date()) return 4; // NOT STARTED
            if (actual < scheduled) return 1; // OVERDUE
            if (actual === scheduled) return 2; // IN SCHEDULE
            return 3; // AHEAD OF SCHEDULE
          };
          
          aValue = getStatusPriority(aActual, aScheduled, a.start_date);
          bValue = getStatusPriority(bActual, bScheduled, b.start_date);
          break;
        case 'actual_progress':
          aValue = onboardingPlans[a.id] ? calculateActualProgressFromTasks(onboardingPlans[a.id]) : calculateActualProgress(a.current_milestone, a.calculated_status);
          bValue = onboardingPlans[b.id] ? calculateActualProgressFromTasks(onboardingPlans[b.id]) : calculateActualProgress(b.current_milestone, b.calculated_status);
          break;
        case 'role':
          aValue = (a.role || '').toLowerCase();
          bValue = (b.role || '').toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  // Generate team updates based on recent activity
  const generateTeamUpdates = useCallback(() => {
    const updates: TeamUpdate[] = [];
    
    // Check for recent milestone completions
    managerNewHires.forEach(hire => {
      const plan = onboardingPlans[hire.id];
      if (plan && plan.plan_data && plan.plan_data.milestones) {
        const milestones = plan.plan_data.milestones;
        const milestoneOrder = ['day_1', 'week_1', 'day_30', 'day_60', 'day_90'];
        
        milestoneOrder.forEach((milestoneId, index) => {
          const milestone = milestones.find((m: any) => m.id === milestoneId);
          if (milestone && milestone.tasks && milestone.tasks.length > 0) {
            const completedTasks = milestone.tasks.filter((task: any) => task.status === 'completed').length;
            const totalTasks = milestone.tasks.length;
            
            // If all tasks in this milestone are completed, it's a recent completion
            if (completedTasks === totalTasks && totalTasks > 0) {
              const milestoneNames = ['Day 1', 'Week 1', 'Day 30', 'Day 60', 'Day 90'];
              updates.push({
                id: `milestone-${hire.id}-${milestoneId}`,
                type: 'milestone',
                priority: 'high',
                title: `${hire.name} completed ${milestoneNames[index]}`,
                description: `All ${totalTasks} tasks in ${milestoneNames[index]} milestone have been completed`,
                timestamp: new Date().toISOString(),
                employeeId: hire.id,
                employeeName: hire.name
              });
            }
          }
        });
      }
    });
    
    // Check for employees needing buddy assignments
    const employeesNeedingBuddies = managerNewHires.filter(hire => !hire.buddy_id);
    if (employeesNeedingBuddies.length > 0) {
      updates.push({
        id: 'buddy-assignments',
        type: 'buddy',
        priority: 'critical',
        title: `${employeesNeedingBuddies.length} new hire${employeesNeedingBuddies.length !== 1 ? 's' : ''} need${employeesNeedingBuddies.length !== 1 ? '' : 's'} buddy assignment${employeesNeedingBuddies.length !== 1 ? 's' : ''}`,
        description: employeesNeedingBuddies.map(h => h.name).join(', '),
        timestamp: new Date().toISOString(),
        employeeId: null,
        employeeName: null
      });
    }
    
    // Check for overdue employees
    const overdueEmployees = managerNewHires.filter(hire => {
      const plan = onboardingPlans[hire.id];
      if (!plan) return false;
      
      const actualProgress = calculateActualProgressFromTasks(plan);
      const scheduledProgress = new Date(hire.start_date) > new Date() 
        ? calculateScheduledProgressForFuture(hire.start_date)
        : calculateScheduledProgress(hire.workdays_since_start);
      
      return actualProgress < scheduledProgress && new Date(hire.start_date) <= new Date();
    });
    
    if (overdueEmployees.length > 0) {
      updates.push({
        id: 'overdue-employees',
        type: 'overdue',
        priority: 'critical',
        title: `${overdueEmployees.length} employee${overdueEmployees.length !== 1 ? 's' : ''} ${overdueEmployees.length !== 1 ? 'are' : 'is'} behind schedule`,
        description: overdueEmployees.map(h => h.name).join(', '),
        timestamp: new Date().toISOString(),
        employeeId: null,
        employeeName: null
      });
    }
    
    // Check for employees ahead of schedule
    const aheadEmployees = managerNewHires.filter(hire => {
      const plan = onboardingPlans[hire.id];
      if (!plan) return false;
      
      const actualProgress = calculateActualProgressFromTasks(plan);
      const scheduledProgress = new Date(hire.start_date) > new Date() 
        ? calculateScheduledProgressForFuture(hire.start_date)
        : calculateScheduledProgress(hire.workdays_since_start);
      
      return actualProgress > scheduledProgress && new Date(hire.start_date) <= new Date();
    });
    
    if (aheadEmployees.length > 0) {
      updates.push({
        id: 'ahead-employees',
        type: 'ahead',
        priority: 'medium',
        title: `${aheadEmployees.length} employee${aheadEmployees.length !== 1 ? 's' : ''} ${aheadEmployees.length !== 1 ? 'are' : 'is'} ahead of schedule`,
        description: aheadEmployees.map(h => h.name).join(', '),
        timestamp: new Date().toISOString(),
        employeeId: null,
        employeeName: null
      });
    }
    
    // Sort by priority and timestamp
    return updates.sort((a, b) => {
      const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [managerNewHires, onboardingPlans]);

  // Function to delete team member
  const deleteTeamMember = async (newHire: NewHire) => {
    if (!confirm(`Are you sure you want to delete ${newHire.name} from your team? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/new-hires/${newHire.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Remove from local state
        setNewHires(prev => prev.filter(hire => hire.id !== newHire.id));
        alert(`✅ ${newHire.name} has been removed from your team.`);
      } else {
        throw new Error('Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('❌ Failed to delete team member. Please try again.');
    }
  };

  // Resource management functions
  const addResource = async (resourceData: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await createResource(resourceData);
    if (result) {
      setResources(prev => [...prev, result]);
      setShowAddResource(false);
    }
  };

  const handleUpdateResource = async (resourceId: string, updates: any) => {
    const result = await updateResource(resourceId, updates);
    if (result) {
      setResources(prev => prev.map(resource => 
        resource.id === resourceId ? result : resource
      ));
      setEditingResource(null);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }
    
    const success = await deleteResource(resourceId);
    if (success) {
      setResources(prev => prev.filter(resource => resource.id !== resourceId));
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'link': return '🔗';
      case 'file': return '📄';
      default: return '📎';
    }
  };

  const getAccessibleEmployeesText = (resource: any) => {
    if (resource.accessible_to === 'all') {
      return 'All employees';
    }
    
    const employeeCount = resource.accessible_employees.length;
    if (employeeCount === 0) {
      return 'No employees';
    }
    
    const employeeNames = resource.accessible_employees
      .map((id: number) => managerNewHires.find(hire => hire.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    
    return `${employeeCount} employee${employeeCount !== 1 ? 's' : ''}: ${employeeNames}`;
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Growth-related functions
  const fetchGrowthData = async (employeeId: number) => {
    try {
      const testsData = await getGrowthTests(employeeId);
      const insightsData = await getGrowthInsights(employeeId);

      setGrowthTests(testsData?.tests || []);
      setCompletedTests(testsData?.completedTests || []);
      setGrowthInsights(insightsData?.insights || []);
      setAdditionalInsights(insightsData?.additionalInsights || []);
      
      // For now, we'll use sample data for goals and skills
      // In a real implementation, these would be fetched from the database
      setGoals([
        {
          id: 1,
          title: "Improve public speaking skills",
          description: "Become more confident in presenting to large groups",
          timeframe: "medium-term",
          priority: "high",
          progress: 60,
          created_at: "2024-01-15",
          comments: [
            {
              id: 1,
              text: "Started attending Toastmasters meetings weekly",
              author: "Employee",
              created_at: "2024-01-20"
            },
            {
              id: 2,
              text: "Great initiative! Consider also joining the internal presentation skills workshop",
              author: "Manager",
              created_at: "2024-01-22"
            }
          ]
        },
        {
          id: 2,
          title: "Learn advanced data analysis",
          description: "Master Excel and SQL for better reporting",
          timeframe: "long-term",
          priority: "medium",
          progress: 25,
          created_at: "2024-01-10",
          comments: [
            {
              id: 3,
              text: "Enrolled in online SQL course",
              author: "Employee",
              created_at: "2024-01-18"
            }
          ]
        }
      ]);

      setSkills([
        {
          id: 1,
          name: "Project Management",
          description: "Learn to manage multiple projects effectively",
          priority: "high",
          targetDate: "2024-06-30",
          status: "in-progress",
          progress: 75,
          created_at: "2024-01-12",
          comments: [
            {
              id: 1,
              text: "Completed PMP certification course",
              author: "Employee",
              created_at: "2024-01-25"
            },
            {
              id: 2,
              text: "Excellent progress! Ready to lead the Q2 project",
              author: "Manager",
              created_at: "2024-01-26"
            }
          ]
        },
        {
          id: 2,
          name: "Advanced Excel",
          description: "Master pivot tables, VLOOKUP, and data visualization",
          priority: "medium",
          targetDate: "2024-04-15",
          status: "not-started",
          progress: 0,
          created_at: "2024-01-08",
          comments: []
        }
      ]);
    } catch (error) {
      console.error('Error fetching growth data:', error);
    }
  };

  const handleEmployeeSelect = (employee: NewHire) => {
    setSelectedEmployee(employee);
    fetchGrowthData(employee.id);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'personality': return '🧠';
      case 'leadership': return '👑';
      case 'communication': return '💬';
      case 'development': return '📈';
      case 'strengths': return '💪';
      default: return '💡';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'personality': return COLORS.teal;
      case 'leadership': return COLORS.yellow;
      case 'communication': return COLORS.orange;
      case 'development': return COLORS.darkBlue;
      case 'strengths': return COLORS.successGreen;
      default: return COLORS.gray;
    }
  };

  // Goal and Skill management functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return COLORS.errorRed;
      case 'medium': return COLORS.warningAmber;
      case 'low': return COLORS.successGreen;
      default: return COLORS.textGray;
    }
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'short-term': return COLORS.successGreen;
      case 'medium-term': return COLORS.warningAmber;
      case 'long-term': return COLORS.errorRed;
      default: return COLORS.textGray;
    }
  };

  // Comment management functions
  const handleAddGoalComment = (goalId: number) => {
    if (newGoalComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newGoalComment,
        author: currentManager?.name || "Manager",
        created_at: new Date().toISOString().split('T')[0]
      };
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, comments: [...goal.comments, comment] }
          : goal
      ));
      setNewGoalComment('');
    }
  };

  const handleAddSkillComment = (skillId: number) => {
    if (newSkillComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newSkillComment,
        author: currentManager?.name || "Manager",
        created_at: new Date().toISOString().split('T')[0]
      };
      setSkills(prev => prev.map(skill => 
        skill.id === skillId 
          ? { ...skill, comments: [...skill.comments, comment] }
          : skill
      ));
      setNewSkillComment('');
    }
  };

  const startEditGoalComment = (goalId: number, commentId: number, commentText: string) => {
    setEditingGoalComment({ goalId, commentId });
    setEditingGoalCommentText(commentText);
  };

  const startEditSkillComment = (skillId: number, commentId: number, commentText: string) => {
    setEditingSkillComment({ skillId, commentId });
    setEditingSkillCommentText(commentText);
  };

  const handleEditGoalComment = () => {
    if (editingGoalComment && editingGoalCommentText.trim()) {
      setGoals(prev => prev.map(goal => 
        goal.id === editingGoalComment.goalId 
          ? { 
              ...goal, 
              comments: goal.comments.map(comment => 
                comment.id === editingGoalComment.commentId 
                  ? { ...comment, text: editingGoalCommentText.trim() }
                  : comment
              )
            }
          : goal
      ));
      setEditingGoalComment(null);
      setEditingGoalCommentText('');
    }
  };

  const handleEditSkillComment = () => {
    if (editingSkillComment && editingSkillCommentText.trim()) {
      setSkills(prev => prev.map(skill => 
        skill.id === editingSkillComment.skillId 
          ? { 
              ...skill, 
              comments: skill.comments.map(comment => 
                comment.id === editingSkillComment.commentId 
                  ? { ...comment, text: editingSkillCommentText.trim() }
                  : comment
              )
            }
          : skill
      ));
      setEditingSkillComment(null);
      setEditingSkillCommentText('');
    }
  };

  const handleDeleteGoalComment = (goalId: number, commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, comments: goal.comments.filter(comment => comment.id !== commentId) }
        : goal
    ));
  };

  const handleDeleteSkillComment = (skillId: number, commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, comments: skill.comments.filter(comment => comment.id !== commentId) }
        : skill
    ));
  };



  // Calculate dashboard metrics from real data (filtered for current manager)
  const totalNewHires = managerNewHires.length;
  const overdueItems = managerNewHires.filter(hire => hire.calculated_status === 'overdue').length;
  const actionsPending = managerNewHires.filter(hire => hire.calculated_status === 'in_progress').length;
  const completedItems = managerNewHires.filter(hire => hire.calculated_status === 'completed').length;

  // Calculate pending actions from Team Updates
  const pendingActionsCount = (() => {
    const updates = generateTeamUpdates();
    return updates.filter((update: any) => update.type === 'overdue' || update.type === 'buddy').length;
  })();

  const DASHBOARD_CARDS = [
    { title: "# New Hires", value: totalNewHires, color: COLORS.teal },
    { title: "# Onboarding", value: actionsPending, color: COLORS.orange },
    { title: "# Completed", value: completedItems, color: COLORS.teal },
    { 
      title: "# Pending Actions", 
      value: pendingActionsCount, 
      color: COLORS.red, 
      onClick: () => {
        // Scroll to Team Updates section with proper offset
        const teamUpdatesSection = document.getElementById('team-updates-section');
        if (teamUpdatesSection) {
          const offset = 100; // Add offset to account for header
          const elementPosition = teamUpdatesSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  ];

  if (!isLoaded || loading) {
    return (
      <div style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.white,
        fontSize: "18px"
      }}>
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.white,
        fontSize: "18px"
      }}>
        Please sign in to access the manager dashboard.
      </div>
    );
  }

  if (!currentManager) {
    return (
      <div style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.white,
        fontSize: "18px"
      }}>
        Access denied. You are not registered as a manager.
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.white,
        fontSize: "18px"
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        paddingBottom: 40,
      }}
    >
      {/* Top Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: NAV_BG,
          padding: "1.5rem 2rem 1rem 2rem",
          boxShadow: "0 2px 16px rgba(38,70,83,0.10)",
          borderRadius: `0 0 ${NAV_RADIUS}px ${NAV_RADIUS}px`,
          marginBottom: "2.5rem",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image src="/guidium-logo.png" alt="Guidium Logo" width={90} height={90} style={{ display: "block" }} />
        </div>
        <div style={{ display: "flex", gap: "1.5rem", background: "rgba(42,157,143,0.08)", borderRadius: NAV_RADIUS, padding: "0.25rem 1rem" }}>
          {NAV_TABS.manager.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? NAV_ACTIVE_BG : NAV_INACTIVE_BG,
                border: "none",
                fontWeight: 700,
                fontSize: 18,
                color: activeTab === tab ? NAV_ACTIVE_COLOR : NAV_INACTIVE_COLOR,
                borderRadius: NAV_RADIUS,
                padding: "0.5rem 1.5rem",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
                boxShadow: activeTab === tab ? "0 2px 8px rgba(42,157,143,0.12)" : "none",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            justifyContent: "space-between"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}
          >
            <Link href="/app/add-new-hire" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  background: COLORS.darkBlue,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 20px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(38,70,83,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(38,70,83,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(38,70,83,0.2)";
                }}
              >
                Add New Hire
              </button>
            </Link>
            <SignOutButton>
              <button
                style={{
                  background: "#264653",
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
              >
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "0 2rem" }}>
        {/* Tab Content Section */}
        <section
          style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: CARD_RADIUS,
            boxShadow: CARD_SHADOW,
            padding: `${CARD_PADDING + 12}px 2rem` ,
            minHeight: 340,
            marginBottom: 40,
            display: "flex",
            flexDirection: "column",
            gap: activeTab === "Resources" ? "1.5rem" : "2.5rem",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.darkBlue,
              marginBottom: activeTab === "Resources" ? 4 : 12,
            }}
          >
            {activeTab === "Home" && currentManager ? (
              <>
                Hello, {currentManager.name}! 👋
              </>
            ) : activeTab === "Resources" ? (
              "Resources Library"
            ) : (
              `${activeTab} Overview`
            )}
          </h2>
          
          {activeTab === "Resources" && (
            <p style={{ 
              fontSize: 16, 
              color: COLORS.textGray, 
              marginBottom: 24,
              marginTop: 0,
              lineHeight: 1.4
            }}>
              Manage and share resources with your team members during their onboarding journey
            </p>
          )}
          
          {/* Home Tab Content */}
          {activeTab === "Home" && (
            <>
              {/* Dashboard Widgets - Only on Home Tab */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                {DASHBOARD_CARDS.map((card, idx) => (
                  <div
                    key={card.title}
                    style={{
                      background: COLORS.white,
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      border: `1px solid ${COLORS.borderGray}`,
                      minHeight: 80,
                      position: "relative",
                      cursor: card.onClick ? "pointer" : "default",
                      transition: card.onClick ? "all 0.2s ease" : "none",
                    }}
                    onClick={card.onClick}
                    onMouseEnter={card.onClick ? (e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
                    } : undefined}
                    onMouseLeave={card.onClick ? (e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    } : undefined}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: card.color,
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color: COLORS.darkBlue,
                        letterSpacing: 1,
                      }}
                    >
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions Section */}
              <div style={{
                background: COLORS.white,
                borderRadius: 12,
                padding: "1.5rem",
                border: `1px solid ${COLORS.borderGray}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                marginBottom: "1.5rem"
              }}>
                <div style={{
                  background: COLORS.teal,
                  color: COLORS.white,
                  padding: "1rem 1.5rem",
                  borderRadius: "12px 12px 0 0",
                  margin: "-1.5rem -1.5rem 1.5rem -1.5rem",
                  fontWeight: 600,
                  fontSize: 16
                }}>
                  Quick Actions
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <Link href="/app/add-new-hire" style={{ textDecoration: 'none' }}>
                    <button style={{
                      background: COLORS.darkBlue,
                      color: COLORS.white,
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 14,
                      width: "100%",
                      transition: "all 0.2s",
                      boxShadow: "0 4px 12px rgba(38,70,83,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(38,70,83,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(38,70,83,0.2)";
                    }}
                    >
                      Add New Hire
                    </button>
                  </Link>
                  {overdueItems > 0 && (
                    <button style={{
                      background: COLORS.darkBlue,
                      color: COLORS.white,
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 14,
                      width: "100%",
                      transition: "all 0.2s",
                      boxShadow: "0 4px 12px rgba(38,70,83,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(38,70,83,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(38,70,83,0.2)";
                    }}
                    onClick={() => {
                      // Filter to show only overdue team members
                      const overdueTeamMembers = managerNewHires.filter(hire => {
                        const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                        const scheduled = new Date(hire.start_date) > new Date() ? calculateScheduledProgressForFuture(hire.start_date) : calculateScheduledProgress(hire.workdays_since_start);
                        return actual < scheduled && new Date(hire.start_date) <= new Date();
                      });
                      
                      if (overdueTeamMembers.length === 0) {
                        alert('No overdue team members found!');
                        return;
                      }
                      
                      // Navigate to team tab with overdue filter
                      setActiveTab("Team");
                      // You could add a filter state here to highlight overdue members
                      alert(`Found ${overdueTeamMembers.length} overdue team member(s). Check the Team tab for details.`);
                    }}
                    >
                      Review Overdue ({overdueItems})
                    </button>
                  )}
                  {managerNewHires.filter(hire => !hire.buddy_id).length > 0 && (
                    <button style={{
                      background: COLORS.darkBlue,
                      color: COLORS.white,
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 14,
                      width: "100%",
                      transition: "all 0.2s",
                      boxShadow: "0 4px 12px rgba(38,70,83,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(38,70,83,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(38,70,83,0.2)";
                    }}
                    onClick={assignBuddies}
                    >
                      Assign Buddies ({managerNewHires.filter(hire => !hire.buddy_id).length})
                    </button>
                  )}
                  <button style={{
                    background: COLORS.darkBlue,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    width: "100%",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(38,70,83,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(38,70,83,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(38,70,83,0.2)";
                  }}
                  onClick={() => router.push('/app/dashboard/reports')}
                  >
                    View Reports
                  </button>
                </div>
              </div>

              {/* Home Overview Section */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
                {/* Quick Insights */}
                <div style={{ 
                  background: COLORS.white, 
                  borderRadius: 16, 
                  border: `2px solid ${COLORS.borderGray}`,
                  padding: 24,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    marginBottom: 16,
                    padding: "12px 16px",
                    background: COLORS.teal,
                    borderRadius: 12,
                    color: COLORS.white
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Quick Insights</div>
                    <button onClick={() => setActiveTab("Insights")} style={{
                      background: "rgba(255,255,255,0.2)",
                      color: COLORS.white,
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "all 0.2s"
                    }}>
                      More Insights
                    </button>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "0.75rem",
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "8px"
                  }}>
                    <div style={{ 
                      padding: "0.75rem", 
                      background: `${COLORS.teal}10`, 
                      borderRadius: 8,
                      borderLeft: `3px solid ${COLORS.teal}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.25rem" }}>
                        Team Overview
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textGray }}>
                        {managerNewHires.length} team members • {managerNewHires.filter(hire => hire.calculated_status === 'in_progress').length} in progress • {managerNewHires.filter(hire => hire.calculated_status === 'not_started').length} not started
                      </div>
                    </div>

                    <div style={{ 
                      padding: "0.75rem", 
                      background: `${COLORS.successGreen}10`, 
                      borderRadius: 8,
                      borderLeft: `3px solid ${COLORS.successGreen}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.25rem" }}>
                        Next Steps
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textGray }}>
                        Review onboarding progress and schedule 1:1 meetings with new team members
                      </div>
                    </div>

                    <div style={{ 
                      padding: "0.75rem", 
                      background: `${COLORS.warningAmber}10`, 
                      borderRadius: 8,
                      borderLeft: `3px solid ${COLORS.warningAmber}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.25rem" }}>
                        Performance Insights
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textGray }}>
                        {managerNewHires.filter(hire => hire.calculated_status === 'completed').length} team members have completed their onboarding
                      </div>
                    </div>

                    <div style={{ 
                      padding: "0.75rem", 
                      background: `${COLORS.errorRed}10`, 
                      borderRadius: 8,
                      borderLeft: `3px solid ${COLORS.errorRed}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.25rem" }}>
                        Attention Needed
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textGray }}>
                        {managerNewHires.filter(hire => !hire.buddy_id).length} team members need buddy assignments
                      </div>
                    </div>

                    <div style={{ 
                      padding: "0.75rem", 
                      background: `${COLORS.orange}10`, 
                      borderRadius: 8,
                      borderLeft: `3px solid ${COLORS.orange}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.25rem" }}>
                        Resource Usage
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textGray }}>
                        {resources.length} resources available for team onboarding
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Contacts */}
                <div style={{ 
                  background: COLORS.white, 
                  borderRadius: 12, 
                  padding: 20,
                  border: `2px solid ${COLORS.borderGray}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    marginBottom: 20,
                    padding: "12px 16px",
                    background: COLORS.teal,
                    borderRadius: 12,
                    color: COLORS.white
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>Key Contacts</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                    <div style={{ 
                      background: COLORS.lightGray, 
                      borderRadius: 8, 
                      padding: 12,
                      border: `1px solid ${COLORS.borderGray}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: 4, fontSize: 13 }}>HR Support</div>
                      <div style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>Sarah Johnson</div>
                      <div style={{ fontSize: 11, color: COLORS.textGray }}>sarah.johnson@company.com</div>
                    </div>
                    <div style={{ 
                      background: COLORS.lightGray, 
                      borderRadius: 8, 
                      padding: 12,
                      border: `1px solid ${COLORS.borderGray}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: 4, fontSize: 13 }}>IT Support</div>
                      <div style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>Mike Chen</div>
                      <div style={{ fontSize: 11, color: COLORS.textGray }}>mike.chen@company.com</div>
                    </div>
                    <div style={{ 
                      background: COLORS.lightGray, 
                      borderRadius: 8, 
                      padding: 12,
                      border: `1px solid ${COLORS.borderGray}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: 4, fontSize: 13 }}>Facilities</div>
                      <div style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 2 }}>Lisa Rodriguez</div>
                      <div style={{ fontSize: 11, color: COLORS.textGray }}>lisa.rodriguez@company.com</div>
                    </div>
                  </div>
                </div>

                {/* Team Updates */}
                <div id="team-updates-section" style={{ 
                  background: COLORS.white, 
                  borderRadius: 16, 
                  border: `2px solid ${COLORS.borderGray}`,
                  padding: 24,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    marginBottom: 16,
                    padding: "12px 16px",
                    background: COLORS.teal,
                    borderRadius: 12,
                    color: COLORS.white
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Team Updates</div>
                  </div>
                  <div style={{ 
                    color: COLORS.darkBlue, 
                    fontSize: 14, 
                    lineHeight: 1.6,
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "8px"
                  }}>
                    {(() => {
                      const updates = generateTeamUpdates();
                      
                      if (updates.length === 0) {
                        // Show some basic insights even when no specific updates
                        const totalNewHires = managerNewHires.length;
                        const newHiresWithBuddies = managerNewHires.filter(hire => hire.buddy_id).length;
                        const newHiresNeedingBuddies = totalNewHires - newHiresWithBuddies;
                        
                        return (
                          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: `${COLORS.successGreen}10`, borderLeft: `3px solid ${COLORS.successGreen}` }}>
                              <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: 2 }}>Team Overview</div>
                              <div style={{ fontSize: 13, color: COLORS.textGray }}>
                                {totalNewHires} team member{totalNewHires !== 1 ? 's' : ''} in your onboarding programme
                              </div>
                            </div>
                            {newHiresNeedingBuddies > 0 && (
                              <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: `${COLORS.warningAmber}10`, borderLeft: `3px solid ${COLORS.warningAmber}` }}>
                                <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: 2 }}>Buddy Assignments</div>
                                <div style={{ fontSize: 13, color: COLORS.textGray }}>
                                  {newHiresNeedingBuddies} new hire{newHiresNeedingBuddies !== 1 ? 's' : ''} still need{newHiresNeedingBuddies !== 1 ? '' : 's'} buddy assignment{newHiresNeedingBuddies !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                            <div style={{ fontStyle: 'italic', opacity: 0.7, fontSize: 13 }}>
                              All team members are on track with their onboarding progress. Check back later for updates.
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                          {updates.slice(0, 4).map((update, index) => {
                            const getPriorityColor = (priority: string) => {
                              switch (priority) {
                                case 'critical': return COLORS.errorRed;
                                case 'high': return COLORS.warningAmber;
                                case 'medium': return COLORS.successGreen;
                                default: return COLORS.textGray;
                              }
                            };
                            
                            const getPriorityBackground = (priority: string) => {
                              switch (priority) {
                                case 'critical': return `${COLORS.errorRed}10`;
                                case 'high': return `${COLORS.warningAmber}10`;
                                case 'medium': return `${COLORS.successGreen}10`;
                                default: return `${COLORS.textGray}10`;
                              }
                            };
                            
                            return (
                              <div 
                                key={update.id}
                                style={{ 
                                  marginBottom: index < Math.min(updates.length, 4) - 1 ? 12 : 0, 
                                  padding: '12px 16px', 
                                  borderRadius: 8, 
                                  background: getPriorityBackground(update.priority), 
                                  borderLeft: `3px solid ${getPriorityColor(update.priority)}`,
                                  border: `1px solid ${COLORS.borderGray}`
                                }}
                              >
                                <div style={{ 
                                  fontWeight: 600, 
                                  color: COLORS.darkBlue, 
                                  marginBottom: 4,
                                  fontSize: 15
                                }}>
                                  {update.title}
                                </div>
                                <div style={{ 
                                  fontSize: 13, 
                                  color: COLORS.textGray,
                                  marginBottom: 4
                                }}>
                                  {update.description}
                                </div>
                                <div style={{ 
                                  fontSize: 11, 
                                  color: COLORS.textGray,
                                  opacity: 0.7
                                }}>
                                  {new Date(update.timestamp).toLocaleString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Team Overview */}
              <div style={{ 
                background: COLORS.white, 
                borderRadius: 16, 
                border: `2px solid ${COLORS.borderGray}`,
                padding: 24,
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: 20,
                  padding: "12px 16px",
                  background: COLORS.teal,
                  borderRadius: 12,
                  color: COLORS.white
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Team Overview</div>
                  </div>
                  <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab("Team"); }} style={{ textDecoration: 'none' }}>
                    <button style={{
                      background: "rgba(255,255,255,0.2)",
                      color: COLORS.white,
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 11,
                      transition: "all 0.2s"
                    }}>
                      View All
                    </button>
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                  {getSortedTeamMembers().slice(0, 3).map((hire) => (
                    <div key={hire.id} style={{ 
                      background: COLORS.white, 
                      borderRadius: 12, 
                      padding: 20,
                      border: `2px solid ${COLORS.borderGray}`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: "50%", 
                          background: COLORS.darkBlue, 
                          color: COLORS.white, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontWeight: 700, 
                          fontSize: 16 
                        }}>
                          {getInitials(hire.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>{hire.name}</div>
                          <div style={{ color: COLORS.darkBlue, opacity: 0.7, fontSize: 14 }}>{hire["surname(s)"]}</div>
                        </div>
                        <Link href={`/app/dashboard/team/${hire.id}?returnUrl=${encodeURIComponent(window.location.pathname)}`} style={{ textDecoration: 'none' }}>
                          <button style={{
                            background: COLORS.darkBlue,
                            color: COLORS.white,
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 11,
                            transition: "all 0.2s",
                            boxShadow: "0 2px 6px rgba(38,70,83,0.2)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(38,70,83,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(38,70,83,0.2)";
                          }}
                          >
                            View Plan
                          </button>
                        </Link>
                      </div>
                      <div style={{ color: COLORS.darkBlue, fontSize: 14, lineHeight: 1.5 }}>
                        <div style={{ marginBottom: 6 }}><strong>Status:</strong> <span style={{ 
                          color: (() => {
                            // If start date is in the future, show dark gray for NOT STARTED
                            if (new Date(hire.start_date) > new Date()) {
                              return COLORS.darkGray;
                            }
                            const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                            const scheduled = new Date(hire.start_date) > new Date() 
                              ? calculateScheduledProgressForFuture(hire.start_date)
                              : calculateScheduledProgress(hire.workdays_since_start);
                            
                            if (actual < scheduled) return COLORS.errorRed;
                            if (actual === scheduled) return COLORS.successGreen;
                            return COLORS.warningAmber;
                          })(),
                          fontWeight: 700
                        }}>{(() => {
                          // If start date is in the future, show NOT STARTED
                          if (new Date(hire.start_date) > new Date()) {
                            return 'NOT STARTED';
                          }
                          const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                          const scheduled = new Date(hire.start_date) > new Date() 
                            ? calculateScheduledProgressForFuture(hire.start_date)
                            : calculateScheduledProgress(hire.workdays_since_start);
                          if (actual < scheduled) return 'OVERDUE';
                          if (actual === scheduled) return 'IN SCHEDULE';
                          return 'AHEAD OF SCHEDULE';
                        })()}</span></div>
                        <div style={{ marginBottom: 6 }}><strong>Buddy:</strong> {(() => {
                          const buddy = buddies.find(b => b.id === hire.buddy_id);
                          return buddy ? `${buddy.name} ${buddy["surname (s)"] || ''}`.trim() : 'Not assigned';
                        })()}</div>
                        <div style={{ marginBottom: 6 }}><strong>Role:</strong> {hire.role || 'Not set'}</div>
                        <div><strong>{new Date(hire.start_date) > new Date() ? 'Days until start date:' : 'Days since joining:'}</strong> {
                          new Date(hire.start_date) > new Date() 
                            ? `${calculateWorkingDaysUntilStart(hire.start_date)} days`
                            : `${hire.workdays_since_start} days`
                        }</div>
                      </div>
                      {(() => {
                        const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                        const scheduled = new Date(hire.start_date) > new Date() 
                          ? calculateScheduledProgressForFuture(hire.start_date)
                          : calculateScheduledProgress(hire.workdays_since_start);
                        if (actual < scheduled) {
                          return (
                            <button
                              style={{
                                background: COLORS.errorRed,
                                color: COLORS.white,
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 13,
                                marginTop: 8
                              }}
                              onClick={() => scheduleOneOnOne(hire)}
                            >
                              Schedule 1:1
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Team Tab Content */}
          {activeTab === "Team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* Team Overview Section */}
              <div>
                {/* Sorting Controls */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  background: COLORS.lightGray,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.borderGray}`
                }}>
                  <div style={{ fontWeight: 600, color: COLORS.darkBlue, fontSize: 16 }}>
                    Team Members ({managerNewHires.length})
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label style={{ fontSize: 14, color: COLORS.darkBlue, fontWeight: 600 }}>
                        Sort by:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: `1px solid ${COLORS.borderGray}`,
                          fontSize: 14,
                          background: COLORS.white,
                          color: COLORS.darkBlue,
                          cursor: "pointer"
                        }}
                      >
                        <option value="name">Name</option>
                        <option value="start_date">Start Date</option>
                        <option value="status">Status</option>
                        <option value="actual_progress">Actual Progress</option>
                        <option value="role">Role</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${COLORS.borderGray}`,
                        background: COLORS.white,
                        color: COLORS.darkBlue,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </button>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
                  {getSortedTeamMembers().map((hire) => (
                    <div key={hire.id} style={{ 
                      background: COLORS.white, 
                      borderRadius: 16, 
                      padding: 24,
                      border: `1px solid ${COLORS.borderGray}`,
                      boxShadow: "0 4px 16px rgba(38,70,83,0.08)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16, minHeight: 72 }}>
                        <div style={{ 
                          width: 56, 
                          height: 56, 
                          borderRadius: "50%", 
                          background: COLORS.darkBlue, 
                          color: COLORS.white, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontWeight: 700, 
                          fontSize: 20,
                          flexShrink: 0
                        }}>
                          {getInitials(hire.name)}
                        </div>
                        <div style={{ flex: 1, minHeight: 56, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontWeight: 800, color: COLORS.darkBlue, fontSize: 18, marginBottom: 4 }}>{hire.name}</div>
                            <div style={{ 
                              color: COLORS.darkBlue, 
                              opacity: 0.7, 
                              fontSize: 14, 
                              lineHeight: 1.3,
                              minHeight: 18,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>{hire.role || 'Role not set'}</div>
                          </div>
                        </div>
                        <span style={{
                          background: (() => {
                            // If start date is in the future, show dark gray for NOT STARTED
                            if (new Date(hire.start_date) > new Date()) {
                              return COLORS.darkGray;
                            }
                            const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                            const scheduled = new Date(hire.start_date) > new Date() 
                              ? calculateScheduledProgressForFuture(hire.start_date)
                              : calculateScheduledProgress(hire.workdays_since_start);
                            if (actual < scheduled) return COLORS.errorRed;
                            if (actual === scheduled) return COLORS.successGreen;
                            return COLORS.warningAmber; // Ahead of schedule
                          })(),
                          color: COLORS.white,
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          flexShrink: 0,
                          alignSelf: "flex-start"
                        }}>
                          {(() => {
                            // If start date is in the future, show NOT STARTED
                            if (new Date(hire.start_date) > new Date()) {
                              return 'NOT STARTED';
                            }
                            const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                            const scheduled = new Date(hire.start_date) > new Date() 
                              ? calculateScheduledProgressForFuture(hire.start_date)
                              : calculateScheduledProgress(hire.workdays_since_start);
                            if (actual < scheduled) return 'OVERDUE';
                            if (actual === scheduled) return 'IN SCHEDULE';
                            return 'AHEAD OF SCHEDULE';
                          })()}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: COLORS.darkBlue, fontWeight: 600 }}>Scheduled Progress:</span>
                          <span style={{ fontSize: 18, color: COLORS.darkBlue, fontWeight: 800, marginLeft: "1rem" }}>
                            {(() => {
                              const scheduledProgress = new Date(hire.start_date) > new Date() 
                                ? calculateScheduledProgressForFuture(hire.start_date)
                                : calculateScheduledProgress(hire.workdays_since_start);
                              return `${scheduledProgress}/5`;
                            })()}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: COLORS.darkBlue, fontWeight: 600 }}>Actual Progress:</span>
                          <span style={{ color: COLORS.darkBlue, fontWeight: 600 }}>
                            <span style={{ 
                              color: (() => {
                                const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                                const scheduled = new Date(hire.start_date) > new Date() 
                                  ? calculateScheduledProgressForFuture(hire.start_date)
                                  : calculateScheduledProgress(hire.workdays_since_start);
                                if (actual < scheduled) return COLORS.errorRed;
                                if (actual === scheduled) return COLORS.successGreen;
                                return COLORS.warningAmber;
                              })(),
                              fontWeight: 800
                            }}>
                              {onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status)}
                            </span>
                            <span style={{ color: COLORS.darkBlue, fontWeight: 800 }}>/5</span>
                          </span>
                        </div>
                        <div style={{ position: "relative", marginBottom: 20 }}>
                          {/* Progress bar container */}
                          <div style={{ 
                            height: 12, 
                            background: COLORS.lightGray, 
                            borderRadius: 6, 
                            overflow: "hidden", 
                            position: "relative",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
                          }}>
                            {/* Progress fill */}
                            <div style={{ 
                              width: `${(() => {
                                const scheduledProgress = new Date(hire.start_date) > new Date() 
                                  ? calculateScheduledProgressForFuture(hire.start_date)
                                  : calculateScheduledProgress(hire.workdays_since_start);
                                return (scheduledProgress / 5) * 100;
                              })()}%`, 
                              height: 12, 
                              background: '#B0B6C3', // More visible, darker grey
                              borderRadius: 6,
                              transition: "width 0.5s ease-out",
                              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
                            }} />
                            {/* Actual progress overlay */}
                            <div style={{ 
                              width: `${(() => {
                                const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                                return (actual / 5) * 100;
                              })()}%`, 
                              height: 12, 
                              background: (() => {
                                const actual = onboardingPlans[hire.id] ? calculateActualProgressFromTasks(onboardingPlans[hire.id]) : calculateActualProgress(hire.current_milestone, hire.calculated_status);
                                const scheduled = new Date(hire.start_date) > new Date() 
                                  ? calculateScheduledProgressForFuture(hire.start_date)
                                  : calculateScheduledProgress(hire.workdays_since_start);
                                if (actual < scheduled) return COLORS.errorRed;
                                if (actual === scheduled) return COLORS.successGreen;
                                return COLORS.warningAmber;
                              })(),
                              borderRadius: 6,
                              transition: "width 0.5s ease-out",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                              position: "absolute",
                              top: 0,
                              left: 0,
                              zIndex: 1
                            }} />
                            
                            {/* Milestone markers - 5 markers for Day 1, Week 1, Day 30, Day 60, Day 90 */}
                            <div style={{ 
                              position: "absolute", 
                              left: "0%", 
                              top: "-4px", 
                              width: 4, 
                              height: 20, 
                              background: COLORS.darkBlue, 
                              borderRadius: 2,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              zIndex: 3
                            }} />
                            <div style={{ 
                              position: "absolute", 
                              left: "25%", 
                              top: "-4px", 
                              width: 4, 
                              height: 20, 
                              background: COLORS.darkBlue, 
                              borderRadius: 2,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              zIndex: 3
                            }} />
                            <div style={{ 
                              position: "absolute", 
                              left: "50%", 
                              top: "-4px", 
                              width: 4, 
                              height: 20, 
                              background: COLORS.darkBlue, 
                              borderRadius: 2,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              zIndex: 3
                            }} />
                            <div style={{ 
                              position: "absolute", 
                              left: "75%", 
                              top: "-4px", 
                              width: 4, 
                              height: 20, 
                              background: COLORS.darkBlue, 
                              borderRadius: 2,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              zIndex: 3
                            }} />
                            <div style={{ 
                              position: "absolute", 
                              left: "calc(100% - 2px)", 
                              top: "-4px", 
                              width: 4, 
                              height: 20, 
                              background: COLORS.darkBlue, 
                              borderRadius: 2,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              zIndex: 3
                            }} />
                          </div>
                          
                          {/* Milestone labels - 5 labels for Day 1, Week 1, Day 30, Day 60, Day 90 */}
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            marginTop: 8,
                            position: "relative"
                          }}>
                            <div style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              alignItems: "center",
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              <span style={{ 
                                color: COLORS.darkBlue, 
                                opacity: 0.8,
                                background: COLORS.white,
                                padding: "2px 6px",
                                borderRadius: 10,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                              }}>Day 1</span>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              alignItems: "center",
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              <span style={{ 
                                color: COLORS.darkBlue, 
                                opacity: 0.8,
                                background: COLORS.white,
                                padding: "2px 6px",
                                borderRadius: 10,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                              }}>Week 1</span>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              alignItems: "center",
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              <span style={{ 
                                color: COLORS.darkBlue, 
                                opacity: 0.8,
                                background: COLORS.white,
                                padding: "2px 6px",
                                borderRadius: 10,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                              }}>Day 30</span>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              alignItems: "center",
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              <span style={{ 
                                color: COLORS.darkBlue, 
                                opacity: 0.8,
                                background: COLORS.white,
                                padding: "2px 6px",
                                borderRadius: 10,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                              }}>Day 60</span>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              alignItems: "center",
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              <span style={{ 
                                color: COLORS.darkBlue, 
                                opacity: 0.8,
                                background: COLORS.white,
                                padding: "2px 6px",
                                borderRadius: 10,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                              }}>Day 90</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7, marginBottom: 4 }}>Start Date</div>
                          <div style={{ fontSize: 14, color: COLORS.darkBlue, fontWeight: 600 }}>{formatDate(hire.start_date)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7, marginBottom: 4 }}>Buddy</div>
                          <div style={{ fontSize: 14, color: COLORS.darkBlue, fontWeight: 600 }}>
                            {(() => {
                              const buddy = buddies.find(b => b.id === hire.buddy_id);
                              return buddy ? `${buddy.name} ${buddy["surname (s)"] || ''}`.trim() : 'Not assigned';
                            })()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginBottom: 12 }}>
                        <Link href={`/app/dashboard/team/${hire.id}?returnUrl=${encodeURIComponent(window.location.pathname)}`} style={{ textDecoration: 'none', flex: 1 }}>
                          <button style={{
                            background: COLORS.teal,
                            color: COLORS.white,
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 16px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 13,
                            width: "100%",
                            transition: "all 0.2s",
                            boxShadow: "0 2px 8px rgba(42,157,143,0.2)"
                          }}>
                            View Plan
                          </button>
                        </Link>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab Content */}
          {activeTab === "Insights" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* Team Performance Insights */}
              <div style={{ 
                background: COLORS.lightGray, 
                borderRadius: 16, 
                border: `1px solid ${COLORS.borderGray}`,
                padding: 24 
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: 20,
                  padding: "12px 16px",
                  background: COLORS.darkBlue,
                  borderRadius: 12,
                  color: COLORS.white
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Team Performance Insights</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>AI-Powered Analysis</div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                  {/* Onboarding Progress Analysis */}
                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        background: `${COLORS.teal}20`, 
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        📊
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>Onboarding Progress</div>
                        <div style={{ fontSize: 12, color: COLORS.textGray }}>Team average: 68%</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.5 }}>
                      <strong>Key Finding:</strong> Your team is performing 12% above the company average. 
                      <span style={{ color: COLORS.successGreen, fontWeight: 600 }}> Sarah Chen</span> leads with 89% completion.
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        background: `${COLORS.warningAmber}20`, 
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        ⚠️
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>Risk Assessment</div>
                        <div style={{ fontSize: 12, color: COLORS.textGray }}>2 team members at risk</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.5 }}>
                      <strong>Attention Needed:</strong> <span style={{ color: COLORS.errorRed, fontWeight: 600 }}>Michael Rodriguez</span> is 15 days behind schedule. 
                      Consider additional support or timeline adjustment.
                    </div>
                  </div>

                  {/* Engagement Patterns */}
                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        background: `${COLORS.successGreen}20`, 
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        🎯
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>Engagement Patterns</div>
                        <div style={{ fontSize: 12, color: COLORS.textGray }}>High activity detected</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.5 }}>
                      <strong>Positive Trend:</strong> Team engagement is 23% higher than last quarter. 
                      <span style={{ color: COLORS.successGreen, fontWeight: 600 }}>Emma Thompson</span> shows exceptional initiative.
                    </div>
                  </div>
                </div>
              </div>

              {/* Predictive Analytics */}
              <div style={{ 
                background: COLORS.lightGray, 
                borderRadius: 16, 
                border: `1px solid ${COLORS.borderGray}`,
                padding: 24 
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: 20,
                  padding: "12px 16px",
                  background: COLORS.teal,
                  borderRadius: 12,
                  color: COLORS.white
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Predictive Analytics</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>AI Forecast</div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  {/* Completion Timeline */}
                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Expected Completion Timeline</div>
                    <div style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Sarah Chen:</span> <span style={{ color: COLORS.successGreen }}>2 weeks ahead</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Emma Thompson:</span> <span style={{ color: COLORS.successGreen }}>On track</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Michael Rodriguez:</span> <span style={{ color: COLORS.errorRed }}>3 weeks behind</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>David Kim:</span> <span style={{ color: COLORS.warningAmber }}>1 week behind</span>
                      </div>
                    </div>
                  </div>

                  {/* Resource Recommendations */}
                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Resource Recommendations</div>
                    <div style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>High Priority:</span> Additional training for Michael Rodriguez
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Medium Priority:</span> Mentorship pairing for David Kim
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Low Priority:</span> Advanced resources for Sarah Chen
                      </div>
                    </div>
                  </div>

                  {/* Team Dynamics */}
                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Team Dynamics Analysis</div>
                    <div style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Collaboration Score:</span> <span style={{ color: COLORS.successGreen }}>8.5/10</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Communication:</span> <span style={{ color: COLORS.successGreen }}>Excellent</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>Peer Support:</span> <span style={{ color: COLORS.warningAmber }}>Needs improvement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div style={{ 
                background: COLORS.lightGray, 
                borderRadius: 16, 
                border: `1px solid ${COLORS.borderGray}`,
                padding: 24 
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: 20,
                  padding: "12px 16px",
                  background: COLORS.orange,
                  borderRadius: 12,
                  color: COLORS.white
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Actionable Recommendations</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>AI Suggestions</div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Immediate Actions (This Week)</div>
                    <ul style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.6, paddingLeft: 20 }}>
                      <li style={{ marginBottom: 8 }}>Schedule 1:1 with Michael Rodriguez to address delays</li>
                      <li style={{ marginBottom: 8 }}>Assign additional mentor support for David Kim</li>
                      <li style={{ marginBottom: 8 }}>Recognise Sarah Chen's exceptional progress</li>
                    </ul>
                  </div>

                  <div style={{
                    background: COLORS.white,
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${COLORS.borderGray}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Strategic Initiatives (Next Month)</div>
                    <ul style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.6, paddingLeft: 20 }}>
                      <li style={{ marginBottom: 8 }}>Implement peer mentoring programme</li>
                      <li style={{ marginBottom: 8 }}>Create advanced training path for high performers</li>
                      <li style={{ marginBottom: 8 }}>Establish regular team check-ins</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Growth Tab Content */}
          {activeTab === "Growth" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* Employee Selection */}
              <div style={{ 
                background: COLORS.white, 
                borderRadius: 16, 
                padding: 24,
                boxShadow: CARD_SHADOW,
                border: `1px solid ${COLORS.borderGray}`
              }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.darkBlue, marginBottom: 16 }}>
                  Select Employee for Growth Analysis
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                  {managerNewHires.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      style={{
                        background: selectedEmployee?.id === employee.id ? COLORS.teal : COLORS.lightGray,
                        color: selectedEmployee?.id === employee.id ? COLORS.white : COLORS.darkBlue,
                        borderRadius: 12,
                        padding: 16,
                        cursor: "pointer",
                        border: `2px solid ${selectedEmployee?.id === employee.id ? COLORS.teal : COLORS.borderGray}`,
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: selectedEmployee?.id === employee.id ? COLORS.white : COLORS.darkBlue,
                        color: selectedEmployee?.id === employee.id ? COLORS.teal : COLORS.white,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16
                      }}>
                        {getInitials(employee.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {employee.name}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {employee.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Content for Selected Employee */}
              {selectedEmployee && (
                <>
                  {/* Personal Development Journey */}
                  <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 40, marginBottom: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 24, color: COLORS.teal, marginBottom: 24 }}>
                      {selectedEmployee.name}'s Personal Development Journey
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 0, position: "relative", marginBottom: 24 }}>
                      {/* Development Path */}
                      <div style={{ position: "absolute", top: 32, left: 60, right: 60, height: 8, background: COLORS.gray, borderRadius: 8, zIndex: 0 }} />
                      {/* Development Stages */}
                      {[
                        { label: "Self-Awareness", color: COLORS.teal, complete: completedTests.length > 0, icon: "🧠", key: 'self-awareness' },
                        { label: "Goal Setting", color: COLORS.yellow, complete: false, icon: "🎯", key: 'goal-setting' },
                        { label: "Skill Building", color: COLORS.orange, complete: false, icon: "📚", key: 'skill-building' },
                      ].map((stage, idx) => (
                        <div key={stage.label} style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div 
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: "50%",
                              background: stage.complete ? stage.color : COLORS.white,
                              border: `4px solid ${stage.complete ? stage.color : COLORS.gray}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 24,
                              color: stage.complete ? COLORS.white : COLORS.darkBlue,
                              transition: "all 0.3s",
                              cursor: "pointer",
                              boxShadow: activeGrowthCategory === stage.key ? `0 0 0 8px ${stage.color}33` : undefined,
                            }}
                            onClick={() => setActiveGrowthCategory(stage.key as any)}
                          >
                            {stage.icon}
                          </div>
                          <div style={{ 
                            marginTop: 12, 
                            fontWeight: 700, 
                            color: activeGrowthCategory === stage.key ? stage.color : COLORS.darkBlue, 
                            fontSize: 14, 
                            textAlign: "center",
                            cursor: "pointer"
                          }}
                          onClick={() => setActiveGrowthCategory(stage.key as any)}
                          >
                            {stage.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Content */}
                  {activeGrowthCategory === 'self-awareness' && (
                    <>
                      {/* Growth Insights Section */}
                      {(growthInsights.length > 0 || additionalInsights.length > 0) && (
                        <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 8, height: 32, background: COLORS.teal, borderRadius: 4 }} />
                            <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>AI-Generated Insights</div>
                          </div>
                          
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                            {[...growthInsights, ...additionalInsights].map((insight, idx) => (
                              <div key={idx} style={{
                                background: COLORS.lightGray,
                                borderRadius: 16,
                                border: `1px solid ${COLORS.borderGray}`,
                                padding: 20,
                                position: "relative"
                              }}>
                                <div style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: 8, 
                                  marginBottom: 12 
                                }}>
                                  <div style={{ fontSize: 20 }}>{getInsightIcon(insight.insight_type)}</div>
                                  <div style={{ 
                                    fontWeight: 700, 
                                    fontSize: 16, 
                                    color: getInsightColor(insight.insight_type) 
                                  }}>
                                    {insight.title}
                                  </div>
                                </div>
                                
                                <div style={{ 
                                  fontSize: 14, 
                                  color: COLORS.darkBlue, 
                                  marginBottom: 12,
                                  lineHeight: 1.5
                                }}>
                                  {insight.description}
                                </div>
                                
                                {insight.actionable_items && insight.actionable_items.length > 0 && (
                                  <div>
                                    <div style={{ 
                                      fontWeight: 600, 
                                      fontSize: 13, 
                                      color: COLORS.darkBlue, 
                                      marginBottom: 8 
                                    }}>
                                      Action Items:
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                                      {insight.actionable_items.map((item: string, itemIdx: number) => (
                                        <li key={itemIdx} style={{ 
                                          fontSize: 13, 
                                          color: COLORS.textGray, 
                                          marginBottom: 4,
                                          lineHeight: 1.4
                                        }}>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tests & Assessments Section */}
                      <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 8, height: 32, background: COLORS.yellow, borderRadius: 4 }} />
                            <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Tests & Assessments</div>
                          </div>
                        </div>

                        {/* Test Categories */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                          {/* Completed Tests */}
                          <div style={{ 
                            background: COLORS.lightGray,
                            borderRadius: 16,
                            border: `1px solid ${COLORS.borderGray}`,
                            padding: 24,
                            overflow: "hidden"
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 12, 
                              marginBottom: 16,
                              padding: "12px 16px",
                              background: COLORS.darkBlue,
                              borderRadius: 12,
                              color: COLORS.white
                            }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>Completed Tests ({completedTests.length})</div>
                            </div>
                            
                            {completedTests.length > 0 ? (
                              completedTests.map((test, idx) => (
                                <div key={idx} style={{
                                  background: COLORS.white,
                                  borderRadius: 12,
                                  padding: 16,
                                  marginBottom: 12,
                                  border: `1px solid ${COLORS.borderGray}`,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                                }}>
                                  <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 4 }}>
                                    {test.growth_tests?.name || 'Test'}
                                  </div>
                                  <div style={{ fontSize: 14, color: COLORS.teal, fontWeight: 600, marginBottom: 4 }}>
                                    Result: {test.result_summary}
                                  </div>
                                  {test.insights && test.insights.length > 0 && (
                                    <div style={{ fontSize: 13, color: COLORS.textGray }}>
                                      {test.insights[0]}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 11, color: COLORS.textGray, marginTop: 8 }}>
                                    Completed: {formatDate(test.completed_at)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ 
                                textAlign: "center", 
                                padding: "2rem", 
                                color: COLORS.textGray,
                                fontSize: 14
                              }}>
                                No tests completed yet. Start your journey by taking a test!
                              </div>
                            )}
                          </div>

                          {/* Available Tests */}
                          <div style={{ 
                            background: COLORS.lightGray,
                            borderRadius: 16,
                            border: `1px solid ${COLORS.borderGray}`,
                            padding: 24,
                            overflow: "hidden"
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 12, 
                              marginBottom: 16,
                              padding: "12px 16px",
                              background: COLORS.yellow,
                              borderRadius: 12,
                              color: COLORS.darkBlue
                            }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>Available Tests</div>
                            </div>
                            
                            {growthTests.filter(test => !test.isCompleted).map((test, idx) => (
                              <div key={idx} style={{
                                background: COLORS.white,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 12,
                                border: `1px solid ${COLORS.borderGray}`,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              >
                                <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 4 }}>{test.name}</div>
                                <div style={{ fontSize: 13, color: COLORS.textGray, marginBottom: 8 }}>{test.description}</div>
                                <div style={{ fontSize: 12, color: COLORS.teal, fontWeight: 600 }}>
                                  Duration: {test.duration_minutes || '5-10'} min
                                </div>
                              </div>
                            ))}
                            
                            {growthTests.filter(test => !test.isCompleted).length === 0 && (
                              <div style={{ 
                                textAlign: "center", 
                                padding: "2rem", 
                                color: COLORS.textGray,
                                fontSize: 14
                              }}>
                                All tests completed! Great job on your development journey.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeGrowthCategory === 'goal-setting' && (
                    <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 8, height: 32, background: COLORS.yellow, borderRadius: 4 }} />
                          <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Career Goals & Objectives</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                        {goals.map((goal, idx) => (
                          <div key={goal.id} style={{
                            background: COLORS.lightGray,
                            borderRadius: 16,
                            border: `1px solid ${COLORS.borderGray}`,
                            padding: 20,
                            position: "relative"
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between", 
                              marginBottom: 12 
                            }}>
                              <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.darkBlue }}>
                                {goal.title}
                              </div>
                              <div style={{
                                background: getPriorityColor(goal.priority),
                                color: COLORS.white,
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600
                              }}>
                                {goal.priority.toUpperCase()}
                              </div>
                            </div>
                            
                            <div style={{ 
                              fontSize: 14, 
                              color: COLORS.textGray, 
                              marginBottom: 12,
                              lineHeight: 1.5
                            }}>
                              {goal.description}
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center", 
                                marginBottom: 4 
                              }}>
                                <span style={{ fontSize: 12, color: COLORS.textGray }}>Progress</span>
                                <span style={{ fontSize: 12, color: COLORS.teal, fontWeight: 600 }}>{goal.progress}%</span>
                              </div>
                              <div style={{
                                width: "100%",
                                height: 8,
                                background: COLORS.gray,
                                borderRadius: 4,
                                overflow: "hidden"
                              }}>
                                <div style={{
                                  width: `${goal.progress}%`,
                                  height: "100%",
                                  background: COLORS.teal,
                                  transition: "width 0.3s ease"
                                }} />
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              marginBottom: 12
                            }}>
                              <div style={{
                                background: getTimeframeColor(goal.timeframe),
                                color: COLORS.white,
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600
                              }}>
                                {goal.timeframe.replace('-', ' ').toUpperCase()}
                              </div>
                              <div style={{ fontSize: 12, color: COLORS.textGray }}>
                                Added: {formatDate(goal.created_at)}
                              </div>
                            </div>

                            {/* Comments Section */}
                            <div style={{ borderTop: `1px solid ${COLORS.borderGray}`, paddingTop: 12 }}>
                              <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center", 
                                marginBottom: 8 
                              }}>
                                <span style={{ fontSize: 12, color: COLORS.textGray, fontWeight: 600 }}>
                                  Comments ({goal.comments.length})
                                </span>
                                <button
                                  onClick={() => setShowGoalComments(showGoalComments === goal.id ? null : goal.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: COLORS.teal,
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: 600
                                  }}
                                >
                                  {showGoalComments === goal.id ? 'Hide' : 'Show'}
                                </button>
                              </div>

                              {showGoalComments === goal.id && (
                                <div style={{ marginBottom: 12 }}>
                                  {goal.comments.map((comment) => (
                                    <div key={comment.id} style={{
                                      background: COLORS.white,
                                      borderRadius: 8,
                                      padding: 8,
                                      marginBottom: 8,
                                      border: `1px solid ${COLORS.borderGray}`
                                    }}>
                                      <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center", 
                                        marginBottom: 4 
                                      }}>
                                        <div style={{ fontSize: 12, color: COLORS.textGray }}>
                                          <strong>{comment.author}</strong> • {formatDate(comment.created_at)}
                                        </div>
                                        {comment.author === (currentManager?.name || "Manager") && (
                                          <div style={{ display: "flex", gap: 4 }}>
                                            <button
                                              onClick={() => startEditGoalComment(goal.id, comment.id, comment.text)}
                                              style={{
                                                background: COLORS.teal,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 4px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteGoalComment(goal.id, comment.id)}
                                              style={{
                                                background: COLORS.errorRed,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 4px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {editingGoalComment?.goalId === goal.id && editingGoalComment?.commentId === comment.id ? (
                                        <div>
                                          <textarea
                                            value={editingGoalCommentText}
                                            onChange={(e) => setEditingGoalCommentText(e.target.value)}
                                            style={{
                                              width: "100%",
                                              minHeight: "40px",
                                              padding: "4px 8px",
                                              border: `1px solid ${COLORS.borderGray}`,
                                              borderRadius: 4,
                                              fontSize: 12,
                                              resize: "vertical",
                                              color: COLORS.darkBlue,
                                              marginBottom: "4px"
                                            }}
                                          />
                                          <div style={{ display: "flex", gap: 4 }}>
                                            <button
                                              onClick={handleEditGoalComment}
                                              style={{
                                                background: COLORS.successGreen,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 6px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingGoalComment(null);
                                                setEditingGoalCommentText('');
                                              }}
                                              style={{
                                                background: COLORS.darkGray,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 6px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: 13, color: COLORS.darkBlue }}>
                                          {comment.text}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                      type="text"
                                      value={newGoalComment}
                                      onChange={(e) => setNewGoalComment(e.target.value)}
                                      placeholder="Add a comment..."
                                      style={{
                                        flex: 1,
                                        padding: "8px 12px",
                                        border: `1px solid ${COLORS.borderGray}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        color: COLORS.darkBlue
                                      }}
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddGoalComment(goal.id)}
                                    />
                                    <button
                                      onClick={() => handleAddGoalComment(goal.id)}
                                      disabled={!newGoalComment.trim()}
                                      style={{
                                        background: newGoalComment.trim() ? COLORS.teal : COLORS.gray,
                                        color: COLORS.white,
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "8px 12px",
                                        fontSize: 12,
                                        cursor: newGoalComment.trim() ? "pointer" : "not-allowed"
                                      }}
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {goals.length === 0 && (
                          <div style={{ 
                            textAlign: "center", 
                            padding: "3rem", 
                            color: COLORS.textGray,
                            fontSize: 16,
                            gridColumn: "1 / -1"
                          }}>
                            No goals set yet. Employee can add goals from their Growth tab.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeGrowthCategory === 'skill-building' && (
                    <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 8, height: 32, background: COLORS.orange, borderRadius: 4 }} />
                          <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Skills Development</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                        {skills.map((skill, idx) => (
                          <div key={skill.id} style={{
                            background: COLORS.lightGray,
                            borderRadius: 16,
                            border: `1px solid ${COLORS.borderGray}`,
                            padding: 20,
                            position: "relative"
                          }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between", 
                              marginBottom: 12 
                            }}>
                              <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.darkBlue }}>
                                {skill.name}
                              </div>
                              <div style={{
                                background: getPriorityColor(skill.priority),
                                color: COLORS.white,
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600
                              }}>
                                {skill.priority.toUpperCase()}
                              </div>
                            </div>
                            
                            <div style={{ 
                              fontSize: 14, 
                              color: COLORS.textGray, 
                              marginBottom: 12,
                              lineHeight: 1.5
                            }}>
                              {skill.description}
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center", 
                                marginBottom: 4 
                              }}>
                                <span style={{ fontSize: 12, color: COLORS.textGray }}>Progress</span>
                                <span style={{ fontSize: 12, color: COLORS.orange, fontWeight: 600 }}>{skill.progress}%</span>
                              </div>
                              <div style={{
                                width: "100%",
                                height: 8,
                                background: COLORS.gray,
                                borderRadius: 4,
                                overflow: "hidden"
                              }}>
                                <div style={{
                                  width: `${skill.progress}%`,
                                  height: "100%",
                                  background: COLORS.orange,
                                  transition: "width 0.3s ease"
                                }} />
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              marginBottom: 12
                            }}>
                              <div style={{
                                background: skill.status === 'completed' ? COLORS.successGreen : 
                                         skill.status === 'in-progress' ? COLORS.warningAmber : COLORS.textGray,
                                color: COLORS.white,
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600
                              }}>
                                {skill.status.replace('-', ' ').toUpperCase()}
                              </div>
                              {skill.targetDate && (
                                <div style={{ fontSize: 12, color: COLORS.textGray }}>
                                  Target: {formatDate(skill.targetDate)}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ fontSize: 12, color: COLORS.textGray, marginBottom: 12 }}>
                              Added: {formatDate(skill.created_at)}
                            </div>

                            {/* Comments Section */}
                            <div style={{ borderTop: `1px solid ${COLORS.borderGray}`, paddingTop: 12 }}>
                              <div style={{ 
                                display: "flex", 
                                justifyContent: "space-between", 
                                alignItems: "center", 
                                marginBottom: 8 
                              }}>
                                <span style={{ fontSize: 12, color: COLORS.textGray, fontWeight: 600 }}>
                                  Comments ({skill.comments.length})
                                </span>
                                <button
                                  onClick={() => setShowSkillComments(showSkillComments === skill.id ? null : skill.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: COLORS.orange,
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: 600
                                  }}
                                >
                                  {showSkillComments === skill.id ? 'Hide' : 'Show'}
                                </button>
                              </div>

                              {showSkillComments === skill.id && (
                                <div style={{ marginBottom: 12 }}>
                                  {skill.comments.map((comment) => (
                                    <div key={comment.id} style={{
                                      background: COLORS.white,
                                      borderRadius: 8,
                                      padding: 8,
                                      marginBottom: 8,
                                      border: `1px solid ${COLORS.borderGray}`
                                    }}>
                                      <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center", 
                                        marginBottom: 4 
                                      }}>
                                        <div style={{ fontSize: 12, color: COLORS.textGray }}>
                                          <strong>{comment.author}</strong> • {formatDate(comment.created_at)}
                                        </div>
                                        {comment.author === (currentManager?.name || "Manager") && (
                                          <div style={{ display: "flex", gap: 4 }}>
                                            <button
                                              onClick={() => startEditSkillComment(skill.id, comment.id, comment.text)}
                                              style={{
                                                background: COLORS.orange,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 4px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSkillComment(skill.id, comment.id)}
                                              style={{
                                                background: COLORS.errorRed,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 4px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {editingSkillComment?.skillId === skill.id && editingSkillComment?.commentId === comment.id ? (
                                        <div>
                                          <textarea
                                            value={editingSkillCommentText}
                                            onChange={(e) => setEditingSkillCommentText(e.target.value)}
                                            style={{
                                              width: "100%",
                                              minHeight: "40px",
                                              padding: "4px 8px",
                                              border: `1px solid ${COLORS.borderGray}`,
                                              borderRadius: 4,
                                              fontSize: 12,
                                              resize: "vertical",
                                              color: COLORS.darkBlue,
                                              marginBottom: "4px"
                                            }}
                                          />
                                          <div style={{ display: "flex", gap: 4 }}>
                                            <button
                                              onClick={handleEditSkillComment}
                                              style={{
                                                background: COLORS.successGreen,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 6px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingSkillComment(null);
                                                setEditingSkillCommentText('');
                                              }}
                                              style={{
                                                background: COLORS.darkGray,
                                                color: COLORS.white,
                                                border: "none",
                                                borderRadius: 2,
                                                padding: "2px 6px",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer"
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: 13, color: COLORS.darkBlue }}>
                                          {comment.text}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                      type="text"
                                      value={newSkillComment}
                                      onChange={(e) => setNewSkillComment(e.target.value)}
                                      placeholder="Add a comment..."
                                      style={{
                                        flex: 1,
                                        padding: "8px 12px",
                                        border: `1px solid ${COLORS.borderGray}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        color: COLORS.darkBlue
                                      }}
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkillComment(skill.id)}
                                    />
                                    <button
                                      onClick={() => handleAddSkillComment(skill.id)}
                                      disabled={!newSkillComment.trim()}
                                      style={{
                                        background: newSkillComment.trim() ? COLORS.orange : COLORS.gray,
                                        color: COLORS.white,
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "8px 12px",
                                        fontSize: 12,
                                        cursor: newSkillComment.trim() ? "pointer" : "not-allowed"
                                      }}
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {skills.length === 0 && (
                          <div style={{ 
                            textAlign: "center", 
                            padding: "3rem", 
                            color: COLORS.textGray,
                            fontSize: 16,
                            gridColumn: "1 / -1"
                          }}>
                            No skills added yet. Employee can add skills from their Growth tab.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* No Employee Selected */}
              {!selectedEmployee && (
                <div style={{ 
                  background: COLORS.white, 
                  borderRadius: 18, 
                  boxShadow: CARD_SHADOW, 
                  padding: 48,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: COLORS.darkBlue, marginBottom: 8 }}>
                    Select an Employee
                  </div>
                  <div style={{ fontSize: 16, color: COLORS.textGray }}>
                    Choose an employee from the list above to view their growth analysis and development insights.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab Content */}
          {activeTab === "Resources" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Resources Header with Add Button */}
              <div style={{ 
                display: "flex", 
                alignItems: "flex-start", 
                justifyContent: "space-between",
                marginBottom: "0.5rem"
              }}>
                <div style={{ flex: 1 }}>
                  {/* Empty div to take up space on the left */}
                </div>
                <button
                  onClick={() => setShowAddResource(true)}
                  style={{
                    background: COLORS.teal,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 13,
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(42,157,143,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(42,157,143,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(42,157,143,0.2)";
                  }}
                >
                  + Add Resource
                </button>
              </div>

                            {/* Resources by Category */}
              {resources.length === 0 ? (
                <div style={{ 
                  background: COLORS.white, 
                  borderRadius: 16, 
                  padding: 48,
                  border: `2px dashed ${COLORS.borderGray}`,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, marginBottom: 8 }}>
                    No Resources Yet
                  </h4>
                  <p style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 24 }}>
                    Start building your resource library by adding links, files, and documents for your team
                  </p>
                  <button
                    onClick={() => setShowAddResource(true)}
                    style={{
                      background: COLORS.teal,
                      color: COLORS.white,
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 20px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    Add Your First Resource
                  </button>
                </div>
              ) : (
                (() => {
                  // Group resources by category
                  const resourcesByCategory = resources.reduce((acc, resource) => {
                    const category = resource.category || 'Uncategorized';
                    if (!acc[category]) {
                      acc[category] = [];
                    }
                    acc[category].push(resource);
                    return acc;
                  }, {} as { [key: string]: any[] });

                  // Sort categories alphabetically
                  const sortedCategories = Object.keys(resourcesByCategory).sort();

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {sortedCategories.map((category) => {
                        const isCollapsed = collapsedCategories.has(category);
                        return (
                          <div key={category} style={{ 
                            background: COLORS.white, 
                            borderRadius: 16, 
                            border: `1px solid ${COLORS.borderGray}`,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            overflow: "hidden",
                            transition: "all 0.3s ease"
                          }}>
                            {/* Category Header */}
                            <div 
                              style={{
                                background: COLORS.teal,
                                color: COLORS.white,
                                padding: "16px 24px",
                                borderBottom: isCollapsed ? "none" : `1px solid ${COLORS.borderGray}`,
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                              onClick={() => toggleCategoryCollapse(category)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#248277";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = COLORS.teal;
                              }}
                            >
                              <h3 style={{ 
                                fontSize: 18, 
                                fontWeight: 700, 
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {category}
                                  <span style={{ 
                                    fontSize: 14, 
                                    opacity: 0.8,
                                    fontWeight: 500
                                  }}>
                                    ({resourcesByCategory[category].length} resource{resourcesByCategory[category].length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                <div style={{ 
                                  fontSize: 16, 
                                  transition: "transform 0.3s ease",
                                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)"
                                }}>
                                  ▼
                                </div>
                              </h3>
                            </div>
                            
                            {/* Resources in this category */}
                            <div style={{ 
                              padding: "0",
                              maxHeight: isCollapsed ? "0" : "1000px",
                              overflow: "hidden",
                              transition: "max-height 0.3s ease"
                            }}>
                              {resourcesByCategory[category].map((resource) => (
                                <div key={resource.id} style={{ 
                                  padding: "20px 24px",
                                  borderBottom: resourcesByCategory[category].indexOf(resource) !== resourcesByCategory[category].length - 1 ? `1px solid ${COLORS.borderGray}` : "none",
                                  background: COLORS.white,
                                  transition: "all 0.2s"
                                }}>
                                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                                      <div style={{ fontSize: 20 }}>{getResourceIcon(resource.type)}</div>
                                      <div style={{ flex: 1 }}>
                                        <h4 style={{ 
                                          fontSize: 16, 
                                          fontWeight: 700, 
                                          color: COLORS.darkBlue, 
                                          marginBottom: 4,
                                          cursor: resource.type === 'file' ? 'pointer' : 'default'
                                        }}
                                        onClick={resource.type === 'file' ? () => {
                                          window.open(`/api/resources/${resource.id}/download`, '_blank');
                                        } : undefined}
                                        >
                                          {resource.title}
                                        </h4>
                                        <p style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 8, lineHeight: 1.4 }}>
                                          {resource.description}
                                        </p>
                                        <div style={{ fontSize: 12, color: COLORS.textGray }}>
                                          <strong>Access:</strong> {getAccessibleEmployeesText(resource)}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                      {resource.type === 'link' && resource.url && (
                                        <a 
                                          href={resource.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          style={{ 
                                            color: COLORS.teal, 
                                            textDecoration: "none",
                                            fontSize: 12,
                                            padding: "4px 8px",
                                            borderRadius: 4,
                                            border: `1px solid ${COLORS.teal}`,
                                            background: `${COLORS.teal}10`
                                          }}
                                        >
                                          Open Link →
                                        </a>
                                      )}
                                      {resource.type === 'file' && resource.file_path && (
                                        <a 
                                          href={`/api/resources/${resource.id}/download`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ 
                                            color: COLORS.teal, 
                                            textDecoration: "none",
                                            fontSize: 12,
                                            padding: "4px 8px",
                                            borderRadius: 4,
                                            border: `1px solid ${COLORS.teal}`,
                                            background: `${COLORS.teal}10`
                                          }}
                                        >
                                          Download File →
                                        </a>
                                      )}
                                      <button
                                        onClick={() => setEditingResource(resource)}
                                        style={{
                                          background: "transparent",
                                          color: COLORS.darkBlue,
                                          border: `1px solid ${COLORS.borderGray}`,
                                          borderRadius: 6,
                                          padding: "6px 10px",
                                          cursor: "pointer",
                                          fontSize: 12,
                                          transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = COLORS.lightGray;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "transparent";
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteResource(resource.id)}
                                        style={{
                                          background: "transparent",
                                          color: COLORS.errorRed,
                                          border: `1px solid ${COLORS.errorRed}`,
                                          borderRadius: 6,
                                          padding: "6px 10px",
                                          cursor: "pointer",
                                          fontSize: 12,
                                          transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = COLORS.errorRed;
                                          e.currentTarget.style.color = COLORS.white;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "transparent";
                                          e.currentTarget.style.color = COLORS.errorRed;
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div style={{ fontSize: 11, color: COLORS.textGray, opacity: 0.7 }}>
                                    Created {new Date(resource.created_at).toLocaleDateString('en-GB')}
                                    {resource.updated_at !== resource.created_at && 
                                      ` • Updated ${new Date(resource.updated_at).toLocaleDateString('en-GB')}`
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </section>
      </main>

      {/* Add/Edit Resource Modal */}
      {(showAddResource || editingResource) && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "2rem"
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue }}>
                {editingResource ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              <button
                onClick={() => {
                  setShowAddResource(false);
                  setEditingResource(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: COLORS.textGray
                }}
              >
                ×
              </button>
            </div>

            <ResourceForm
              resource={editingResource}
              onSubmit={(data: any) => {
                if (editingResource) {
                  handleUpdateResource(editingResource.id, data);
                } else {
                  addResource(data);
                }
              }}
              onCancel={() => {
                setShowAddResource(false);
                setEditingResource(null);
              }}
              employees={managerNewHires}
            />
          </div>
        </div>
      )}

      {/* Buddy Assignment Modal */}
      {showBuddyAssignment && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "2rem"
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: 20,
            padding: "2rem",
            maxWidth: 500,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
                Assign Buddy
              </h2>
              <button
                onClick={() => {
                  setShowBuddyAssignment(false);
                  setSelectedNewHire(null);
                  setSelectedBuddy('');
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: COLORS.textGray,
                  padding: 4
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                Select New Hire *
              </label>
              <select
                value={selectedNewHire?.id || ''}
                onChange={(e) => {
                  const newHire = managerNewHires.find(hire => hire.id === parseInt(e.target.value));
                  setSelectedNewHire(newHire || null);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${COLORS.borderGray}`,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.darkBlue,
                  background: COLORS.white
                }}
              >
                <option value="">Select a new hire...</option>
                {managerNewHires.filter(hire => !hire.buddy_id).map(hire => (
                  <option key={hire.id} value={hire.id}>
                    {hire.name} {hire["surname(s)"]} - {hire.role || 'No role specified'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                Select Buddy *
              </label>
              <select
                value={selectedBuddy}
                onChange={(e) => setSelectedBuddy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${COLORS.borderGray}`,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.darkBlue,
                  background: COLORS.white
                }}
              >
                <option value="">Select a buddy...</option>
                {buddies.map(buddy => (
                  <option key={buddy.id} value={buddy.id}>
                    {buddy.name} {buddy["surname (s)"]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowBuddyAssignment(false);
                  setSelectedNewHire(null);
                  setSelectedBuddy('');
                }}
                style={{
                  background: COLORS.lightGray,
                  color: COLORS.darkBlue,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={assignBuddyToNewHire}
                disabled={!selectedNewHire || !selectedBuddy}
                style={{
                  background: (!selectedNewHire || !selectedBuddy) ? COLORS.gray : COLORS.teal,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 24px",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: (!selectedNewHire || !selectedBuddy) ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
              >
                Assign Buddy
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// Resource Form Component
function ResourceForm({ 
  resource, 
  onSubmit, 
  onCancel, 
  employees 
}: { 
  resource: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
  employees: NewHire[];
}) {
  const [formData, setFormData] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    type: resource?.type || 'link',
    url: resource?.url || '',
    file_path: resource?.file_path || '',
    category: resource?.category || 'Company Resources',
    accessible_to: resource?.accessible_to || 'all',
    accessible_employees: resource?.accessible_employees || []
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Standard categories (sorted alphabetically)
  const standardCategories = [
    'Company Policies',
    'Company Resources',
    'HR Resources',
    'IT Resources',
    'Other',
    'Security Guidelines',
    'Training Materials'
  ].sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalFilePath = formData.file_path;
    
    // If it's a file upload and we have a selected file, upload it first
    if (formData.type === 'file' && selectedFile) {
      try {
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', selectedFile);
        formDataToUpload.append('title', formData.title);
        
        const uploadResponse = await fetch('/api/resources/upload', {
          method: 'POST',
          body: formDataToUpload
        });
        
        if (!uploadResponse.ok) {
          throw new Error('File upload failed');
        }
        
        const uploadResult = await uploadResponse.json();
        finalFilePath = uploadResult.file_path;
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
        return;
      }
    }
    
    const resourceData = {
      title: formData.title,
      description: formData.description,
      type: formData.type as 'link' | 'file',
      url: formData.type === 'link' ? formData.url : undefined,
      file_path: formData.type === 'file' ? finalFilePath : undefined,
      category: formData.category,
      accessible_to: formData.accessible_to as 'all' | 'specific',
      accessible_employees: formData.accessible_to === 'all' ? [] : formData.accessible_employees,
      created_by: 'Manager' // This would come from the current user
    };

    onSubmit(resourceData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
          Resource Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${COLORS.borderGray}`,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.darkBlue
          }}
          placeholder="e.g., Company Handbook, IT Setup Guide"
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
          rows={3}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${COLORS.borderGray}`,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.darkBlue,
            resize: "vertical"
          }}
          placeholder="Brief description of what this resource contains..."
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
          Resource Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          required
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${COLORS.borderGray}`,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.darkBlue,
            background: COLORS.white
          }}
        >
          <option value="link">🔗 Link</option>
          <option value="file">📄 File</option>
        </select>
      </div>

      {formData.type === 'link' && (
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
            URL *
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `1px solid ${COLORS.borderGray}`,
              borderRadius: 8,
              fontSize: 14,
              color: COLORS.darkBlue
            }}
            placeholder="https://example.com/resource"
          />
        </div>
      )}

      {formData.type === 'file' && (
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
            File Upload *
          </label>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                setFormData(prev => ({ 
                  ...prev, 
                  file_path: file.name 
                }));
              }
            }}
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `1px solid ${COLORS.borderGray}`,
              borderRadius: 8,
              fontSize: 14,
              color: COLORS.darkBlue,
              background: COLORS.white
            }}
          />
          {formData.file_path && (
            <div style={{ 
              marginTop: 8, 
              padding: "8px 12px", 
              background: `${COLORS.teal}10`, 
              borderRadius: 6, 
              fontSize: 12, 
              color: COLORS.teal,
              border: `1px solid ${COLORS.teal}20`
            }}>
              Selected file: {formData.file_path}
            </div>
          )}
        </div>
      )}

      <div>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => {
            const selectedCategory = e.target.value;
            if (selectedCategory === 'Other') {
              setShowCustomCategory(true);
              setFormData(prev => ({ ...prev, category: customCategory }));
            } else {
              setShowCustomCategory(false);
              setFormData(prev => ({ ...prev, category: selectedCategory }));
            }
          }}
          required
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${COLORS.borderGray}`,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.darkBlue,
            background: COLORS.white
          }}
        >
          {standardCategories.sort().map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        
        {showCustomCategory && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => {
                const value = e.target.value;
                setCustomCategory(value);
                setFormData(prev => ({ ...prev, category: value }));
              }}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${COLORS.borderGray}`,
                borderRadius: 8,
                fontSize: 14,
                color: COLORS.darkBlue
              }}
              placeholder="Enter custom category name..."
            />
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
          Access Control *
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: COLORS.darkBlue }}>
            <input
              type="radio"
              name="accessible_to"
              value="all"
              checked={formData.accessible_to === 'all'}
              onChange={(e) => setFormData(prev => ({ ...prev, accessible_to: e.target.value }))}
            />
            <span>All employees in my team</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: COLORS.darkBlue }}>
            <input
              type="radio"
              name="accessible_to"
              value="specific"
              checked={formData.accessible_to === 'specific'}
              onChange={(e) => setFormData(prev => ({ ...prev, accessible_to: e.target.value }))}
            />
            <span>Specific employees only</span>
          </label>
        </div>
      </div>

      {formData.accessible_to === 'specific' && (
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
            Select Employees *
          </label>
          <div style={{ maxHeight: 200, overflow: "auto", border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, padding: 8 }}>
            {employees.sort((a, b) => `${a.name} ${a["surname(s)"]}`.localeCompare(`${b.name} ${b["surname(s)"]}`)).map((employee) => (
              <label key={employee.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.accessible_employees.includes(employee.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        accessible_employees: [...prev.accessible_employees, employee.id]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        accessible_employees: prev.accessible_employees.filter((id: number) => id !== employee.id)
                      }));
                    }
                  }}
                />
                <span style={{ color: COLORS.darkBlue }}>{employee.name} {employee["surname(s)"]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: 24 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "transparent",
            color: COLORS.darkBlue,
            border: `1px solid ${COLORS.borderGray}`,
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            background: COLORS.teal,
            color: COLORS.white,
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14
          }}
        >
          {resource ? 'Update Resource' : 'Add Resource'}
        </button>
      </div>
    </form>
  );
}

// Interface for team updates
interface TeamUpdate {
  id: string;
  type: 'milestone' | 'overdue' | 'buddy' | 'ahead';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  employeeId: number | null;
  employeeName: string | null;
}
 