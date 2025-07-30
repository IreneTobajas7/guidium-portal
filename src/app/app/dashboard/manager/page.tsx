"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { fetchManagers, fetchNewHires, fetchBuddies, fetchResources, createResource, updateResource, deleteResource, type Manager, type NewHire, type Buddy, type Resource, calculateScheduledProgress, calculateActualProgress, calculateActualProgressFromTasks, getCurrentMilestoneFromTasks, calculateWorkingDaysUntilStart, calculateScheduledProgressForFuture, getStatusColor, formatDate, getInitials, fetchOnboardingPlan } from "@/lib/api";

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
  manager: ["Home", "Team", "Opportunities", "Resources"],
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
    { title: "# Pending Actions", value: pendingActionsCount, color: COLORS.red, onClick: () => {
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
    }},
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
                background: COLORS.darkBlue,
                color: COLORS.white,
                border: "none",
                borderRadius: 10,
                padding: "8px 20px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(38,70,83,0.2)"
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
              Sign Out
            </button>
          </SignOutButton>
          </div>
          <span
            style={{
              background: COLORS.teal,
              color: COLORS.white,
              borderRadius: "50%",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 24,
              boxShadow: "0 2px 8px rgba(42,157,143,0.18)",
            }}
          >
            {currentManager?.name?.charAt(0) || 'M'}
          </span>
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
            gap: "2.5rem",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.darkBlue,
              marginBottom: 12,
            }}
          >
            {activeTab === "Home" && currentManager ? (
              <>
                Hello, {currentManager.name}! 👋
              </>
            ) : (
              `${activeTab} Overview`
            )}
          </h2>
          
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
                    <Link href="/app/dashboard/manager/ai-insights" style={{
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
                      Get AI Insights
                    </Link>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
                      background: `${COLORS.orange}10`, 
                      borderRadius: 8,
                      borderLeft: `3px solid ${COLORS.orange}`
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.25rem" }}>
                        Action Items
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textGray }}>
                        {managerNewHires.filter(hire => !hire.buddy_id).length > 0 ? `${managerNewHires.filter(hire => !hire.buddy_id).length} team member(s) need buddy assignment` : 'All team members have buddies assigned'}
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
                  <div style={{ color: COLORS.darkBlue, fontSize: 14, lineHeight: 1.6 }}>
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
                          {updates.map((update, index) => {
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
                                  marginBottom: index < updates.length - 1 ? 12 : 0, 
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

          {/* Opportunities Tab Content */}
          {activeTab === "Opportunities" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* Growth Opportunities Section */}
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
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Growth Opportunities</div>
                  </div>
                  <button style={{
                    background: "rgba(255,255,255,0.3)",
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.2s"
                  }}>
                    Create New
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                  <button style={{
                    background: COLORS.white,
                    color: COLORS.darkBlue,
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 10,
                    padding: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.2s",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Leadership Training</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>3 team members eligible</div>
                    </div>
                  </button>
                  <button style={{
                    background: COLORS.white,
                    color: COLORS.darkBlue,
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 10,
                    padding: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.2s",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Mentorship Programme</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>2 new mentors needed</div>
                    </div>
                  </button>
                  <button style={{
                    background: COLORS.white,
                    color: COLORS.darkBlue,
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 10,
                    padding: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.2s",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Mentorship Programme</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>2 new mentors needed</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab Content */}
          {activeTab === "Resources" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {/* Resources Header */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: "1rem"
              }}>
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: 8 }}>
                    Resource Library
                  </h3>
                  <p style={{ fontSize: 14, color: COLORS.textGray }}>
                    Manage and share resources with your team members during their onboarding journey
                  </p>
                </div>
                <button
                  onClick={() => setShowAddResource(true)}
                  style={{
                    background: COLORS.teal,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(42,157,143,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
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

              {/* Resources Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
                {resources.length === 0 ? (
                  <div style={{ 
                    gridColumn: "1 / -1",
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
                  resources.map((resource) => (
                    <div key={resource.id} style={{ 
                      background: COLORS.white, 
                      borderRadius: 16, 
                      padding: 24,
                      border: `1px solid ${COLORS.borderGray}`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      transition: "all 0.2s"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ fontSize: 24 }}>{getResourceIcon(resource.type)}</div>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.darkBlue, marginBottom: 4 }}>
                              {resource.title}
                            </h4>
                            <div style={{ fontSize: 12, color: COLORS.textGray, background: `${COLORS.teal}10`, padding: "4px 8px", borderRadius: 4, display: "inline-block" }}>
                              {resource.category}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
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
                            onClick={() => deleteResource(resource.id)}
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
                      
                      <p style={{ fontSize: 14, color: COLORS.textGray, marginBottom: 16, lineHeight: 1.5 }}>
                        {resource.description}
                      </p>
                      
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: COLORS.textGray }}>
                          <strong>Access:</strong> {getAccessibleEmployeesText(resource)}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textGray }}>
                          {resource.type === 'link' && resource.url && (
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: COLORS.teal, textDecoration: "none" }}
                            >
                              Open Link →
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: 11, color: COLORS.textGray, opacity: 0.7 }}>
                        Created {new Date(resource.created_at).toLocaleDateString('en-GB')}
                        {resource.updated_at !== resource.created_at && 
                          ` • Updated ${new Date(resource.updated_at).toLocaleDateString('en-GB')}`
                        }
                      </div>
                    </div>
                  ))
                )}
              </div>
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

  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Standard categories
  const standardCategories = [
    'Company Policies',
    'Company Resources',
    'HR Resources',
    'IT Resources',
    'Other',
    'Security Guidelines',
    'Training Materials'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const resourceData = {
      title: formData.title,
      description: formData.description,
      type: formData.type as 'link' | 'file',
      url: formData.type === 'link' ? formData.url : undefined,
      file_path: formData.type === 'file' ? formData.file_path : undefined,
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
 