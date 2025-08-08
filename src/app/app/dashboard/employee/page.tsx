"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { fetchNewHires, fetchOnboardingPlan, fetchResources, type NewHire, type Resource, calculateOnboardingProgress, calculateActualProgressFromTasks, getCurrentMilestoneFromTasks, calculateScheduledProgress, calculateScheduledProgressForFuture, calculateWorkingDaysUntilStart, getStatusColor, formatDate, getInitials, fetchOnboardingFeedback, addOnboardingFeedback, updateOnboardingFeedback, deleteOnboardingFeedback, type OnboardingFeedback, getGrowthTests, submitTestResult, getGrowthInsights } from "@/lib/api";

// Color palette and constants (matching manager portal)
const COLORS = {
  darkBlue: "#264653",
  teal: "#2A9D8F",
  yellow: "#E9C46A",
  orange: "#F4A261",
  red: "#E76F51",
  white: "#fff",
  gray: "#f6f6f6",
  darkGray: "#6B7280",
  lightGray: "#F3F4F6",
  borderGray: "#E5E7EB",
  textGray: "#6B7280",
  successGreen: "#10B981",
  warningAmber: "#F59E0B",
  errorRed: "#EF4444"
};
const NAV_TABS = {
  newhire: ["Home", "Plan", "Growth", "Resources"],
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

export default function EmployeeDashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [currentNewHire, setCurrentNewHire] = useState<NewHire | null>(null);
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(NAV_TABS.newhire[0]);
  const [planSubTab, setPlanSubTab] = useState("Overview");
  const [showAddResource, setShowAddResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<OnboardingFeedback[]>([]);
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    feedbackType: 'general' as 'general' | 'milestone' | 'task' | 'self_assessment',
    feedbackText: '',
    rating: 0
  });
  const [editingFeedback, setEditingFeedback] = useState<OnboardingFeedback | null>(null);
  const [editingFeedbackText, setEditingFeedbackText] = useState('');
  const [growthTests, setGrowthTests] = useState<any[]>([]);
  const [completedTests, setCompletedTests] = useState<any[]>([]);
  const [growthInsights, setGrowthInsights] = useState<any[]>([]);
  const [additionalInsights, setAdditionalInsights] = useState<any[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [currentTestAnswers, setCurrentTestAnswers] = useState<any>({});
  const [testProgress, setTestProgress] = useState(0);
  
  // Growth categories state
  const [activeGrowthCategory, setActiveGrowthCategory] = useState<'self-awareness' | 'goal-setting' | 'skill-building'>('self-awareness');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [showEditSkill, setShowEditSkill] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    timeframe: 'short-term' as 'short-term' | 'medium-term' | 'long-term',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetDate: ''
  });
  const [newGoalComment, setNewGoalComment] = useState('');
  const [newSkillComment, setNewSkillComment] = useState('');
  const [showGoalComments, setShowGoalComments] = useState<number | null>(null);
  const [showSkillComments, setShowSkillComments] = useState<number | null>(null);
  
  // Comment editing state
  const [editingGoalComment, setEditingGoalComment] = useState<{goalId: number, commentId: number} | null>(null);
  const [editingSkillComment, setEditingSkillComment] = useState<{skillId: number, commentId: number} | null>(null);
  const [editingGoalCommentText, setEditingGoalCommentText] = useState('');
  const [editingSkillCommentText, setEditingSkillCommentText] = useState('');

  // Sample data for goals and skills (in production, this would come from database)
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
  }>>(() => {
    // Load from localStorage if available, otherwise use default data
    if (typeof window !== 'undefined') {
      const savedGoals = localStorage.getItem('employee_growth_goals');
      if (savedGoals) {
        return JSON.parse(savedGoals);
      }
    }
    
    return [
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
    ];
  });

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
  }>>(() => {
    // Load from localStorage if available, otherwise use default data
    if (typeof window !== 'undefined') {
      const savedSkills = localStorage.getItem('employee_growth_skills');
      if (savedSkills) {
        return JSON.parse(savedSkills);
      }
    }
    
    return [
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
    ];
  });

  // Handle URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && NAV_TABS.newhire.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [newHiresData, resourcesData] = await Promise.all([
          fetchNewHires(),
          fetchResources()
        ]);
        setNewHires(newHiresData);
        setResources(resourcesData);
        
        // Find the current user's new hire record and fetch their onboarding plan
        const currentUserEmail = user?.primaryEmailAddress?.emailAddress;
        const currentNewHire = newHiresData.find(hire => hire.email === currentUserEmail);
        
        if (currentNewHire) {
          setCurrentNewHire(currentNewHire);
          const [planData, feedbackData] = await Promise.all([
            fetchOnboardingPlan(currentNewHire.id),
            fetchOnboardingFeedback(currentNewHire.id)
          ]);
          setOnboardingPlan(planData);
          setFeedback(feedbackData);
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  // Refresh onboarding plan when returning from task detail page
  useEffect(() => {
    const handleFocus = async () => {
      if (currentNewHire && !loading) {
        try {
          const planData = await fetchOnboardingPlan(currentNewHire.id);
          setOnboardingPlan(planData);
        } catch (err) {
          console.error('Error refreshing onboarding plan:', err);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentNewHire, loading]);

  // Fetch growth data when currentNewHire changes
  useEffect(() => {
    if (currentNewHire) {
      fetchGrowthData();
    }
  }, [currentNewHire]);

  const getAccessibleResources = () => {
    if (!currentNewHire) return [];
    return resources.filter(resource => 
      (resource.accessible_employees && resource.accessible_employees.includes(currentNewHire.id)) ||
      resource.accessible_to === 'all'
    );
  };

  const toggleCategoryCollapse = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const getUrgentTasks = () => {
    if (!onboardingPlan) return [];
    const urgentTasks = [];
    const today = new Date();
    
    for (const milestone of onboardingPlan.plan_data.milestones) {
      for (const task of milestone.tasks) {
        // Check if task is overdue (due date is in the past)
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          if (dueDate < today && task.status !== 'Done') {
            urgentTasks.push({ ...task, milestone: milestone.label });
          }
        }
        // Also include high priority tasks that are in progress
        else if (task.status === 'In Progress' && task.priority === 'high') {
          urgentTasks.push({ ...task, milestone: milestone.label });
        }
      }
    }
    return urgentTasks.slice(0, 5);
  };

  const getUpcomingTasks = () => {
    if (!onboardingPlan) return [];
    const upcomingTasks = [];
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);
    
    for (const milestone of onboardingPlan.plan_data.milestones) {
      for (const task of milestone.tasks) {
        // Check if task is due within the next 5 days
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          if (dueDate >= today && dueDate <= fiveDaysFromNow && task.status !== 'Done') {
            upcomingTasks.push({ ...task, milestone: milestone.label });
          }
        }
        // Also include high priority tasks that are not started
        else if (task.status === 'Not Started' && task.priority === 'high') {
          upcomingTasks.push({ ...task, milestone: milestone.label });
        }
      }
    }
    return upcomingTasks.slice(0, 3);
  };

  const toggleMilestone = (milestoneId: string) => {
    const newCollapsed = new Set(collapsedMilestones);
    if (newCollapsed.has(milestoneId)) {
      newCollapsed.delete(milestoneId);
    } else {
      newCollapsed.add(milestoneId);
    }
    setCollapsedMilestones(newCollapsed);
  };

  const calculateTaskDueDate = (startDate: string, milestoneId: string, taskIndex: number) => {
    const start = new Date(startDate);
    const milestoneDays = {
      'day_1': 0,
      'week_1': 5,
      'day_30': 30,
      'day_60': 60,
      'day_90': 90
    };
    
    const milestoneDay = milestoneDays[milestoneId as keyof typeof milestoneDays] || 0;
    const taskDay = milestoneDay + taskIndex;
    
    const dueDate = new Date(start);
    dueDate.setDate(start.getDate() + taskDay);
    
    return dueDate.toISOString().split('T')[0];
  };

  const calculateScheduledProgressForFuture = (startDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const daysUntilStart = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart <= 0) return 0;
    if (daysUntilStart <= 5) return 1;
    if (daysUntilStart <= 30) return 2;
    if (daysUntilStart <= 60) return 3;
    if (daysUntilStart <= 90) return 4;
    return 5;
  };

  // Feedback handling functions
  const handleAddFeedback = async () => {
    if (!currentNewHire || !newFeedback.feedbackText.trim()) return;

    const feedbackData = await addOnboardingFeedback(
      currentNewHire.id,
      user?.id || '',
      currentNewHire.name,
      'employee',
      newFeedback.feedbackType,
      newFeedback.feedbackText.trim(),
      newFeedback.rating > 0 ? newFeedback.rating : undefined
    );

    if (feedbackData) {
      setFeedback([feedbackData, ...feedback]);
      setNewFeedback({
        feedbackType: 'general',
        feedbackText: '',
        rating: 0
      });
      setShowAddFeedback(false);
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'general': return '💬';
      case 'milestone': return '🎯';
      case 'task': return '✅';
      case 'self_assessment': return '🧠';
      default: return '💬';
    }
  };

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case 'general': return 'General Feedback';
      case 'milestone': return 'Milestone Feedback';
      case 'task': return 'Task Feedback';
      case 'self_assessment': return 'Self Assessment';
      default: return 'General Feedback';
    }
  };

  const getAuthorRoleColor = (role: string) => {
    switch (role) {
      case 'employee': return COLORS.teal;
      case 'manager': return COLORS.darkBlue;
      case 'buddy': return COLORS.orange;
      default: return COLORS.gray;
    }
  };

  // Feedback edit/delete functions
  const handleEditFeedback = async () => {
    if (!editingFeedback || !editingFeedbackText.trim()) return;

    const updatedFeedback = await updateOnboardingFeedback(
      editingFeedback.id,
      editingFeedbackText.trim(),
      editingFeedback.feedback_type,
      editingFeedback.rating
    );

    if (updatedFeedback) {
      setFeedback(feedback.map(f => f.id === editingFeedback.id ? updatedFeedback : f));
      setEditingFeedback(null);
      setEditingFeedbackText('');
    }
  };

  const handleDeleteFeedback = async (feedbackId: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    const success = await deleteOnboardingFeedback(feedbackId);
    if (success) {
      setFeedback(feedback.filter(f => f.id !== feedbackId));
    }
  };

  const startEditFeedback = (feedback: OnboardingFeedback) => {
    setEditingFeedback(feedback);
    setEditingFeedbackText(feedback.feedback_text);
  };



  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'link': return '🔗';
      case 'file': return '📄';
      default: return '📎';
    }
  };

  // Growth-related functions
  const fetchGrowthData = async () => {
    if (!currentNewHire) return;

    try {
      const testsData = await getGrowthTests(currentNewHire.id);
      const insightsData = await getGrowthInsights(currentNewHire.id);

      setGrowthTests(testsData.tests || []);
      setCompletedTests(testsData.completedTests || []);
      setGrowthInsights(insightsData.insights || []);
      setAdditionalInsights(insightsData.additionalInsights || []);
    } catch (error) {
      console.error('Error fetching growth data:', error);
    }
  };

  const startTest = (test: any) => {
    setSelectedTest(test);
    setCurrentTestAnswers({});
    setTestProgress(0);
    setShowTestModal(true);
  };

  const handleTestAnswer = (questionId: number, answer: string) => {
    setCurrentTestAnswers((prev: any) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitTest = async () => {
    if (!selectedTest || !currentNewHire) return;

    try {
      // Generate a simple result summary based on answers
      const resultSummary = `Completed ${selectedTest.name} with ${Object.keys(currentTestAnswers).length} questions answered.`;
      
      const result = await submitTestResult(
        currentNewHire.id,
        selectedTest.id,
        currentTestAnswers,
        resultSummary,
        []
      );

      if (result) {
        setShowTestModal(false);
        setSelectedTest(null);
        setCurrentTestAnswers({});
        setTestProgress(0);
        
        // Refresh growth data
        await fetchGrowthData();
        
        alert('Test completed successfully! Your results and insights have been saved.');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Failed to submit test. Please try again.');
    }
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
  const handleAddGoal = () => {
    if (newGoal.title.trim() && newGoal.description.trim()) {
      const goal = {
        id: Date.now(),
        ...newGoal,
        progress: 0,
        created_at: new Date().toISOString().split('T')[0],
        comments: []
      };
      setGoals(prev => [...prev, goal]);
      setNewGoal({
        title: '',
        description: '',
        timeframe: 'short-term',
        priority: 'medium'
      });
      setShowAddGoal(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.name.trim() && newSkill.description.trim()) {
      const skill = {
        id: Date.now(),
        ...newSkill,
        status: 'not-started' as const,
        progress: 0,
        created_at: new Date().toISOString().split('T')[0],
        comments: []
      };
      setSkills(prev => [...prev, skill]);
      setNewSkill({
        name: '',
        description: '',
        priority: 'medium',
        targetDate: ''
      });
      setShowAddSkill(false);
    }
  };

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

  // Edit and comment functions
  const startEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setShowEditGoal(true);
  };

  const startEditSkill = (skill: any) => {
    setEditingSkill(skill);
    setShowEditSkill(true);
  };

  const handleEditGoal = () => {
    if (editingGoal && editingGoal.title.trim() && editingGoal.description.trim()) {
      setGoals(prev => prev.map(goal => 
        goal.id === editingGoal.id ? editingGoal : goal
      ));
      setShowEditGoal(false);
      setEditingGoal(null);
    }
  };

  const handleEditSkill = () => {
    if (editingSkill && editingSkill.name.trim() && editingSkill.description.trim()) {
      setSkills(prev => prev.map(skill => 
        skill.id === editingSkill.id ? editingSkill : skill
      ));
      setShowEditSkill(false);
      setEditingSkill(null);
    }
  };

  const handleAddGoalComment = (goalId: number) => {
    if (newGoalComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newGoalComment,
        author: "Employee",
        created_at: new Date().toISOString().split('T')[0]
      };
      setGoals(prev => {
        const updatedGoals = prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, comments: [...goal.comments, comment] }
            : goal
        );
        // Save to localStorage
        localStorage.setItem('employee_growth_goals', JSON.stringify(updatedGoals));
        return updatedGoals;
      });
      setNewGoalComment('');
    }
  };

  const handleAddSkillComment = (skillId: number) => {
    if (newSkillComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newSkillComment,
        author: "Employee",
        created_at: new Date().toISOString().split('T')[0]
      };
      setSkills(prev => {
        const updatedSkills = prev.map(skill => 
          skill.id === skillId 
            ? { ...skill, comments: [...skill.comments, comment] }
            : skill
        );
        // Save to localStorage
        localStorage.setItem('employee_growth_skills', JSON.stringify(updatedSkills));
        return updatedSkills;
      });
      setNewSkillComment('');
    }
  };

  // Comment editing functions for goals and skills
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
      setGoals(prev => {
        const updatedGoals = prev.map(goal => 
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
        );
        // Save to localStorage
        localStorage.setItem('employee_growth_goals', JSON.stringify(updatedGoals));
        return updatedGoals;
      });
      setEditingGoalComment(null);
      setEditingGoalCommentText('');
    }
  };

  const handleEditSkillComment = () => {
    if (editingSkillComment && editingSkillCommentText.trim()) {
      setSkills(prev => {
        const updatedSkills = prev.map(skill => 
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
        );
        // Save to localStorage
        localStorage.setItem('employee_growth_skills', JSON.stringify(updatedSkills));
        return updatedSkills;
      });
      setEditingSkillComment(null);
      setEditingSkillCommentText('');
    }
  };

  const handleDeleteGoalComment = (goalId: number, commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setGoals(prev => {
      const updatedGoals = prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, comments: goal.comments.filter(comment => comment.id !== commentId) }
          : goal
      );
      // Save to localStorage
      localStorage.setItem('employee_growth_goals', JSON.stringify(updatedGoals));
      return updatedGoals;
    });
  };

  const handleDeleteSkillComment = (skillId: number, commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setSkills(prev => {
      const updatedSkills = prev.map(skill => 
        skill.id === skillId 
          ? { ...skill, comments: skill.comments.filter(comment => comment.id !== commentId) }
          : skill
      );
      // Save to localStorage
      localStorage.setItem('employee_growth_skills', JSON.stringify(updatedSkills));
      return updatedSkills;
    });
  };

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
    <div style={{
      fontFamily: "Ubuntu, Arial, sans-serif",
      background: GRADIENT_BG,
      minHeight: "100vh",
      paddingBottom: 40,
    }}>
      {/* Top Navigation */}
      <nav style={{
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
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image src="/guidium-logo.png" alt="Guidium Logo" width={90} height={90} style={{ display: "block" }} />
        </div>
        <div style={{ display: "flex", gap: "1.5rem", background: "rgba(42,157,143,0.08)", borderRadius: NAV_RADIUS, padding: "0.25rem 1rem" }}>
          {NAV_TABS.newhire.map((tab) => (
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
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          justifyContent: "space-between"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <SignOutButton>
              <button style={{
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
         {/* Home Tab Content */}
         {activeTab === "Home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Welcome Section */}
            <div style={{ 
              background: COLORS.white, 
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
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Welcome Back!</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  {currentNewHire ? `${currentNewHire.name} - ${currentNewHire.role}` : 'Employee'}
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {/* Onboarding Progress */}
                <div style={{
                  background: COLORS.lightGray,
                  borderRadius: 12,
                  padding: 20,
                  border: `1px solid ${COLORS.borderGray}`
                }}>
                  <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Onboarding Progress</div>
                  <div style={{ fontSize: 14, color: COLORS.darkBlue, lineHeight: 1.6 }}>
                    {onboardingPlan ? (
                      <>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>Current Milestone:</span> {
                            getCurrentMilestoneFromTasks(onboardingPlan)?.replace('_', ' ').toUpperCase() || 'NOT SET'
                          }
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>Progress:</span> {Math.round((calculateActualProgressFromTasks(onboardingPlan) / 5) * 100)}%
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>Start Date:</span> {currentNewHire?.start_date ? formatDate(currentNewHire.start_date) : 'Not set'}
                        </div>
                      </>
                    ) : (
                      <div>Loading onboarding plan...</div>
                    )}
                  </div>
                </div>

                                 {/* Quick Actions */}
                 <div style={{
                   background: COLORS.lightGray,
                   borderRadius: 12,
                   padding: 20,
                   border: `1px solid ${COLORS.borderGray}`
                 }}>
                   <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Quick Actions</div>
                   <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                     <button onClick={() => setActiveTab("Plan")} style={{
                       background: COLORS.darkBlue,
                       color: COLORS.white,
                       border: "none",
                       borderRadius: 8,
                       padding: "8px 12px",
                       fontSize: 14,
                       fontWeight: 600,
                       cursor: "pointer"
                     }}>
                       View My Plan
                     </button>
                     <button onClick={() => setActiveTab("Resources")} style={{
                       background: COLORS.darkBlue,
                       color: COLORS.white,
                       border: "none",
                       borderRadius: 8,
                       padding: "8px 12px",
                       fontSize: 14,
                       fontWeight: 600,
                       cursor: "pointer"
                     }}>
                       Access Resources
                     </button>
                   </div>
                 </div>

                 {/* Communication */}
                 <div style={{
                   background: COLORS.lightGray,
                   borderRadius: 12,
                   padding: 20,
                   border: `1px solid ${COLORS.borderGray}`
                 }}>
                   <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Communication</div>
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                     <button onClick={() => {
                       const subject = encodeURIComponent("Onboarding Support Request");
                       const body = encodeURIComponent(`Hi ${currentNewHire?.buddy?.name || 'Buddy'},\n\nI hope this email finds you well. I'm reaching out regarding my onboarding process.\n\nBest regards,\n${currentNewHire?.name || 'Employee'}`);
                       window.open(`mailto:${currentNewHire?.buddy?.email || ''}?subject=${subject}&body=${body}`);
                     }} style={{
                       background: COLORS.orange,
                       color: COLORS.white,
                       border: "none",
                       borderRadius: 8,
                       padding: "6px 8px",
                       fontSize: 12,
                       fontWeight: 600,
                       cursor: "pointer"
                     }}>
                       Email Buddy
                     </button>
                     <button onClick={() => {
                       const subject = encodeURIComponent("1:1 with Buddy");
                       const body = encodeURIComponent(`Hi ${currentNewHire?.buddy?.name || 'Buddy'},\n\nI'd like to schedule a 1:1 meeting to discuss my onboarding progress.\n\nBest regards,\n${currentNewHire?.name || 'Employee'}`);
                       const startTime = new Date();
                       startTime.setDate(startTime.getDate() + 1);
                       startTime.setHours(10, 0, 0, 0);
                       const endTime = new Date(startTime);
                       endTime.setHours(11, 0, 0, 0);
                       
                       const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(subject)}&details=${encodeURIComponent(body)}&dates=${startTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&add=${currentNewHire?.buddy?.email || ''}`;
                       window.open(calendarUrl, '_blank');
                     }} style={{
                       background: COLORS.yellow,
                       color: COLORS.darkBlue,
                       border: "none",
                       borderRadius: 8,
                       padding: "6px 8px",
                       fontSize: 12,
                       fontWeight: 600,
                       cursor: "pointer"
                     }}>
                       Schedule 1:1
                     </button>
                     <button onClick={() => {
                       const subject = encodeURIComponent("Onboarding Support Request");
                       const body = encodeURIComponent(`Hi ${currentNewHire?.manager?.name || 'Manager'},\n\nI hope this email finds you well. I'm reaching out regarding my onboarding process.\n\nBest regards,\n${currentNewHire?.name || 'Employee'}`);
                       window.open(`mailto:${currentNewHire?.manager?.email || ''}?subject=${subject}&body=${body}`);
                     }} style={{
                       background: COLORS.orange,
                       color: COLORS.white,
                       border: "none",
                       borderRadius: 8,
                       padding: "6px 8px",
                       fontSize: 12,
                       fontWeight: 600,
                       cursor: "pointer"
                     }}>
                       Email Manager
                     </button>
                     <button onClick={() => {
                       const subject = encodeURIComponent("1:1 with Manager");
                       const body = encodeURIComponent(`Hi ${currentNewHire?.manager?.name || 'Manager'},\n\nI'd like to schedule a 1:1 meeting to discuss my onboarding progress.\n\nBest regards,\n${currentNewHire?.name || 'Employee'}`);
                       const startTime = new Date();
                       startTime.setDate(startTime.getDate() + 1);
                       startTime.setHours(10, 0, 0, 0);
                       const endTime = new Date(startTime);
                       endTime.setHours(11, 0, 0, 0);
                       
                       const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(subject)}&details=${encodeURIComponent(body)}&dates=${startTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&add=${currentNewHire?.manager?.email || ''}`;
                       window.open(calendarUrl, '_blank');
                     }} style={{
                       background: COLORS.yellow,
                       color: COLORS.darkBlue,
                       border: "none",
                       borderRadius: 8,
                       padding: "6px 8px",
                       fontSize: 12,
                       fontWeight: 600,
                       cursor: "pointer"
                     }}>
                       Schedule 1:1
                     </button>
                   </div>
                 </div>
              </div>
            </div>

            {/* Urgent & Upcoming Items */}
            <div style={{ 
              background: COLORS.white, 
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
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Urgent & Upcoming Items</div>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
                                 {/* Urgent Tasks */}
                 <div style={{
                   background: COLORS.lightGray,
                   borderRadius: 12,
                   padding: 20,
                   border: `1px solid ${COLORS.borderGray}`
                 }}>
                   <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Urgent Tasks</div>
                   <div style={{ 
                     display: "flex", 
                     flexDirection: "column", 
                     gap: 8,
                     maxHeight: "200px",
                     overflowY: "auto",
                     paddingRight: "4px"
                   }}>
                     {getUrgentTasks().length > 0 ? (
                       getUrgentTasks().map((task, idx) => (
                         <div key={idx} style={{
                           background: COLORS.white,
                           borderRadius: 8,
                           padding: 12,
                           border: `1px solid ${COLORS.errorRed}30`,
                           borderLeft: `3px solid ${COLORS.errorRed}`,
                           flexShrink: 0
                         }}>
                           <div style={{ fontWeight: 600, color: COLORS.darkBlue, fontSize: 14 }}>{task.name}</div>
                           <div style={{ fontSize: 12, color: COLORS.textGray }}>
                             {task.milestone}
                             {task.due_date && (
                               <span style={{ color: COLORS.errorRed, fontWeight: 600 }}>
                                 • Due: {formatDate(task.due_date)}
                               </span>
                             )}
                           </div>
                         </div>
                       ))
                     ) : (
                       <div style={{ fontSize: 14, color: COLORS.textGray, fontStyle: "italic" }}>No urgent tasks at the moment</div>
                     )}
                   </div>
                 </div>

                                 {/* Upcoming Tasks */}
                 <div style={{
                   background: COLORS.lightGray,
                   borderRadius: 12,
                   padding: 20,
                   border: `1px solid ${COLORS.borderGray}`
                 }}>
                   <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 12 }}>Upcoming Tasks</div>
                   <div style={{ 
                     display: "flex", 
                     flexDirection: "column", 
                     gap: 8,
                     maxHeight: "200px",
                     overflowY: "auto",
                     paddingRight: "4px"
                   }}>
                     {getUpcomingTasks().length > 0 ? (
                       getUpcomingTasks().map((task, idx) => (
                         <div key={idx} style={{
                           background: COLORS.white,
                           borderRadius: 8,
                           padding: 12,
                           border: `1px solid ${COLORS.warningAmber}30`,
                           borderLeft: `3px solid ${COLORS.warningAmber}`,
                           flexShrink: 0
                         }}>
                           <div style={{ fontWeight: 600, color: COLORS.darkBlue, fontSize: 14 }}>{task.name}</div>
                           <div style={{ fontSize: 12, color: COLORS.textGray }}>
                             {task.milestone}
                             {task.due_date && (
                               <span style={{ color: COLORS.warningAmber, fontWeight: 600 }}>
                                 • Due: {formatDate(task.due_date)}
                               </span>
                             )}
                           </div>
                         </div>
                       ))
                     ) : (
                       <div style={{ fontSize: 14, color: COLORS.textGray, fontStyle: "italic" }}>No upcoming tasks</div>
                     )}
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

                                   {/* Plan Tab Content */}
         {activeTab === "Plan" && (
           <div>
             {/* Employee High-Level Overview */}
             <div style={{ 
               background: COLORS.white, 
               borderRadius: 16, 
               padding: "2rem",
               marginBottom: "2rem",
               boxShadow: "0 4px 24px rgba(38,70,83,0.10)",
               border: "1px solid rgba(42,157,143,0.1)"
             }}>
               {/* Employee Info Header */}
               <div style={{ 
                 display: "flex", 
                 alignItems: "flex-start", 
                 justifyContent: "space-between",
                 marginBottom: "2rem"
               }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                   {/* Avatar */}
                   <div style={{
                     width: 80,
                     height: 80,
                     borderRadius: "50%",
                     background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.red} 100%)`,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     color: COLORS.white,
                     fontSize: 32,
                     fontWeight: 700,
                     boxShadow: "0 4px 16px rgba(231,111,81,0.3)"
                   }}>
                     {getInitials(currentNewHire?.name || 'E')}
                   </div>
                   
                   {/* Employee Details */}
                   <div>
                     <div style={{ 
                       fontSize: 28, 
                       fontWeight: 700, 
                       color: COLORS.darkBlue, 
                       marginBottom: 4 
                     }}>
                       {currentNewHire?.name || 'Employee'}
                     </div>
                     <div style={{ 
                       fontSize: 16, 
                       color: COLORS.textGray, 
                       marginBottom: 8 
                     }}>
                       {currentNewHire?.role || 'Role not set'}
                     </div>
                     <div style={{ 
                       fontSize: 14, 
                       color: COLORS.textGray 
                     }}>
                       Start Date: {currentNewHire ? formatDate(currentNewHire.start_date) : 'Not set'} • {currentNewHire?.workdays_since_start || 0} days since joining
                     </div>
                   </div>
                 </div>
                 
                 {/* Status and Buddy */}
                 <div style={{ textAlign: "right" }}>
                   <div style={{
                     background: (() => {
                       const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                       const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                         ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                         : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                       
                       if (actualProgress < scheduledProgress) return COLORS.errorRed;
                       if (actualProgress === scheduledProgress) return COLORS.successGreen;
                       return COLORS.warningAmber;
                     })(),
                     color: COLORS.white,
                     padding: "8px 16px",
                     borderRadius: 20,
                     fontSize: 12,
                     fontWeight: 700,
                     textTransform: "uppercase",
                     marginBottom: 8
                   }}>
                     {(() => {
                       const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                       const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                         ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                         : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                       
                       if (actualProgress < scheduledProgress) return 'OVERDUE';
                       if (actualProgress === scheduledProgress) return 'ON TRACK';
                       return 'AHEAD';
                     })()}
                   </div>
                   <div style={{ fontSize: 14, color: COLORS.textGray }}>
                     Buddy: {currentNewHire?.buddy?.name || 'Not assigned'}
                   </div>
                 </div>
               </div>
               
               {/* Onboarding Progress */}
               <div>
                 <div style={{ 
                   fontSize: 20, 
                   fontWeight: 700, 
                   color: COLORS.darkBlue, 
                   marginBottom: "1.5rem" 
                 }}>
                   Onboarding Progress
                 </div>
                 
                 {/* Progress Metrics */}
                 <div style={{ 
                   display: "flex", 
                   justifyContent: "space-between", 
                   marginBottom: "1rem",
                   fontSize: 16,
                   color: COLORS.darkBlue
                 }}>
                   <div>
                     <strong>Scheduled Progress:</strong> <span style={{ marginLeft: "0.5rem" }}>
                       {(() => {
                         const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                           ? calculateScheduledProgressForFuture(currentNewHire.start_date) 
                           : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                         return `${scheduledProgress}/5`;
                       })()}
                     </span>
                   </div>
                   <div>
                     <strong>Actual Progress:</strong> <span style={{ 
                       marginLeft: "0.5rem",
                       color: COLORS.errorRed,
                       fontWeight: 700
                     }}>
                       {(() => {
                         const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                         return `${actualProgress}/5`;
                       })()}
                     </span>
                   </div>
                 </div>
                 
                                   {/* Progress Bar */}
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <div style={{ 
                      height: 12, 
                      background: COLORS.lightGray, 
                      borderRadius: 6, 
                      overflow: "hidden", 
                      position: "relative",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                      {/* Scheduled Progress Bar */}
                      <div style={{ 
                        width: `${(() => {
                          const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                            ? calculateScheduledProgressForFuture(currentNewHire.start_date) 
                            : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                          return (scheduledProgress / 5) * 100;
                        })()}%`, 
                        height: 12, 
                        background: '#B0B6C3', // More visible, darker grey
                        borderRadius: 6,
                        transition: "width 0.5s ease-out",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 1
                      }} />
                      
                      {/* Actual Progress Bar */}
                      <div style={{ 
                        width: `${(() => {
                          const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                          const progressPercentage = (actualProgress / 5) * 100;
                          
                          // Ensure even 1/5 progress (20%) is clearly visible
                          const minVisibleWidth = Math.max(20, progressPercentage);
                          
                          return minVisibleWidth;
                        })()}%`, 
                        height: 12, 
                        background: (() => {
                          const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                          const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                            ? calculateScheduledProgressForFuture(currentNewHire.start_date) 
                            : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                          if (actualProgress < scheduledProgress) return COLORS.errorRed;
                          if (actualProgress === scheduledProgress) return COLORS.successGreen;
                          return COLORS.warningAmber;
                        })(),
                        borderRadius: 6,
                        transition: "width 0.3s ease",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 2
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
                        left: "100%", 
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
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        <span style={{ 
                          color: COLORS.darkBlue,
                          opacity: 0.8,
                          background: COLORS.white,
                          padding: "2px 6px",
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}>Day 1</span>
                      </div>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        <span style={{ 
                          color: COLORS.darkBlue, 
                          opacity: 0.8,
                          background: COLORS.white,
                          padding: "2px 6px",
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}>Week 1</span>
                      </div>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        <span style={{ 
                          color: COLORS.darkBlue, 
                          opacity: 0.8,
                          background: COLORS.white, 
                          padding: "2px 6px", 
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}>Day 30</span>
                      </div>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        <span style={{ 
                          color: COLORS.darkBlue, 
                          opacity: 0.8,
                          background: COLORS.white, 
                          padding: "2px 6px", 
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}>Day 60</span>
                      </div>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        <span style={{ 
                          color: COLORS.darkBlue, 
                          opacity: 0.8,
                          background: COLORS.white, 
                          padding: "2px 6px", 
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}>Day 90</span>
                      </div>
                    </div>
                  </div>
               </div>
             </div>

             {/* Plan Sub-Tabs Navigation */}
             <div style={{ 
               display: "flex", 
               justifyContent: "center",
               marginBottom: "2rem"
             }}>
               <div style={{ 
                 display: "flex", 
                 gap: "0.25rem", 
                 background: NAV_BG,
                 padding: "0.5rem",
                 borderRadius: NAV_RADIUS,
                 backdropFilter: "blur(10px)",
                 border: "1px solid rgba(255,255,255,0.2)",
                 boxShadow: "0 4px 16px rgba(38,70,83,0.1)"
               }}>
                                    {["Overview", "Plan", "Feedback"].map((tab) => (
                   <button
                     key={tab}
                     onClick={() => setPlanSubTab(tab)}
                     style={{
                       padding: "0.75rem 1.5rem",
                       borderRadius: NAV_RADIUS - 4,
                       border: "none",
                       fontSize: 14,
                       fontWeight: 600,
                       cursor: "pointer",
                       transition: "all 0.2s ease",
                       background: planSubTab === tab ? NAV_ACTIVE_BG : NAV_INACTIVE_BG,
                       color: planSubTab === tab ? NAV_ACTIVE_COLOR : NAV_INACTIVE_COLOR,
                       boxShadow: planSubTab === tab ? "0 2px 8px rgba(42,157,143,0.3)" : "none",
                       minWidth: "120px"
                     }}
                   >
                     {tab}
                   </button>
                 ))}
               </div>
             </div>

             {/* Plan Sub-Tab Content */}
             <div>
               {planSubTab === "Overview" && (
                 <div>
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                     <div style={{ 
                       background: COLORS.gray, 
                       borderRadius: 12, 
                       padding: "1.5rem" 
                     }}>
                       <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, marginBottom: "1rem" }}>
                         Current Status
                       </h4>
                       <div style={{ fontSize: 16, color: COLORS.darkBlue, lineHeight: 1.6 }}>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Current Milestone:</strong> {
                             currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                               ? 'NOT STARTED' 
                               : (() => {
                                   const currentMilestone = onboardingPlan ? getCurrentMilestoneFromTasks(onboardingPlan) : currentNewHire?.current_milestone;
                                   return currentMilestone?.replace('_', ' ').toUpperCase() || 'NOT SET';
                                 })()
                           }
                         </div>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Expected Milestone:</strong> {
                             currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                               ? 'NOT STARTED' 
                               : currentNewHire?.expected_milestone?.replace('_', ' ').toUpperCase() || 'NOT SET'
                           }
                         </div>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Status:</strong> <span style={{ 
                             color: (() => {
                               const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                               const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                                 ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                                 : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                               
                               if (actualProgress < scheduledProgress) return COLORS.errorRed;
                               if (actualProgress === scheduledProgress) return COLORS.successGreen;
                               return COLORS.warningAmber;
                             })(), 
                             fontWeight: 700 
                           }}>
                             {(() => {
                               const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                               const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                                 ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                                 : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                               
                               if (actualProgress < scheduledProgress) return 'OVERDUE';
                               if (actualProgress === scheduledProgress) return 'ON TRACK';
                               return 'AHEAD';
                             })()}
                           </span>
                         </div>
                         <div>
                           <strong>{currentNewHire && new Date(currentNewHire.start_date) > new Date() ? 'Days until start date:' : 'Days since joining:'}</strong> {
                             currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                               ? `${Math.abs(currentNewHire?.workdays_since_start || 0)} days`
                               : `${currentNewHire?.workdays_since_start || 0} days`
                           }
                         </div>
                       </div>
                     </div>

                     <div style={{ 
                       background: COLORS.gray, 
                       borderRadius: 12, 
                       padding: "1.5rem" 
                     }}>
                       <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, marginBottom: "1rem" }}>
                         Team Information
                       </h4>
                       <div style={{ fontSize: 16, color: COLORS.darkBlue, lineHeight: 1.6 }}>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Manager:</strong> {currentNewHire?.manager?.name || 'Not assigned'}
                         </div>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Buddy:</strong> {currentNewHire?.buddy?.name || 'Not assigned'}
                         </div>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Role:</strong> {currentNewHire?.role || 'Not set'}
                         </div>
                         <div>
                           <strong>Start Date:</strong> {currentNewHire ? formatDate(currentNewHire.start_date) : 'Not set'}
                         </div>
                       </div>
                     </div>

                     <div style={{ 
                       background: COLORS.gray, 
                       borderRadius: 12, 
                       padding: "1.5rem" 
                     }}>
                       <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, marginBottom: "1rem" }}>
                         Progress Summary
                       </h4>
                       <div style={{ fontSize: 16, color: COLORS.darkBlue, lineHeight: 1.6 }}>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Scheduled Progress:</strong> <span style={{ marginLeft: "0.5rem" }}>
                             {(() => {
                               const scheduledProgress = currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                                 ? calculateScheduledProgressForFuture(currentNewHire.start_date) 
                                 : calculateScheduledProgress(currentNewHire?.workdays_since_start || 0);
                               return `${scheduledProgress}/5 milestones`;
                             })()}
                           </span>
                         </div>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Actual Progress:</strong> <span style={{ marginLeft: "0.5rem" }}>
                             {(() => {
                               const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                               return `${actualProgress}/5 milestones`;
                             })()}
                           </span>
                         </div>
                         <div style={{ marginBottom: 8 }}>
                           <strong>Completion Rate:</strong> {(() => {
                             const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : 0;
                             return Math.round((actualProgress / 5) * 100);
                           })()}%
                         </div>
                         <div>
                           <strong>Days Remaining:</strong> {
                             currentNewHire && new Date(currentNewHire.start_date) > new Date() 
                               ? `${Math.abs(currentNewHire?.workdays_since_start || 0)} days until start`
                               : `${Math.max(0, 90 - (currentNewHire?.workdays_since_start || 0))} days`
                           }
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {planSubTab === "Plan" && (
                 <div>
                   {/* AI-Generated Onboarding Plan */}
                   {onboardingPlan && onboardingPlan.plan_data && onboardingPlan.plan_data.milestones && onboardingPlan.plan_data.milestones.length > 0 ? (
                     onboardingPlan.plan_data.milestones.map((milestone: any, idx: number) => (
                       <div key={milestone.label} style={{ 
                         marginBottom: 24,
                         background: `${milestone.color}08`,
                         borderRadius: 16,
                         border: `2px solid ${milestone.color}20`,
                         overflow: "hidden",
                         boxShadow: `0 2px 12px ${milestone.color}15`
                       }}>
                         {/* Compact Milestone Header */}
                         <div style={{ 
                           display: "flex", 
                           alignItems: "center", 
                           justifyContent: "space-between",
                           gap: 16, 
                           padding: "16px 20px",
                           background: (() => {
                             const completedTasks = milestone.tasks?.filter((task: any) => task.status === 'completed').length || 0;
                             const totalTasks = milestone.tasks?.length || 0;
                             const isCompleted = completedTasks === totalTasks && totalTasks > 0;
                             return isCompleted 
                               ? `linear-gradient(135deg, ${COLORS.successGreen} 0%, ${COLORS.successGreen}dd 100%)`
                               : `linear-gradient(135deg, ${milestone.color} 0%, ${milestone.color}dd 100%)`;
                           })(),
                           color: COLORS.white,
                           position: "relative",
                           cursor: "pointer"
                         }}
                         onClick={() => toggleMilestone(milestone.id)}
                         >
                           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                             <div style={{ 
                               fontWeight: 800, 
                               fontSize: 20,
                               textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                               letterSpacing: "0.5px"
                             }}>
                               {milestone.label}
                             </div>
                             <div style={{ 
                               fontSize: 16,
                               transition: "transform 0.2s",
                               transform: collapsedMilestones.has(milestone.id) ? "rotate(-90deg)" : "rotate(0deg)"
                             }}>
                               ▼
                             </div>
                           </div>
                           <div style={{ 
                             background: "rgba(255,255,255,0.2)", 
                             color: COLORS.white, 
                             borderRadius: 16, 
                             padding: "6px 12px", 
                             fontSize: 12, 
                             fontWeight: 700,
                             backdropFilter: "blur(10px)",
                             border: "1px solid rgba(255,255,255,0.3)"
                           }}>
                             {(() => {
                               const completedTasks = milestone.tasks?.filter((task: any) => task.status === 'completed').length || 0;
                               const totalTasks = milestone.tasks?.length || 0;
                               const isCompleted = completedTasks === totalTasks && totalTasks > 0;
                               return (
                                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                   {isCompleted && <span style={{ fontSize: 14 }}>✅</span>}
                                   <span>{completedTasks}/{totalTasks} {(totalTasks === 1 ? 'task' : 'tasks')}</span>
                                 </div>
                               );
                             })()}
                           </div>
                         </div>
                         
                         {/* Compact Task Cards Container */}
                         {!collapsedMilestones.has(milestone.id) && (
                           <div style={{ 
                             padding: "8px",
                             background: COLORS.white
                           }}>
                             <div style={{ display: "grid", gap: 6 }}>
                               {milestone.tasks?.map((task: any, taskIdx: number) => {
                                 // Calculate actual due date based on milestone and task position
                                 const actualDueDate = calculateTaskDueDate(currentNewHire?.start_date || '', milestone.id, taskIdx);
                                 
                                 // Calculate days overdue
                                 const today = new Date();
                                 const dueDate = new Date(actualDueDate);
                                 const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                                 
                                 // Format due date display
                                 const formattedDueDate = (() => {
                                   if (daysOverdue > 0) {
                                     return (
                                       <span style={{ color: COLORS.errorRed, fontWeight: 700 }}>
                                         {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                                       </span>
                                     );
                                   } else if (daysOverdue === 0 && today.toDateString() === dueDate.toDateString()) {
                                     return (
                                       <span style={{ color: COLORS.warningAmber, fontWeight: 700 }}>
                                         Due today
                                       </span>
                                     );
                                   } else {
                                     return (
                                       <span>
                                         {new Date(actualDueDate).toLocaleDateString('en-GB', {
                                           day: 'numeric',
                                           month: 'short',
                                           year: 'numeric'
                                         })}
                                       </span>
                                     );
                                   }
                                 })();
                                 
                                 return (
                                   <div key={`${milestone.id}-task-${taskIdx}`} style={{ 
                                     background: COLORS.white, 
                                     borderRadius: 6, 
                                     padding: 6,
                                     boxShadow: "0 1px 3px rgba(38,70,83,0.05)",
                                     transition: "all 0.2s ease",
                                     cursor: "pointer",
                                     position: "relative",
                                     overflow: "hidden",
                                     borderLeft: `3px solid ${milestone.color}`,
                                     borderTop: `1px solid ${task.status === "completed" ? `${COLORS.successGreen}30` : task.status === "in_progress" ? `${COLORS.warningAmber}30` : task.status === "overdue" ? `${COLORS.errorRed}30` : task.status === "on_hold" ? `${COLORS.yellow}30` : `${COLORS.gray}30`}`,
                                     borderRight: `1px solid ${task.status === "completed" ? `${COLORS.successGreen}30` : task.status === "in_progress" ? `${COLORS.warningAmber}30` : task.status === "overdue" ? `${COLORS.errorRed}30` : task.status === "on_hold" ? `${COLORS.yellow}30` : `${COLORS.gray}30`}`,
                                     borderBottom: `1px solid ${task.status === "completed" ? `${COLORS.successGreen}30` : task.status === "in_progress" ? `${COLORS.warningAmber}30` : task.status === "overdue" ? `${COLORS.errorRed}30` : task.status === "on_hold" ? `${COLORS.yellow}30` : `${COLORS.gray}30`}`
                                   }}>
                                     {/* Task Header */}
                                     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                       <div style={{ flex: 1 }}>
                                         <div style={{ 
                                           fontWeight: 700, 
                                           fontSize: 15, 
                                           color: COLORS.darkBlue, 
                                           marginBottom: 2,
                                           textDecoration: task.status === "completed" ? "line-through" : "none",
                                           opacity: task.status === "completed" ? 0.6 : 1,
                                           lineHeight: 1.2
                                         }}>
                                           {task.name}
                                         </div>
                                       </div>
                                       
                                       {/* Status Dropdown */}
                                       <select
                                         value={task.status || "not_started"}
                                         onChange={(e) => {
                                           // TODO: Implement status update
                                           console.log('Status changed to:', e.target.value);
                                         }}
                                         onClick={(e) => e.stopPropagation()}
                                         style={{
                                           padding: "4px 8px",
                                           borderRadius: 8,
                                           border: "none",
                                           fontSize: 12,
                                           fontWeight: 600,
                                           textTransform: "uppercase",
                                           cursor: "pointer",
                                           background: task.status === "completed" ? COLORS.successGreen : 
                                                        task.status === "in_progress" ? COLORS.warningAmber : 
                                                        task.status === "overdue" ? COLORS.errorRed : 
                                                        task.status === "on_hold" ? COLORS.yellow : 
                                                        COLORS.darkGray,
                                           color: COLORS.white
                                         }}
                                       >
                                         <option value="not_started">Not Started</option>
                                         <option value="in_progress">In Progress</option>
                                         <option value="completed">Completed</option>
                                         <option value="on_hold">On Hold</option>
                                       </select>
                                     </div>

                                     {/* Task Details */}
                                     <div style={{ 
                                       display: "flex", 
                                       alignItems: "center", 
                                       gap: 6, 
                                       marginBottom: 4,
                                       fontSize: 12,
                                       color: COLORS.darkBlue,
                                       opacity: 0.8
                                     }}>
                                       <span style={{ fontWeight: 600 }}>
                                         📅 {formattedDueDate}
                                       </span>
                                       <span style={{ fontWeight: 600 }}>
                                         ⏱️ {task.estimated_hours || 2}h
                                       </span>
                                       {/* Department/Tag */}
                                       {task.tags && task.tags.length > 0 && (
                                         <span style={{ 
                                           padding: "2px 6px", 
                                           background: `${COLORS.orange}40`, 
                                           color: COLORS.darkBlue,
                                           borderRadius: 4,
                                           fontSize: 11,
                                           fontWeight: 600,
                                           border: `1px solid ${COLORS.orange}60`
                                         }}>
                                           {task.tags[0]}
                                         </span>
                                       )}
                                     </div>





                                     {/* Action Buttons */}
                                     <div style={{ 
                                       display: "flex", 
                                       gap: 4, 
                                       justifyContent: "flex-end",
                                       paddingTop: 2,
                                       borderTop: `1px solid ${COLORS.gray}15`
                                     }}>
                                       <button
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           router.push(`/app/dashboard/employee/${currentNewHire?.id}/task/${encodeURIComponent(task.id || task.name)}`);
                                         }}
                                         style={{
                                           background: COLORS.white,
                                           color: COLORS.darkBlue,
                                           border: `1px solid ${COLORS.gray}30`,
                                           borderRadius: 4,
                                           padding: "3px 6px",
                                           fontWeight: 600,
                                           cursor: "pointer",
                                           fontSize: 12,
                                           transition: "all 0.2s"
                                         }}
                                       >
                                         View
                                       </button>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </div>
                         )}
                       </div>
                     ))
                   ) : (
                     <div style={{ 
                       textAlign: "center", 
                       padding: "60px 20px", 
                       color: COLORS.darkBlue, 
                       opacity: 0.7,
                       background: COLORS.white,
                       borderRadius: 18,
                       boxShadow: "0 4px 24px rgba(38,70,83,0.10)"
                     }}>
                       <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                       <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>AI Onboarding Plan</div>
                       <div style={{ fontSize: 16, marginBottom: 24 }}>
                         Your personalised onboarding plan will be generated once your manager adds you to the system.
                       </div>
                       <div style={{ 
                         background: `${COLORS.teal}10`, 
                         border: `2px solid ${COLORS.teal}30`, 
                         borderRadius: 12, 
                         padding: 16,
                         fontSize: 14
                       }}>
                         💡 <strong>What to expect:</strong> Role-specific tasks, milestone tracking, and personalised learning paths tailored to your position.
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {planSubTab === "Feedback" && (
                 <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                   {/* Feedback Header */}
                   <div style={{ 
                     display: "flex", 
                     justifyContent: "space-between", 
                     alignItems: "center",
                     background: COLORS.white,
                     borderRadius: 16,
                     padding: "1.5rem",
                     boxShadow: CARD_SHADOW
                   }}>
                     <div>
                       <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: "0 0 0.5rem 0" }}>
                         Feedback & Reviews
                       </h3>
                       <p style={{ fontSize: 16, color: COLORS.textGray, margin: 0 }}>
                         Share feedback about your onboarding experience and view feedback from your team
                       </p>
                     </div>
                     <button
                       onClick={() => setShowAddFeedback(true)}
                       style={{
                         background: COLORS.teal,
                         color: COLORS.white,
                         border: "none",
                         borderRadius: 12,
                         padding: "12px 24px",
                         fontWeight: 600,
                         fontSize: 16,
                         cursor: "pointer",
                         transition: "all 0.2s",
                         display: "flex",
                         alignItems: "center",
                         gap: 8
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
                       ✨ Add Feedback
                     </button>
                   </div>

                   {/* Feedback List */}
                   <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                     {feedback.length === 0 ? (
                       <div style={{ 
                         textAlign: "center", 
                         padding: "3rem 2rem", 
                         background: COLORS.white,
                         borderRadius: 16,
                         boxShadow: CARD_SHADOW
                       }}>
                         <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                         <div style={{ fontWeight: 700, fontSize: 20, color: COLORS.darkBlue, marginBottom: 8 }}>
                           No feedback yet
                         </div>
                         <div style={{ fontSize: 16, color: COLORS.textGray, marginBottom: 24 }}>
                           Be the first to share feedback about your onboarding experience
                         </div>
                         <button
                           onClick={() => setShowAddFeedback(true)}
                           style={{
                             background: COLORS.teal,
                             color: COLORS.white,
                             border: "none",
                             borderRadius: 8,
                             padding: "10px 20px",
                             fontWeight: 600,
                             fontSize: 14,
                             cursor: "pointer"
                           }}
                         >
                           Add First Feedback
                         </button>
                       </div>
                     ) : (
                       feedback.map((item) => (
                         <div key={item.id} style={{ 
                           background: COLORS.white,
                           borderRadius: 16,
                           padding: "1.5rem",
                           boxShadow: CARD_SHADOW,
                           border: `1px solid ${COLORS.borderGray}`
                         }}>
                                                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ 
                              fontSize: 24,
                              background: `${getAuthorRoleColor(item.author_role)}20`,
                              borderRadius: 12,
                              padding: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              {getFeedbackTypeIcon(item.feedback_type)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.darkBlue }}>
                                {item.author_name}
                              </div>
                              <div style={{ fontSize: 14, color: COLORS.textGray }}>
                                {getFeedbackTypeLabel(item.feedback_type)} • {new Date(item.created_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {item.rating && (
                              <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 4,
                                background: `${COLORS.yellow}20`,
                                padding: "4px 8px",
                                borderRadius: 8
                              }}>
                                <span style={{ fontSize: 14 }}>⭐</span>
                                <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.darkBlue }}>
                                  {item.rating}/5
                                </span>
                              </div>
                            )}
                            {item.author_id === user?.id && (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  onClick={() => startEditFeedback(item)}
                                  style={{
                                    background: COLORS.teal,
                                    color: COLORS.white,
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFeedback(item.id)}
                                  style={{
                                    background: COLORS.errorRed,
                                    color: COLORS.white,
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                           <div style={{ 
                             fontSize: 16, 
                             color: COLORS.darkBlue, 
                             lineHeight: 1.6,
                             background: COLORS.lightGray,
                             padding: "1rem",
                             borderRadius: 8
                           }}>
                             {item.feedback_text}
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}


             </div>
           </div>
         )}

         

         {/* Growth Tab Content */}
        {activeTab === "Growth" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Personal Development Journey */}
            <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 40, marginBottom: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 24, color: COLORS.teal, marginBottom: 24 }}>Personal Development Journey</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 0, position: "relative", marginBottom: 24 }}>
                {/* Development Path */}
                <div style={{ position: "absolute", top: 32, left: 60, right: 60, height: 8, background: COLORS.gray, borderRadius: 8, zIndex: 0 }} />
                {/* Development Stages */}
                {[
                  { label: "Self-Awareness", color: COLORS.teal, complete: completedTests.length > 0, icon: "🧠", key: 'self-awareness' },
                  { label: "Goal Setting", color: COLORS.yellow, complete: goals.length > 0, icon: "🎯", key: 'goal-setting' },
                  { label: "Skill Building", color: COLORS.orange, complete: skills.length > 0, icon: "📚", key: 'skill-building' },
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
                        justifyContent: "space-between",
                        marginBottom: 16,
                        padding: "12px 16px",
                        background: COLORS.yellow,
                        borderRadius: 12,
                        color: COLORS.darkBlue
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Available Tests</div>
                        <Link href="/app/dashboard/growth-tests" style={{
                          background: COLORS.darkBlue,
                          color: COLORS.white,
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          textDecoration: "none",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = COLORS.teal;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = COLORS.darkBlue;
                        }}>
                          View All Tests
                        </Link>
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
                        onClick={() => startTest(test)}
                        >
                          <div style={{ fontWeight: 700, color: COLORS.darkBlue, marginBottom: 4 }}>{test.name}</div>
                          <div style={{ fontSize: 13, color: COLORS.textGray, marginBottom: 8 }}>{test.description}</div>
                          <div style={{ fontSize: 12, color: COLORS.teal, fontWeight: 600 }}>
                            Duration: {test.duration_minutes} min
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
                  <button 
                    onClick={() => setShowAddGoal(true)}
                    style={{
                      background: COLORS.yellow,
                      color: COLORS.darkBlue,
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 20px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 14,
                      transition: "all 0.2s"
                    }}
                  >
                    + Add Goal
                  </button>
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
                        <div style={{ display: "flex", gap: 8 }}>
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
                          <button
                            onClick={() => startEditGoal(goal)}
                            style={{
                              background: COLORS.teal,
                              color: COLORS.white,
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Edit
                          </button>
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
                                  {comment.author === "Employee" && (
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
                      No goals set yet. Click "Add Goal" to start planning your career objectives!
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
                  <button 
                    onClick={() => setShowAddSkill(true)}
                    style={{
                      background: COLORS.orange,
                      color: COLORS.white,
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 20px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 14,
                      transition: "all 0.2s"
                    }}
                  >
                    + Add Skill
                  </button>
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
                        <div style={{ display: "flex", gap: 8 }}>
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
                          <button
                            onClick={() => startEditSkill(skill)}
                            style={{
                              background: COLORS.orange,
                              color: COLORS.white,
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            Edit
                          </button>
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
                                  {comment.author === "Employee" && (
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
                      No skills added yet. Click "Add Skill" to start building your development plan!
                    </div>
                  )}
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
              background: COLORS.white, 
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
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Your Resources Library</div>
                </div>
                                 <button onClick={() => setShowAddResource(true)} style={{
                   background: "rgba(255,255,255,0.2)",
                   color: COLORS.white,
                   border: "none",
                   borderRadius: 8,
                   padding: "8px 16px",
                   fontWeight: 600,
                   cursor: "pointer",
                   fontSize: 14,
                   transition: "all 0.2s"
                 }}>
                   Add Resource
                 </button>
              </div>

              {/* Resources Overview */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div style={{
                  background: COLORS.teal + '20',
                  borderRadius: 8,
                  padding: 16,
                  border: `1px solid ${COLORS.teal}30`
                }}>
                  <div style={{ fontWeight: 700, color: COLORS.teal, fontSize: 24 }}>
                    {getAccessibleResources().length}
                  </div>
                  <div style={{ fontSize: 14, color: COLORS.darkBlue }}>Total Resources</div>
                </div>
                                 <div style={{
                   background: COLORS.successGreen + '20',
                   borderRadius: 8,
                   padding: 16,
                   border: `1px solid ${COLORS.successGreen}30`
                 }}>
                   <div style={{ fontWeight: 700, color: COLORS.successGreen, fontSize: 24 }}>
                     {getAccessibleResources().filter(r => r.type === 'file').length}
                   </div>
                   <div style={{ fontSize: 14, color: COLORS.darkBlue }}>Files</div>
                 </div>
                 <div style={{
                   background: COLORS.warningAmber + '20',
                   borderRadius: 8,
                   padding: 16,
                   border: `1px solid ${COLORS.warningAmber}30`
                 }}>
                   <div style={{ fontWeight: 700, color: COLORS.warningAmber, fontSize: 24 }}>
                     {getAccessibleResources().filter(r => r.type === 'link').length}
                   </div>
                   <div style={{ fontSize: 14, color: COLORS.darkBlue }}>Links</div>
                 </div>
              </div>
            </div>

                         {/* Resources by Category */}
             <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
               {/* Files and Links together */}
               <div style={{ 
                 background: COLORS.white, 
                 borderRadius: 16, 
                 border: `1px solid ${COLORS.borderGray}`,
                 overflow: "hidden"
               }}>
                 {/* Category Header */}
                 <div style={{ 
                   display: "flex", 
                   alignItems: "center", 
                   justifyContent: "space-between",
                   padding: "16px 20px",
                   background: COLORS.lightGray,
                   borderBottom: `1px solid ${COLORS.borderGray}`,
                   cursor: "pointer"
                 }}
                 onClick={() => toggleCategoryCollapse('Resources')}
                 >
                   <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                     <div style={{ fontSize: 20 }}>📁</div>
                     <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>All Resources</div>
                     <div style={{ 
                       background: COLORS.teal, 
                       color: COLORS.white, 
                       borderRadius: 12, 
                       padding: "2px 8px", 
                       fontSize: 12, 
                       fontWeight: 600 
                     }}>
                       {getAccessibleResources().length}
                     </div>
                   </div>
                   <div style={{ 
                     transform: collapsedCategories.has('Resources') ? "rotate(0deg)" : "rotate(180deg)",
                     transition: "transform 0.2s",
                     fontSize: 20
                   }}>
                     ▼
                   </div>
                 </div>

                 {/* Resources List */}
                 {!collapsedCategories.has('Resources') && (
                   <div style={{ padding: "12px" }}>
                     {(() => {
                       // Group resources by category
                       const resourcesByCategory = getAccessibleResources().reduce((acc: any, resource) => {
                         const category = resource.category || 'Uncategorized';
                         if (!acc[category]) {
                           acc[category] = [];
                         }
                         acc[category].push(resource);
                         return acc;
                       }, {});

                       const categories = Object.keys(resourcesByCategory).sort();

                       if (categories.length === 0) {
                         return (
                           <div style={{ 
                             textAlign: "center", 
                             padding: "2rem", 
                             color: COLORS.textGray,
                             fontSize: 14
                           }}>
                             No resources available yet.
                           </div>
                         );
                       }

                       return (
                         <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                           {categories.map((category) => (
                             <div key={category} style={{ 
                               background: COLORS.white, 
                               borderRadius: 8, 
                               padding: "1rem",
                               border: `1px solid ${COLORS.borderGray}`
                             }}>
                               <div style={{ 
                                 fontWeight: 600, 
                                 color: COLORS.darkBlue, 
                                 fontSize: 14, 
                                 marginBottom: "0.5rem",
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 8
                               }}>
                                 <span>📁</span>
                                 <span>{category}</span>
                                 <span style={{ 
                                   background: COLORS.teal, 
                                   color: COLORS.white, 
                                   borderRadius: 8, 
                                   padding: "2px 6px", 
                                   fontSize: 11, 
                                   fontWeight: 600 
                                 }}>
                                   {resourcesByCategory[category].length}
                                 </span>
                               </div>
                               <div style={{ display: "grid", gap: 6 }}>
                                 {resourcesByCategory[category].map((resource: any) => (
                                   <div key={resource.id} style={{ 
                                     background: COLORS.lightGray, 
                                     borderRadius: 6, 
                                     padding: 8,
                                     border: `1px solid ${COLORS.borderGray}`,
                                     cursor: "pointer",
                                     transition: "all 0.2s"
                                   }}
                                   onMouseEnter={(e) => {
                                     e.currentTarget.style.transform = "translateY(-1px)";
                                     e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                                   }}
                                   onMouseLeave={(e) => {
                                     e.currentTarget.style.transform = "translateY(0)";
                                     e.currentTarget.style.boxShadow = "none";
                                   }}
                                   >
                                     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                       <div style={{ fontSize: 16 }}>{getResourceIcon(resource.type)}</div>
                                       <div style={{ flex: 1, minWidth: 0 }}>
                                         <div style={{ fontWeight: 600, color: COLORS.darkBlue, fontSize: 13, marginBottom: 2 }}>{resource.title}</div>
                                         <div style={{ fontSize: 11, color: COLORS.textGray, marginBottom: 2 }}>{resource.description}</div>
                                         <div style={{ fontSize: 10, color: COLORS.textGray }}>Added: {formatDate(resource.created_at)}</div>
                                       </div>
                                       <div style={{ display: "flex", gap: 4 }}>
                                         {resource.type === 'file' ? (
                                           <button
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               window.open(`/api/resources/${resource.id}/download`, '_blank');
                                             }}
                                             style={{
                                               background: COLORS.teal,
                                               color: COLORS.white,
                                               border: "none",
                                               borderRadius: 4,
                                               padding: "4px 8px",
                                               fontWeight: 600,
                                               cursor: "pointer",
                                               fontSize: 11,
                                               transition: "all 0.2s"
                                             }}
                                             onMouseEnter={(e) => {
                                               e.currentTarget.style.background = COLORS.darkBlue;
                                             }}
                                             onMouseLeave={(e) => {
                                               e.currentTarget.style.background = COLORS.teal;
                                             }}
                                           >
                                             Download
                                           </button>
                                         ) : resource.url ? (
                                           <a 
                                             href={resource.url} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             onClick={(e) => e.stopPropagation()}
                                             style={{
                                               background: COLORS.teal,
                                               color: COLORS.white,
                                               border: "none",
                                               borderRadius: 4,
                                               padding: "4px 8px",
                                               fontWeight: 600,
                                               cursor: "pointer",
                                               fontSize: 11,
                                               textDecoration: "none",
                                               transition: "all 0.2s"
                                             }}
                                             onMouseEnter={(e) => {
                                               e.currentTarget.style.background = COLORS.darkBlue;
                                             }}
                                             onMouseLeave={(e) => {
                                               e.currentTarget.style.background = COLORS.teal;
                                             }}
                                           >
                                             Open Link
                                           </a>
                                         ) : null}
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           ))}
                         </div>
                       );
                     })()}
                   </div>
                 )}
               </div>
             </div>
          </div>
                 )}

         {/* Resource Form Popup */}
         {showAddResource && (
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
             zIndex: 1000
           }}>
             <div style={{
               background: COLORS.white,
               borderRadius: 16,
               padding: 32,
               maxWidth: 600,
               width: "90%",
               maxHeight: "90vh",
               overflow: "auto",
               boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
             }}>
               <div style={{
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "space-between",
                 marginBottom: 24,
                 padding: "12px 16px",
                 background: COLORS.teal,
                 borderRadius: 12,
                 color: COLORS.white
               }}>
                 <div style={{ fontWeight: 700, fontSize: 18 }}>
                   {editingResource ? 'Edit Resource' : 'Add New Resource'}
                 </div>
                 <button
                   onClick={() => {
                     setShowAddResource(false);
                     setEditingResource(null);
                   }}
                   style={{
                     background: "none",
                     border: "none",
                     color: COLORS.white,
                     fontSize: 24,
                     cursor: "pointer",
                     padding: 0,
                     width: 32,
                     height: 32,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center"
                   }}
                 >
                   ×
                 </button>
               </div>

               <ResourceForm
                 resource={editingResource}
                 onSubmit={async (resourceData) => {
                   try {
                     if (editingResource) {
                       // Update existing resource
                       const response = await fetch(`/api/resources/${editingResource.id}`, {
                         method: 'PUT',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(resourceData)
                       });
                       if (!response.ok) throw new Error('Failed to update resource');
                     } else {
                       // Create new resource
                       const response = await fetch('/api/resources', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify(resourceData)
                       });
                       if (!response.ok) throw new Error('Failed to create resource');
                     }
                     
                     // Refresh resources
                     const updatedResources = await fetchResources();
                     setResources(updatedResources);
                     setShowAddResource(false);
                     setEditingResource(null);
                   } catch (error) {
                     console.error('Error saving resource:', error);
                     alert('Failed to save resource. Please try again.');
                   }
                 }}
                 onCancel={() => {
                   setShowAddResource(false);
                   setEditingResource(null);
                 }}
                 employees={newHires}
               />
             </div>
           </div>
         )}

         {/* Add Feedback Modal */}
         {showAddFeedback && (
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
               maxWidth: 600,
               width: "100%",
               maxHeight: "90vh",
               overflow: "auto",
               boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
             }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                 <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
                   Add Feedback
                 </h2>
                 <button
                   onClick={() => setShowAddFeedback(false)}
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

               <form onSubmit={(e) => { e.preventDefault(); handleAddFeedback(); }}>
                 <div style={{ marginBottom: "1.5rem" }}>
                   <label style={{ display: "block", fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.5rem" }}>
                     Feedback Type
                   </label>
                   <select
                     value={newFeedback.feedbackType}
                     onChange={(e) => setNewFeedback({ ...newFeedback, feedbackType: e.target.value as any })}
                     style={{
                       width: "100%",
                       padding: "12px",
                       borderRadius: 8,
                       border: `1px solid ${COLORS.borderGray}`,
                       fontSize: 16,
                       background: COLORS.white,
                       color: COLORS.darkBlue
                     }}
                   >
                     <option value="general">General Feedback</option>
                     <option value="milestone">Milestone Feedback</option>
                     <option value="task">Task Feedback</option>
                     <option value="self_assessment">Self Assessment</option>
                   </select>
                 </div>

                 <div style={{ marginBottom: "1.5rem" }}>
                   <label style={{ display: "block", fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.5rem" }}>
                     Rating (Optional)
                   </label>
                   <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                     {[1, 2, 3, 4, 5].map((star) => (
                       <button
                         key={star}
                         type="button"
                         onClick={() => setNewFeedback({ ...newFeedback, rating: star })}
                         style={{
                           background: "none",
                           border: "none",
                           fontSize: 24,
                           cursor: "pointer",
                           color: newFeedback.rating >= star ? COLORS.yellow : COLORS.borderGray,
                           transition: "color 0.2s"
                         }}
                       >
                         ⭐
                       </button>
                     ))}
                     {newFeedback.rating > 0 && (
                       <span style={{ 
                         marginLeft: 12, 
                         fontSize: 16, 
                         fontWeight: 600, 
                         color: COLORS.darkBlue,
                         background: COLORS.lightGray,
                         padding: "4px 8px",
                         borderRadius: 6
                       }}>
                         {newFeedback.rating}/5 stars
                       </span>
                     )}
                   </div>
                 </div>

                 <div style={{ marginBottom: "1.5rem" }}>
                   <label style={{ display: "block", fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.5rem" }}>
                     Feedback
                   </label>
                                     <textarea
                    value={newFeedback.feedbackText}
                    onChange={(e) => setNewFeedback({ ...newFeedback, feedbackText: e.target.value })}
                    placeholder="Share your thoughts about the onboarding experience..."
                    style={{
                      width: "100%",
                      minHeight: 120,
                      padding: "12px",
                      borderRadius: 8,
                      border: `1px solid ${COLORS.borderGray}`,
                      fontSize: 16,
                      fontFamily: "inherit",
                      resize: "vertical",
                      background: COLORS.white,
                      color: COLORS.darkBlue
                    }}
                    required
                  />
                 </div>

                 <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                   <button
                     type="button"
                     onClick={() => setShowAddFeedback(false)}
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
                     type="submit"
                     style={{
                       background: COLORS.teal,
                       color: COLORS.white,
                       border: "none",
                       borderRadius: 8,
                       padding: "12px 24px",
                       fontWeight: 600,
                       fontSize: 16,
                       cursor: "pointer",
                       transition: "all 0.2s"
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.background = COLORS.darkBlue;
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.background = COLORS.teal;
                     }}
                   >
                     Add Feedback
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

         {/* Edit Feedback Modal */}
         {editingFeedback && (
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
               maxWidth: 600,
               width: "100%",
               maxHeight: "90vh",
               overflow: "auto",
               boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
             }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                 <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
                   Edit Feedback
                 </h2>
                 <button
                   onClick={() => {
                     setEditingFeedback(null);
                     setEditingFeedbackText('');
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

               <form onSubmit={(e) => { e.preventDefault(); handleEditFeedback(); }}>
                 <div style={{ marginBottom: "1.5rem" }}>
                   <label style={{ display: "block", fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.5rem" }}>
                     Feedback
                   </label>
                   <textarea
                     value={editingFeedbackText}
                     onChange={(e) => setEditingFeedbackText(e.target.value)}
                     placeholder="Share your thoughts about the onboarding experience..."
                     style={{
                       width: "100%",
                       minHeight: 120,
                       padding: "12px",
                       borderRadius: 8,
                       border: `1px solid ${COLORS.borderGray}`,
                       fontSize: 16,
                       fontFamily: "inherit",
                       resize: "vertical",
                       background: COLORS.white,
                       color: COLORS.darkBlue
                     }}
                     required
                   />
                 </div>

                 <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                   <button
                     type="button"
                     onClick={() => {
                       setEditingFeedback(null);
                       setEditingFeedbackText('');
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
                     type="submit"
                     style={{
                       background: COLORS.teal,
                       color: COLORS.white,
                       border: "none",
                       borderRadius: 8,
                       padding: "12px 24px",
                       fontWeight: 600,
                       fontSize: 16,
                       cursor: "pointer",
                       transition: "all 0.2s"
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.background = COLORS.darkBlue;
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.background = COLORS.teal;
                     }}
                   >
                     Update Feedback
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}


        </main>

        {/* Test Modal */}
        {showTestModal && selectedTest && (
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
              maxWidth: 800,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
                  {selectedTest.name}
                </h2>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setSelectedTest(null);
                    setCurrentTestAnswers({});
                    setTestProgress(0);
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

              <div style={{ marginBottom: "1rem", padding: "1rem", background: COLORS.lightGray, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.5rem" }}>
                  {selectedTest.description}
                </div>
                <div style={{ fontSize: 14, color: COLORS.textGray }}>
                  Duration: {selectedTest.duration_minutes} minutes
                </div>
              </div>

              {/* Test Questions */}
              <div style={{ marginBottom: "2rem" }}>
                {selectedTest.questions?.questions?.map((question: any, qIdx: number) => (
                  <div key={qIdx} style={{ marginBottom: "2rem" }}>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: 16, 
                      color: COLORS.darkBlue, 
                      marginBottom: "1rem" 
                    }}>
                      Question {qIdx + 1}: {question.question}
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {question.options?.map((option: any, oIdx: number) => (
                        <label key={oIdx} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem",
                          border: `1px solid ${COLORS.borderGray}`,
                          borderRadius: 8,
                          cursor: "pointer",
                          background: currentTestAnswers[question.id] === option.value ? COLORS.lightGray : COLORS.white,
                          transition: "all 0.2s"
                        }}>
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option.value}
                            checked={currentTestAnswers[question.id] === option.value}
                            onChange={() => handleTestAnswer(question.id, option.value)}
                            style={{ margin: 0 }}
                          />
                          <span style={{ fontSize: 14, color: COLORS.darkBlue }}>
                            {option.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setSelectedTest(null);
                    setCurrentTestAnswers({});
                    setTestProgress(0);
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
                  onClick={submitTest}
                  disabled={Object.keys(currentTestAnswers).length === 0}
                  style={{
                    background: Object.keys(currentTestAnswers).length === 0 ? COLORS.gray : COLORS.teal,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 24px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: Object.keys(currentTestAnswers).length === 0 ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Submit Test
                </button>
              </div>
            </div>
                  </div>
      )}

      {/* Edit Goal Modal */}
      {showEditGoal && editingGoal && (
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
                Edit Career Goal
              </h2>
              <button
                onClick={() => { setShowEditGoal(false); setEditingGoal(null); }}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                  Goal Title *
                </label>
                                  <input
                    type="text"
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal((prev: any) => ({ ...prev, title: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                    Description *
                  </label>
                  <textarea
                    value={editingGoal.description}
                    onChange={(e) => setEditingGoal((prev: any) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue,
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                      Timeframe
                    </label>
                    <select
                      value={editingGoal.timeframe}
                      onChange={(e) => setEditingGoal((prev: any) => ({ ...prev, timeframe: e.target.value as any }))}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${COLORS.borderGray}`,
                        borderRadius: 8,
                        fontSize: 16,
                        color: COLORS.darkBlue
                      }}
                    >
                      <option value="short-term">Short-term (0-6 months)</option>
                      <option value="medium-term">Medium-term (6-18 months)</option>
                      <option value="long-term">Long-term (18+ months)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                      Priority
                    </label>
                    <select
                      value={editingGoal.priority}
                      onChange={(e) => setEditingGoal((prev: any) => ({ ...prev, priority: e.target.value as any }))}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${COLORS.borderGray}`,
                        borderRadius: 8,
                        fontSize: 16,
                        color: COLORS.darkBlue
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                      Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingGoal.progress}
                      onChange={(e) => setEditingGoal((prev: any) => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${COLORS.borderGray}`,
                        borderRadius: 8,
                        fontSize: 16,
                        color: COLORS.darkBlue
                      }}
                    />
                  </div>
                </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={() => { setShowEditGoal(false); setEditingGoal(null); }}
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
                  onClick={handleEditGoal}
                  disabled={!editingGoal.title.trim() || !editingGoal.description.trim()}
                  style={{
                    background: (!editingGoal.title.trim() || !editingGoal.description.trim()) ? COLORS.gray : COLORS.yellow,
                    color: (!editingGoal.title.trim() || !editingGoal.description.trim()) ? COLORS.textGray : COLORS.darkBlue,
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 24px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: (!editingGoal.title.trim() || !editingGoal.description.trim()) ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Skill Modal */}
      {showEditSkill && editingSkill && (
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
                Edit Skill
              </h2>
              <button
                onClick={() => { setShowEditSkill(false); setEditingSkill(null); }}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                  Skill Name *
                </label>
                                  <input
                    type="text"
                    value={editingSkill.name}
                    onChange={(e) => setEditingSkill((prev: any) => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                    Description *
                  </label>
                  <textarea
                    value={editingSkill.description}
                    onChange={(e) => setEditingSkill((prev: any) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue,
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                      Priority
                    </label>
                    <select
                      value={editingSkill.priority}
                      onChange={(e) => setEditingSkill((prev: any) => ({ ...prev, priority: e.target.value as any }))}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${COLORS.borderGray}`,
                        borderRadius: 8,
                        fontSize: 16,
                        color: COLORS.darkBlue
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                      Status
                    </label>
                    <select
                      value={editingSkill.status}
                      onChange={(e) => setEditingSkill((prev: any) => ({ ...prev, status: e.target.value as any }))}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${COLORS.borderGray}`,
                        borderRadius: 8,
                        fontSize: 16,
                        color: COLORS.darkBlue
                      }}
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                      Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingSkill.progress}
                      onChange={(e) => setEditingSkill((prev: any) => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${COLORS.borderGray}`,
                        borderRadius: 8,
                        fontSize: 16,
                        color: COLORS.darkBlue
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={editingSkill.targetDate}
                    onChange={(e) => setEditingSkill((prev: any) => ({ ...prev, targetDate: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue
                    }}
                  />
                </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={() => { setShowEditSkill(false); setEditingSkill(null); }}
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
                  onClick={handleEditSkill}
                  disabled={!editingSkill.name.trim() || !editingSkill.description.trim()}
                  style={{
                    background: (!editingSkill.name.trim() || !editingSkill.description.trim()) ? COLORS.gray : COLORS.orange,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 24px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: (!editingSkill.name.trim() || !editingSkill.description.trim()) ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
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
                Add Career Goal
              </h2>
              <button
                onClick={() => setShowAddGoal(false)}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 8,
                    fontSize: 16,
                    color: COLORS.darkBlue
                  }}
                  placeholder="e.g., Improve public speaking skills"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                  Description *
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 8,
                    fontSize: 16,
                    color: COLORS.darkBlue,
                    resize: "vertical"
                  }}
                  placeholder="Describe your goal and what you want to achieve..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                    Timeframe
                  </label>
                  <select
                    value={newGoal.timeframe}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, timeframe: e.target.value as any }))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue
                    }}
                  >
                    <option value="short-term">Short-term (0-6 months)</option>
                    <option value="medium-term">Medium-term (6-18 months)</option>
                    <option value="long-term">Long-term (18+ months)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                    Priority
                  </label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as any }))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={() => setShowAddGoal(false)}
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
                  onClick={handleAddGoal}
                  disabled={!newGoal.title.trim() || !newGoal.description.trim()}
                  style={{
                    background: (!newGoal.title.trim() || !newGoal.description.trim()) ? COLORS.gray : COLORS.yellow,
                    color: (!newGoal.title.trim() || !newGoal.description.trim()) ? COLORS.textGray : COLORS.darkBlue,
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 24px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: (!newGoal.title.trim() || !newGoal.description.trim()) ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkill && (
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
                Add Skill to Develop
              </h2>
              <button
                onClick={() => setShowAddSkill(false)}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                  Skill Name *
                </label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 8,
                    fontSize: 16,
                    color: COLORS.darkBlue
                  }}
                  placeholder="e.g., Project Management"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                  Description *
                </label>
                <textarea
                  value={newSkill.description}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 8,
                    fontSize: 16,
                    color: COLORS.darkBlue,
                    resize: "vertical"
                  }}
                  placeholder="Describe what you want to learn and why..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                    Priority
                  </label>
                  <select
                    value={newSkill.priority}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, priority: e.target.value as any }))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newSkill.targetDate}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, targetDate: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `1px solid ${COLORS.borderGray}`,
                      borderRadius: 8,
                      fontSize: 16,
                      color: COLORS.darkBlue
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={() => setShowAddSkill(false)}
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
                  onClick={handleAddSkill}
                  disabled={!newSkill.name.trim() || !newSkill.description.trim()}
                  style={{
                    background: (!newSkill.name.trim() || !newSkill.description.trim()) ? COLORS.gray : COLORS.orange,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 24px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: (!newSkill.name.trim() || !newSkill.description.trim()) ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Add Skill
                </button>
              </div>
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
     category: resource?.category || 'Personal Resources',
     accessible_to: resource?.accessible_to || 'all',
     accessible_employees: resource?.accessible_employees || []
   });

   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [showCustomCategory, setShowCustomCategory] = useState(false);
   const [customCategory, setCustomCategory] = useState('');

   // Standard categories (same as manager portal, sorted alphabetically)
   const standardCategories = [
     'Company Policies',
     'Company Resources',
     'HR Resources',
     'IT Resources',
     'Other',
     'Personal Resources',
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
       created_by: 'Employee' // This would come from the current user
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
             padding: "12px",
             border: `1px solid ${COLORS.borderGray}`,
             borderRadius: 8,
             fontSize: 14,
             color: COLORS.darkBlue
           }}
           placeholder="Enter resource title"
         />
       </div>

       <div>
         <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
           Description
         </label>
         <textarea
           value={formData.description}
           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
           style={{
             width: "100%",
             padding: "12px",
             border: `1px solid ${COLORS.borderGray}`,
             borderRadius: 8,
             fontSize: 14,
             color: COLORS.darkBlue,
             minHeight: 80,
             resize: "vertical"
           }}
           placeholder="Enter resource description"
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
             padding: "12px",
             border: `1px solid ${COLORS.borderGray}`,
             borderRadius: 8,
             fontSize: 14,
             color: COLORS.darkBlue
           }}
         >
           <option value="link">Link</option>
           <option value="file">File</option>
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
               padding: "12px",
               border: `1px solid ${COLORS.borderGray}`,
               borderRadius: 8,
               fontSize: 14,
               color: COLORS.darkBlue
             }}
             placeholder="https://example.com"
           />
         </div>
       )}

       {formData.type === 'file' && (
         <div>
           <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
             File *
           </label>
           <input
             type="file"
             onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
             required
             style={{
               width: "100%",
               padding: "12px",
               border: `1px solid ${COLORS.borderGray}`,
               borderRadius: 8,
               fontSize: 14,
               color: COLORS.darkBlue
             }}
           />
         </div>
       )}

       <div>
         <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
           Category
         </label>
         <select
           value={formData.category}
           onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
           style={{
             width: "100%",
             padding: "12px",
             border: `1px solid ${COLORS.borderGray}`,
             borderRadius: 8,
             fontSize: 14,
             color: COLORS.darkBlue
           }}
         >
           {standardCategories.map(category => (
             <option key={category} value={category}>{category}</option>
           ))}
         </select>
       </div>

       <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
         <button
           type="button"
           onClick={onCancel}
           style={{
             padding: "12px 24px",
             border: `1px solid ${COLORS.borderGray}`,
             borderRadius: 8,
             background: COLORS.white,
             color: COLORS.darkBlue,
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
             padding: "12px 24px",
             border: "none",
             borderRadius: 8,
             background: COLORS.teal,
             color: COLORS.white,
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