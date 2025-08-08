"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { fetchManagers, fetchNewHires, fetchBuddies, fetchOnboardingPlan, fetchResources, createResource, updateResource, deleteResource, getTaskCommentCount, type Manager, type NewHire, type Buddy, type Resource, calculateScheduledProgress, calculateActualProgress, calculateActualProgressFromTasks, getCurrentMilestoneFromTasks, calculateWorkingDaysUntilStart, calculateScheduledProgressForFuture, calculateTaskDueDate, formatDueDate, getStatusColor, formatDate, getInitials, fetchOnboardingFeedback, addOnboardingFeedback, updateOnboardingFeedback, deleteOnboardingFeedback, type OnboardingFeedback, getGrowthTests, getGrowthInsights } from "@/lib/api";

// Color palette and constants
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

const GRADIENT_BG = "linear-gradient(135deg, #2A9D8F 0%, #264653 100%)";

export default function NewHireOnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const newHireId = params.id;

  const [managers, setManagers] = useState<Manager[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState("Overview");
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set());
  const [resources, setResources] = useState<Resource[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<{ [taskId: string]: number }>({});
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


  const currentManager = managers.find(manager => manager.email === user?.primaryEmailAddress?.emailAddress);
  const currentNewHire = newHires.find(hire => hire.id.toString() === newHireId?.toString());
  const currentBuddy = buddies.find(buddy => buddy.id === currentNewHire?.buddy_id);

  // Function to fetch comment counts for all tasks
  const fetchCommentCounts = async (plan: any, newHireId: number) => {
    if (!plan || !plan.plan_data || !plan.plan_data.milestones) return;
    
    const commentCounts: { [taskId: string]: number } = {};
    
    for (const milestone of plan.plan_data.milestones) {
      if (milestone.tasks) {
        for (const task of milestone.tasks) {
          const taskId = task.id || task.name;
          const count = await getTaskCommentCount(taskId, newHireId);
          commentCounts[taskId] = count;
        }
      }
    }
    
    return commentCounts;
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

  // Debug logging
  console.log('Debug Info:', {
    newHireId,
    newHireIdType: typeof newHireId,
    newHires: newHires.map(h => ({ id: h.id, name: h.name })),
    currentNewHire: currentNewHire ? { id: currentNewHire.id, name: currentNewHire.name } : null,
    onboardingPlan: onboardingPlan ? 'Loaded' : 'Not loaded',
    onboardingPlanStructure: onboardingPlan ? {
      hasPlanData: !!onboardingPlan.plan_data,
      hasMilestones: !!onboardingPlan.plan_data?.milestones,
      milestonesCount: onboardingPlan.plan_data?.milestones?.length || 0,
      firstMilestone: onboardingPlan.plan_data?.milestones?.[0] || null,
      planDataKeys: onboardingPlan.plan_data ? Object.keys(onboardingPlan.plan_data) : [],
      firstMilestoneTasks: onboardingPlan.plan_data?.milestones?.[0]?.tasks?.length || 0
    } : null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [managersData, newHiresData, buddiesData] = await Promise.all([
          fetchManagers(),
          fetchNewHires(),
          fetchBuddies()
        ]);
        setManagers(managersData);
        setNewHires(newHiresData);
        setBuddies(buddiesData);
        
        // Fetch onboarding plan if we have a valid new hire
        const currentNewHire = newHiresData.find(hire => hire.id.toString() === newHireId?.toString());
        if (currentNewHire) {
          const [plan, resourcesData, feedbackData] = await Promise.all([
            fetchOnboardingPlan(currentNewHire.id),
            fetchResources(),
            fetchOnboardingFeedback(currentNewHire.id)
          ]);
          setOnboardingPlan(plan);
          
          // Fetch all resources for manager view (not filtered for employee)
console.log('Fetching all resources for manager view');
console.log('Fetched resources:', resourcesData);
          setResources(resourcesData);
          setFeedback(feedbackData);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded, newHireId]);

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

  // Fetch growth data when currentNewHire changes
  useEffect(() => {
    if (currentNewHire) {
      fetchGrowthData();
    }
  }, [currentNewHire]);

  // Fetch growth data when Growth tab is active
  useEffect(() => {
    if (activeTab === "Growth" && currentNewHire) {
      fetchGrowthData();
    }
  }, [activeTab, currentNewHire]);

  if (!isLoaded || loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: GRADIENT_BG, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: COLORS.white,
        fontSize: 18
      }}>
        Loading onboarding plan...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: GRADIENT_BG, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: COLORS.white,
        fontSize: 18
      }}>
        Please sign in to view this page.
      </div>
    );
  }

  if (!currentManager) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: GRADIENT_BG, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: COLORS.white,
        fontSize: 18
      }}>
        Access denied. Manager access required.
      </div>
    );
  }

  if (!currentNewHire) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: GRADIENT_BG, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: COLORS.white,
        fontSize: 18,
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div>New hire not found.</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          ID: {newHireId} | Available IDs: {newHires.map(h => h.id).join(', ')}
        </div>
        <button 
          onClick={() => router.push("/app/dashboard/manager")}
          style={{
            background: COLORS.white,
            color: COLORS.darkBlue,
            border: "none",
padding: "12px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            marginTop: "1rem"
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Check if this new hire belongs to the current manager
  if (currentNewHire.manager_id !== currentManager.id) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: GRADIENT_BG, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: COLORS.white,
        fontSize: 18
      }}>
        Access denied. You can only view your team members.
      </div>
    );
  }

  const getStatusDisplay = () => {
    // If start date is in the future, show NOT STARTED
    if (new Date(currentNewHire.start_date) > new Date()) {
      return { text: 'NOT STARTED', color: COLORS.darkGray };
    }
    
    // Calculate actual progress based on completed tasks
    const actual = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : calculateActualProgress(currentNewHire.current_milestone, currentNewHire.calculated_status);
    const scheduled = calculateScheduledProgress(currentNewHire.workdays_since_start);
    if (actual < scheduled) return { text: 'OVERDUE', color: COLORS.red };
    if (actual === scheduled) return { text: 'IN SCHEDULE', color: COLORS.teal };
    return { text: 'AHEAD OF SCHEDULE', color: COLORS.yellow };
  };

  const statusDisplay = getStatusDisplay();

  // Handler functions for task actions
  const handleViewDetails = (task: any) => {
    router.push(`/app/dashboard/team/${newHireId}/task/${task.id || task.name}`);
  };

  const handleUpdateStatus = async (task: any, newStatus: string) => {
    try {
// Find the milestone that contains this task
      let milestoneId = null;
      if (onboardingPlan?.plan_data?.milestones) {
        for (const milestone of onboardingPlan.plan_data.milestones) {
          if (milestone.tasks?.some((t: any) => t.id === task.id || t.name === task.name)) {
            milestoneId = milestone.id;
            break;
          }
        }
      }

      if (!milestoneId) {
        console.error('Could not find milestone for task');
        return;
      }

      const response = await fetch('/api/onboarding-plans', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newHireId: currentNewHire.id,
milestoneId: milestoneId,
          taskId: task.id || task.name,
          status: newStatus
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedPlan = { ...onboardingPlan };
        if (updatedPlan.plan_data && updatedPlan.plan_data.milestones) {
          const milestone = updatedPlan.plan_data.milestones.find((m: any) => m.id === milestoneId);
          if (milestone && milestone.tasks) {
            const taskToUpdate = milestone.tasks.find((t: any) => t.id === task.id || t.name === task.name);
            if (taskToUpdate) {
              taskToUpdate.status = newStatus;
            }
          }
        }
        setOnboardingPlan(updatedPlan);

        // Update current milestone based on task completion
        const newCurrentMilestone = getCurrentMilestoneFromTasks(updatedPlan);
        if (newCurrentMilestone !== currentNewHire.current_milestone) {
          // Update the current milestone in the database
          const milestoneResponse = await fetch('/api/new-hires', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: currentNewHire.id,
              current_milestone: newCurrentMilestone
            }),
          });

          if (milestoneResponse.ok) {
            // Update local state
            setNewHires(prev => prev.map(hire => 
              hire.id === currentNewHire.id 
                ? { ...hire, current_milestone: newCurrentMilestone }
                : hire
            ));
          }
        }
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

// Management action functions
  const scheduleOneOnOne = () => {
    const managerEmail = currentManager?.email;
    const newHireEmail = currentNewHire.email;
    
    if (!managerEmail || !newHireEmail) {
      alert('Email addresses not available for scheduling');
      return;
    }

    // Create calendar invite details
    const subject = `1:1 Meeting - ${currentNewHire.name} & ${currentManager?.name}`;
    const description = `Onboarding 1:1 Meeting

Hi ${currentNewHire.name},

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

  const updateStartDate = () => {
    const newStartDate = prompt(`Enter new start date for ${currentNewHire.name} (YYYY-MM-DD):`, currentNewHire.start_date);
    if (!newStartDate) return;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newStartDate)) {
      alert('Please enter a valid date in YYYY-MM-DD format');
      return;
    }
    
    // Update the start date
    fetch('/api/new-hires', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: currentNewHire.id,
        start_date: newStartDate
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(`✅ Start date updated successfully! The onboarding plan will be regenerated automatically.`);
        window.location.reload(); // Refresh to show updated plan
      } else {
        alert(`❌ Failed to update start date: ${data.error}`);
      }
    })
    .catch(error => {
      console.error('Error updating start date:', error);
      alert('❌ Failed to update start date. Please try again.');
    });
  };

  const markAsComplete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${currentNewHire.name}'s onboarding as complete? This will update their status to 'completed'.`
    );
    
    if (!confirmed) return;
    
    fetch('/api/new-hires', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: currentNewHire.id,
        action: 'mark_complete'
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(`✅ ${currentNewHire.name}'s onboarding has been marked as complete!`);
        window.location.reload(); // Refresh to show updated status
      } else {
        alert(`❌ Failed to mark as complete: ${data.error}`);
      }
    })
    .catch(error => {
      console.error('Error marking as complete:', error);
      alert('❌ Failed to mark as complete. Please try again.');
    });
  };

  const deleteTeamMember = () => {
    if (confirm('Are you sure you want to delete this team member? This action cannot be undone.')) {
      // Implementation for deleting team member
      console.log('Delete team member:', currentNewHire?.id);
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

  // Feedback handling functions
  const handleAddFeedback = async () => {
    if (!currentNewHire || !newFeedback.feedbackText.trim()) return;

    const feedbackData = await addOnboardingFeedback(
      currentNewHire.id,
      user?.id || '',
      currentManager?.name || 'Manager',
      'manager',
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



  return (
    <div style={{ minHeight: "100vh", background: GRADIENT_BG }}>
      {/* Navigation */}
      <nav style={{ 
        background: COLORS.white, 
        padding: "1rem 2rem", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
justifyContent: "space-between",
alignItems: "center"
}}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => {
              // Get the return URL from query parameters, default to manager dashboard
              const urlParams = new URLSearchParams(window.location.search);
              const returnUrl = urlParams.get('returnUrl') || '/app/dashboard/manager';
              router.push(returnUrl);
            }}
              style={{
                background: "none",
              border: "none",
fontSize: 16,
                color: COLORS.teal,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              ← Back to Dashboard
            </button>
<div style={{ fontSize: 24, color: COLORS.darkBlue }}>|</div>
          <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 18 }}>
            {currentNewHire.name}'s Onboarding Plan
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ 
            width: 40, 
            height: 40, 
            borderRadius: "50%", 
            background: COLORS.teal, 
            color: COLORS.white, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontWeight: 700, 
            fontSize: 16 
          }}>
            {currentManager?.name?.charAt(0) || 'M'}
          </span>
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
        </nav>

<main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        {/* Compact Header Section */}
        <div style={{ 
          background: COLORS.white, 
          borderRadius: 12, 
          padding: "1rem", 
          marginBottom: "1.5rem",
          boxShadow: "0 2px 8px rgba(38,70,83,0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              background: statusDisplay.color, 
              color: COLORS.white, 
              display: "flex", 
alignItems: "center", 
              justifyContent: "center", 
              fontWeight: 700, 
              fontSize: 18 
            }}>
              {getInitials(currentNewHire.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
fontSize: 20, 
fontWeight: 700, 
                color: COLORS.darkBlue, 
marginBottom: 4 
}}>
                {currentNewHire.name}
              </h1>
              <div style={{ 
                fontSize: 14, 
                color: COLORS.darkBlue, 
                opacity: 0.7, 
                marginBottom: 4 
              }}>
                {currentNewHire.role || 'Role not set'}
              </div>
              <div style={{ 
fontSize: 12, 
                color: COLORS.darkBlue, 
opacity: 0.7 
}}>
                Start Date: {formatDate(currentNewHire.start_date)} • {
                  new Date(currentNewHire.start_date) > new Date() 
                    ? `${calculateWorkingDaysUntilStart(currentNewHire.start_date)} days until start date`
                    : `${currentNewHire.workdays_since_start} days since joining`
}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ 
                background: statusDisplay.color, 
                color: COLORS.white, 
                padding: "4px 12px", 
                borderRadius: 16, 
                fontSize: 11, 
                  fontWeight: 600, 
                textTransform: "uppercase",
                marginBottom: 4
              }}>
                {statusDisplay.text}
              </div>
              <div style={{ fontSize: 11, color: COLORS.darkBlue, opacity: 0.7 }}>
                Buddy: {currentBuddy ? `${currentBuddy.name} ${currentBuddy["surname (s)"] || ''}`.trim() : 'Not assigned'}
              </div>
            </div>
          </div>
          
          {/* Compact Progress Section */}
                      <div style={{ 
              background: COLORS.gray, 
            borderRadius: 10, 
            padding: "1rem", 
            marginBottom: "1rem" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue }}>Onboarding Progress</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7 }}>Scheduled Progress:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.darkBlue, marginLeft: "1rem" }}>
                  {new Date(currentNewHire.start_date) > new Date() 
                    ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                    : calculateScheduledProgress(currentNewHire.workdays_since_start)
                  }/5
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7 }}>Actual Progress:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: statusDisplay.color, marginLeft: "1rem" }}>
                  {onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : calculateActualProgress(currentNewHire.current_milestone, currentNewHire.calculated_status)}/5
                </span>
              </div>
            </div>
            
            {/* Compact Progress Bar */}
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
                  const scheduledProgress = new Date(currentNewHire.start_date) > new Date() 
                    ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                    : calculateScheduledProgress(currentNewHire.workdays_since_start);
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
                  const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : calculateActualProgress(currentNewHire.current_milestone, currentNewHire.calculated_status);
                  const progressPercentage = (actualProgress / 5) * 100;

                    // Ensure even 1/5 progress (20%) is clearly visible
                    // For 1/5 = 20%, we want it to be clearly visible, not just 4px
                    const minVisibleWidth = Math.max(20, progressPercentage); // At least 20% width for visibility
                    
                    return minVisibleWidth;
                })()}%`, 
                height: 12, 
                background: (() => {
                  const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : calculateActualProgress(currentNewHire.current_milestone, currentNewHire.calculated_status);
                  const scheduledProgress = new Date(currentNewHire.start_date) > new Date() 
                    ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                    : calculateScheduledProgress(currentNewHire.workdays_since_start);
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
            
            {/* Compact Milestone labels - 5 labels for Day 1, Week 1, Day 30, Day 60, Day 90 */}
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

        {/* Management Actions Section */}
            <div style={{ 
              background: COLORS.white, 
          borderRadius: 12, 
              padding: "1.5rem", 
          marginBottom: "1.5rem", 
boxShadow: "0 2px 8px rgba(38,70,83,0.06)",
          border: `1px solid ${COLORS.borderGray}`
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: 16,
            padding: "8px 12px",
            background: COLORS.darkBlue,
              borderRadius: 8,
              color: COLORS.white
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Management Actions</div>
              </div>
            </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <button 
              onClick={scheduleOneOnOne}
              style={{
                background: COLORS.teal,
                color: COLORS.white,
                border: "none",
                padding: "12px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(42,157,143,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              Schedule 1:1 Meeting
            </button>
            
            <button 
              onClick={updateStartDate}
              style={{
                background: COLORS.teal,
                color: COLORS.white,
                border: "none",
                padding: "12px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(42,157,143,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              Update Start Date
            </button>
            
            <button 
              onClick={markAsComplete}
              style={{
                background: COLORS.teal,
                color: COLORS.white,
                border: "none",
                padding: "12px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(42,157,143,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              Mark Onboarding Complete
            </button>
            
            <button 
              onClick={deleteTeamMember}
              style={{
                background: COLORS.teal,
                color: COLORS.white,
                border: "none",
                padding: "12px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(42,157,143,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              Delete Team Member
            </button>
        </div>
      </div>

      {/* Progress Overview Section */}
              {/* Tabs */}
        <div style={{ 
          background: COLORS.white, 
          borderRadius: 16, 
          padding: "2rem",
          boxShadow: "0 4px 16px rgba(38,70,83,0.08)"
        }}>
          <div style={{ 
            display: "flex", 
            gap: "1rem", 
            marginBottom: "2rem",
          borderBottom: `2px solid ${COLORS.gray}`,
            paddingBottom: "1rem"
          }}>
                            {["Overview", "Plan", "Feedback", "Useful Resources", "Growth"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? COLORS.teal : "transparent",
                  color: activeTab === tab ? COLORS.white : COLORS.darkBlue,
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s"
        }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "Overview" && (
              <div>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1.5rem" }}>
            Onboarding Overview
          </h3>
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
                          new Date(currentNewHire.start_date) > new Date() 
                            ? 'NOT STARTED' 
                            : (() => {
                                const currentMilestone = onboardingPlan ? getCurrentMilestoneFromTasks(onboardingPlan) : currentNewHire.current_milestone;
                                return currentMilestone.replace('_', ' ').toUpperCase();
                              })()
                        }
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Expected Milestone:</strong> {
                          new Date(currentNewHire.start_date) > new Date() 
                            ? 'NOT STARTED' 
                            : currentNewHire.expected_milestone.replace('_', ' ').toUpperCase()
                        }
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Status:</strong> <span style={{ color: statusDisplay.color, fontWeight: 700 }}>
                          {statusDisplay.text}
                        </span>
                      </div>
                      <div>
                        <strong>{new Date(currentNewHire.start_date) > new Date() ? 'Days until start date:' : 'Days since joining:'}</strong> {
                          new Date(currentNewHire.start_date) > new Date() 
                            ? `${calculateWorkingDaysUntilStart(currentNewHire.start_date)} days`
                            : `${currentNewHire.workdays_since_start} days`
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
                        <strong>Manager:</strong> {currentManager.name}
            </div>
          <div style={{ marginBottom: 8 }}>
                        <strong>Buddy:</strong> {currentBuddy ? `${currentBuddy.name} ${currentBuddy["surname (s)"] || ''}`.trim() : 'Not assigned'}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Role:</strong> {currentNewHire.role || 'Not set'}
                      </div>
                      <div>
                        <strong>Start Date:</strong> {formatDate(currentNewHire.start_date)}
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
                              const scheduledProgress = new Date(currentNewHire.start_date) > new Date() 
                                ? calculateScheduledProgressForFuture(currentNewHire.start_date)
                                : calculateScheduledProgress(currentNewHire.workdays_since_start);
                              return `${scheduledProgress}/5 milestones`;
                            })()}
                          </span>
                        </div>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Actual Progress:</strong> <span style={{ marginLeft: "0.5rem" }}>
                          {(() => {
                            const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : calculateActualProgress(currentNewHire.current_milestone, currentNewHire.calculated_status);
                            return `${actualProgress}/5 milestones`;
                          })()}
                        </span>
                      </div>
                    <div style={{ marginBottom: 8 }}>
                        <strong>Completion Rate:</strong> {(() => {
                          const actualProgress = onboardingPlan ? calculateActualProgressFromTasks(onboardingPlan) : calculateActualProgress(currentNewHire.current_milestone, currentNewHire.calculated_status);
                          return Math.round((actualProgress / 5) * 100);
                        })()}%
</div>
                    <div>
                      <strong>Days Remaining:</strong> {
                          new Date(currentNewHire.start_date) > new Date() 
                            ? `${calculateWorkingDaysUntilStart(currentNewHire.start_date)} days until start`
                            : `${Math.max(0, 90 - currentNewHire.workdays_since_start)} days`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {activeTab === "Plan" && (
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1.5rem" }}>
                  Onboarding Plan
                </h3>
                
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
                              const actualDueDate = calculateTaskDueDate(currentNewHire.start_date, milestone.id, taskIdx);
                              
                              // Calculate days overdue
                              const today = new Date();
                              const dueDate = new Date(actualDueDate);
                              const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                              
                              // Format due date display
                              const formattedDueDate = (() => {
                                if (daysOverdue > 0) {
                                  // Show days overdue in red
                                  return (
                                    <span style={{ color: COLORS.errorRed, fontWeight: 700 }}>
                                      {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                                    </span>
                                  );
                                } else if (daysOverdue === 0 && today.toDateString() === dueDate.toDateString()) {
                                  // Today is the due date
                                  return (
                                    <span style={{ color: COLORS.warningAmber, fontWeight: 700 }}>
                                      Due today
                                    </span>
                                  );
                                } else {
                                  // Future date - show target date
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
                                {/* Compact Task Header */}
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
                              onChange={(e) => handleUpdateStatus(task, e.target.value)}
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

                                {/* Compact Task Details */}
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



                                {/* Compact Action Buttons */}
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
                                      handleViewDetails(task);
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
                    boxShadow: "0 4px 16px rgba(38,70,83,0.08)"
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>AI Onboarding Plan</div>
                    <div style={{ fontSize: 16, marginBottom: 24 }}>
                      {onboardingPlan && onboardingPlan.plan_data && onboardingPlan.plan_data.milestones && onboardingPlan.plan_data.milestones.length > 0 ? 
                        `${currentNewHire?.name || 'Team member'}'s personalised onboarding plan is ready!` :
                        currentNewHire ? 
                          `${currentNewHire.name}'s onboarding plan is being prepared.` :
                          'Onboarding plan not found for this team member.'
                      }
                </div>
              <div style={{ 
                      background: `${COLORS.teal}10`, 
                      border: `2px solid ${COLORS.teal}30`, 
                      borderRadius: 12, 
                      padding: 16,
                      fontSize: 14
                    }}>
                      💡 <strong>What to expect:</strong> Role-specific tasks, milestone tracking, and personalised learning paths tailored to their position.
                    </div>
            </div>
          )}
        </div>
)}

            {activeTab === "Feedback" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Feedback Header */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  background: COLORS.white,
                  borderRadius: 16,
                  padding: "1.5rem",
                  boxShadow: "0 4px 16px rgba(38,70,83,0.08)"
                }}>
                  <div>
                    <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: "0 0 0.5rem 0" }}>
                      Feedback & Reviews
                    </h3>
                    <p style={{ fontSize: 16, color: COLORS.textGray, margin: 0 }}>
                      Share feedback about {currentNewHire?.name}'s onboarding and view feedback from the team
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
                      boxShadow: "0 4px 16px rgba(38,70,83,0.08)"
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                      <div style={{ fontWeight: 700, fontSize: 20, color: COLORS.darkBlue, marginBottom: 8 }}>
                        No feedback yet
                      </div>
                      <div style={{ fontSize: 16, color: COLORS.textGray, marginBottom: 24 }}>
                        Be the first to share feedback about {currentNewHire?.name}'s onboarding experience
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
                        boxShadow: "0 4px 16px rgba(38,70,83,0.08)",
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

            {activeTab === "Growth" && (
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1.5rem" }}>
                  Growth & Development
                </h3>
                
                {/* Growth Categories */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                  
                  {/* Self-Awareness Section */}
                  <div style={{ 
                    background: COLORS.white, 
                    borderRadius: 16, 
                    padding: "1.5rem",
                    boxShadow: "0 4px 16px rgba(38,70,83,0.08)",
                    border: `1px solid ${COLORS.borderGray}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                      <div style={{ 
                        width: 8, 
                        height: 32, 
                        background: COLORS.teal, 
                        borderRadius: 4 
                      }} />
                      <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                        Self-Awareness
                      </h4>
                    </div>
                    
                    {/* Tests & Assessments */}
                    <div style={{ marginBottom: "1rem" }}>
                      <h5 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.75rem" }}>
                        Tests & Assessments
                      </h5>
                      
                      {growthTests.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {growthTests.map((test, idx) => {
                            const isCompleted = completedTests.some(ct => ct.growth_test_id === test.id);
                            const completedTest = completedTests.find(ct => ct.growth_test_id === test.id);
                            
                            return (
                              <div key={idx} style={{
                                background: isCompleted ? `${COLORS.successGreen}10` : COLORS.lightGray,
                                borderRadius: 8,
                                padding: "0.75rem",
                                border: `1px solid ${isCompleted ? COLORS.successGreen : COLORS.borderGray}`
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <div style={{ 
                                      fontWeight: 600, 
                                      color: COLORS.darkBlue, 
                                      fontSize: 14,
                                      marginBottom: "0.25rem"
                                    }}>
                                      {test.name}
                                    </div>
                                    <div style={{ 
                                      fontSize: 12, 
                                      color: COLORS.textGray 
                                    }}>
                                      {test.description}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    background: isCompleted ? COLORS.successGreen : COLORS.warningAmber,
                                    color: COLORS.white,
                                    padding: "4px 8px",
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 600
                                  }}>
                                    {isCompleted ? 'Completed' : 'Pending'}
                                  </div>
                                </div>
                                {isCompleted && completedTest && (
                                  <div style={{ 
                                    marginTop: "0.5rem", 
                                    fontSize: 12, 
                                    color: COLORS.textGray 
                                  }}>
                                    <strong>Result:</strong> {completedTest.result_summary}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: "center", 
                          padding: "1rem", 
                          color: COLORS.textGray,
                          fontSize: 14
                        }}>
                          No tests available
                        </div>
                      )}
                    </div>
                    
                    {/* Insights */}
                    {growthInsights.length > 0 && (
                      <div>
                        <h5 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.75rem" }}>
                          AI-Generated Insights
                        </h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {growthInsights.slice(0, 2).map((insight, idx) => (
                            <div key={idx} style={{
                              background: COLORS.lightGray,
                              borderRadius: 8,
                              padding: "0.75rem",
                              border: `1px solid ${COLORS.borderGray}`
                            }}>
                              <div style={{ 
                                fontWeight: 600, 
                                color: COLORS.darkBlue, 
                                fontSize: 13,
                                marginBottom: "0.25rem"
                              }}>
                                {insight.title}
                              </div>
                              <div style={{ 
                                fontSize: 12, 
                                color: COLORS.textGray 
                              }}>
                                {insight.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Goal Setting Section */}
                  <div style={{ 
                    background: COLORS.white, 
                    borderRadius: 16, 
                    padding: "1.5rem",
                    boxShadow: "0 4px 16px rgba(38,70,83,0.08)",
                    border: `1px solid ${COLORS.borderGray}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                      <div style={{ 
                        width: 8, 
                        height: 32, 
                        background: COLORS.yellow, 
                        borderRadius: 4 
                      }} />
                      <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                        Goal Setting
                      </h4>
                    </div>
                    
                    <div style={{ 
                      textAlign: "center", 
                      padding: "2rem", 
                      color: COLORS.textGray,
                      fontSize: 14
                    }}>
                      Goal setting functionality will be available soon.
                      <br />
                      <span style={{ fontSize: 12, opacity: 0.7 }}>
                        Employees can set and track their career goals here.
                      </span>
                    </div>
                  </div>
                  
                  {/* Skills Building Section */}
                  <div style={{ 
                    background: COLORS.white, 
                    borderRadius: 16, 
                    padding: "1.5rem",
                    boxShadow: "0 4px 16px rgba(38,70,83,0.08)",
                    border: `1px solid ${COLORS.borderGray}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                      <div style={{ 
                        width: 8, 
                        height: 32, 
                        background: COLORS.orange, 
                        borderRadius: 4 
                      }} />
                      <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                        Skills Building
                      </h4>
                    </div>
                    
                    <div style={{ 
                      textAlign: "center", 
                      padding: "2rem", 
                      color: COLORS.textGray,
                      fontSize: 14
                    }}>
                      Skills building functionality will be available soon.
                      <br />
                      <span style={{ fontSize: 12, opacity: 0.7 }}>
                        Employees can track their skill development here.
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div style={{ 
                  background: COLORS.gray, 
                  borderRadius: 12, 
                  padding: "1.5rem", 
                  marginTop: "1.5rem"
                }}>
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, marginBottom: "1rem" }}>
                    Growth Summary
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue }}>
                        {growthTests.length}
                      </div>
                      <div style={{ fontSize: 14, color: COLORS.textGray }}>
                        Total Tests Available
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.successGreen }}>
                        {completedTests.length}
                      </div>
                      <div style={{ fontSize: 14, color: COLORS.textGray }}>
                        Tests Completed
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.warningAmber }}>
                        {growthTests.length - completedTests.length}
                      </div>
                      <div style={{ fontSize: 14, color: COLORS.textGray }}>
                        Tests Pending
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.teal }}>
                        {growthInsights.length}
                      </div>
                      <div style={{ fontSize: 14, color: COLORS.textGray }}>
                        AI Insights Generated
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Useful Resources" && (
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1rem" }}>
                  Useful Resources
                </h3>

                
                              {(() => {
                // Get unique categories that have resources
                const categoriesWithResources = [...new Set(resources.map(r => r.category))];
                
                if (categoriesWithResources.length === 0) {
                  return null; // Don't show anything if no resources
                }
                
                return (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {categoriesWithResources.map((category) => (
                      <div key={category} style={{ 
                        background: COLORS.white, 
                        borderRadius: 12, 
                        padding: "1.5rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: `1px solid ${COLORS.borderGray}`
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                            {category}
                          </h4>
                          <button 
                            onClick={() => setShowAddResource(true)}
                            style={{
                              background: COLORS.teal,
                              color: COLORS.white,
                              border: "none",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            +
                          </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {resources.filter(r => r.category === category).map((resource) => {
                            const isAccessibleToEmployee = resource.accessible_to === 'all' || 
                              (Array.isArray(resource.accessible_employees) && resource.accessible_employees.includes(currentNewHire?.id || 0));
                            
                            console.log('Resource:', resource.title, 'Employee ID:', currentNewHire?.id, 'Accessible employees:', resource.accessible_employees, 'Is accessible:', isAccessibleToEmployee);
                            
                            return (
                              <div key={resource.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <a 
                                  href={resource.type === 'link' ? resource.url : resource.type === 'file' ? `/api/resources/${resource.id}/download` : '#'} 
                                  target={resource.type === 'link' ? "_blank" : resource.type === 'file' ? "_blank" : undefined}
                                  rel={resource.type === 'link' ? "noopener noreferrer" : resource.type === 'file' ? "noopener noreferrer" : undefined}
                                  style={{ 
                                    color: isAccessibleToEmployee ? COLORS.teal : COLORS.darkBlue, 
                                    textDecoration: "none",
                                    padding: "0.5rem",
                                    borderRadius: 6,
                                    background: isAccessibleToEmployee ? `${COLORS.teal}10` : `${COLORS.gray}20`,
                                    transition: "all 0.2s",
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    opacity: isAccessibleToEmployee ? 1 : 0.8
                                  }}
                                >
                                  {getResourceIcon(resource.type)} {resource.title}
                                  {resource.type === 'file' && isAccessibleToEmployee && (
                                    <span style={{ fontSize: 10, opacity: 0.7 }}>(Download)</span>
                                  )}
                                  {!isAccessibleToEmployee && (
                                    <span style={{ 
                                      fontSize: 12, 
                                      background: COLORS.errorRed, 
                                      color: COLORS.white, 
                                      padding: "4px 8px", 
                                      borderRadius: 6,
                                      marginLeft: "auto",
                                      fontWeight: "bold",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px"
                                    }}>
                                      No Access
                                    </span>
                                  )}
                                </a>
                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                  <button 
                                    onClick={() => setEditingResource(resource)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: COLORS.darkBlue,
                                      fontSize: 12,
                                      cursor: "pointer",
                                      padding: "0.25rem 0.5rem"
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteResource(resource.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: COLORS.errorRed,
                                      fontSize: 12,
                                      cursor: "pointer",
                                      padding: "0.25rem 0.5rem"
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
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
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
                                    <option value="Company Resources">Company Resources</option>
                                    <option value="IT Resources">IT Resources</option>
                                    <option value="Training Materials">Training Materials</option>
<option value="Policies & Procedures">Policies & Procedures</option>
                </select>
              </div>

{formData.accessible_to === 'specific' && (
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
                  Select Employees *
                </label>
<div style={{ maxHeight: 200, overflow: "auto", border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, padding: 8 }}>
            {employees.map((employee) => (
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
                <span style={{                     color: COLORS.darkBlue }}>{employee.name} {employee["surname(s)"]}</span>
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