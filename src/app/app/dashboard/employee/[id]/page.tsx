"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchNewHires, fetchOnboardingPlan, fetchResources, createResource, updateResource, deleteResource, type NewHire, type Resource, calculateOnboardingProgress, calculateActualProgressFromTasks, getCurrentMilestoneFromTasks, calculateScheduledProgress, calculateScheduledProgressForFuture, calculateWorkingDaysUntilStart, getStatusColor, formatDate, getInitials } from "@/lib/api";

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

const GRADIENT_BG = "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)";
const CARD_SHADOW = "0 4px 24px rgba(38,70,83,0.10)";
const CARD_RADIUS = 28;
const CARD_PADDING = 32;



export default function EmployeeOnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  
  const [mounted, setMounted] = React.useState(false);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [currentNewHire, setCurrentNewHire] = useState<NewHire | null>(null);
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [showAddResource, setShowAddResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [collapsedMilestones, setCollapsedMilestones] = useState<{[key: string]: boolean}>({});

  React.useEffect(() => { setMounted(true); }, []);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [newHiresData] = await Promise.all([
          fetchNewHires()
        ]);
        setNewHires(newHiresData);
        
        // Find the current employee
        const currentNewHire = newHiresData.find(hire => hire.id.toString() === employeeId);
        
        if (currentNewHire) {
          setCurrentNewHire(currentNewHire);
          const planData = await fetchOnboardingPlan(currentNewHire.id);
          setOnboardingPlan(planData);
          
          // Fetch resources for this employee
          const resourcesData = await fetchResources(currentNewHire.id);
          setResources(resourcesData);
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  // Resource management functions
  const addResource = async (resourceData: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newResource = await createResource(resourceData);
      if (newResource) {
        setResources(prev => [...prev, newResource]);
        setShowAddResource(false);
      }
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  const handleUpdateResource = async (resourceId: string, updates: any) => {
    try {
      const updatedResource = await updateResource(resourceId, updates);
      if (updatedResource) {
        setResources(prev => prev.map(resource => 
          resource.id === resourceId ? updatedResource : resource
        ));
        setEditingResource(null);
      }
    } catch (error) {
      console.error('Error updating resource:', error);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }
    
    try {
      const success = await deleteResource(resourceId);
      if (success) {
        setResources(prev => prev.filter(resource => resource.id !== resourceId));
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'link': return '🔗';
      case 'file': return '📄';
      default: return '📎';
    }
  };

  const toggleMilestone = (milestoneId: string) => {
    setCollapsedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  const handleViewDetails = (task: any) => {
    // This would open a detailed view of the task
    console.log('View details for task:', task);
  };

  const handleUpdateStatus = async (task: any, newStatus: string) => {
    // This would update the task status in the database
    console.log('Update status for task:', task.id, 'to:', newStatus);
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.darkBlue,
        fontSize: "18px"
      }}>
        Loading onboarding plan...
      </div>
    );
  }

  if (!currentNewHire) {
    return (
      <div style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.darkBlue,
        fontSize: "18px"
      }}>
        Employee not found.
      </div>
    );
  }

  if (!onboardingPlan) {
    return (
      <div style={{
        fontFamily: "Ubuntu, Arial, sans-serif",
        background: GRADIENT_BG,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.darkBlue,
        fontSize: "18px"
      }}>
        Onboarding plan not found.
      </div>
    );
  }

  const actualProgress = calculateActualProgressFromTasks(onboardingPlan);
  const currentMilestone = getCurrentMilestoneFromTasks(onboardingPlan);

  return (
    <div style={{
      fontFamily: "Ubuntu, Arial, sans-serif",
      background: GRADIENT_BG,
      minHeight: "100vh",
      padding: "2rem 0"
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 1300,
        margin: "0 auto",
        padding: "0 2rem",
        marginBottom: "2rem"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem"
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "none",
              color: COLORS.darkBlue,
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            ← Back
          </button>
        </div>

        {/* Employee Card */}
        <div style={{
          background: COLORS.white,
          borderRadius: CARD_RADIUS,
          padding: CARD_PADDING,
          boxShadow: CARD_SHADOW,
          marginBottom: "2rem"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 20
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: COLORS.teal,
              color: COLORS.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 32
            }}>
              {getInitials(currentNewHire.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: 32,
                fontWeight: 800,
                color: COLORS.darkBlue,
                margin: 0,
                marginBottom: 8
              }}>
                {currentNewHire.name} {currentNewHire["surname(s)"]}
              </h1>
              <div style={{
                fontSize: 18,
                color: COLORS.textGray,
                marginBottom: 12
              }}>
                {currentNewHire.role || 'Role not set'}
              </div>
              <div style={{
                fontSize: 14,
                color: COLORS.textGray
              }}>
                Start Date: {formatDate(currentNewHire.start_date)} • {
                  new Date(currentNewHire.start_date) > new Date() 
                    ? `${calculateWorkingDaysUntilStart(currentNewHire.start_date)} days until start date`
                    : `${currentNewHire.workdays_since_start} days since joining`
                }
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: 20
          }}>
            <div style={{
              background: `${COLORS.teal}10`,
              borderRadius: 12,
              padding: 16,
              border: `1px solid ${COLORS.teal}20`
            }}>
              <div style={{ fontSize: 14, color: COLORS.teal, fontWeight: 600, marginBottom: 4 }}>
                Current Milestone
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.darkBlue }}>
                {currentMilestone || 'Not Started'}
              </div>
            </div>
            <div style={{
              background: `${COLORS.orange}10`,
              borderRadius: 12,
              padding: 16,
              border: `1px solid ${COLORS.orange}20`
            }}>
              <div style={{ fontSize: 14, color: COLORS.orange, fontWeight: 600, marginBottom: 4 }}>
                Onboarding Progress
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.darkBlue }}>
                {actualProgress}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: "flex",
          gap: 2,
          marginBottom: 24,
          background: COLORS.white,
          borderRadius: 12,
          padding: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          {["Overview", "Plan", "Feedback", "Useful Resources"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? COLORS.teal : "transparent",
                color: activeTab === tab ? COLORS.white : COLORS.darkBlue,
                border: "none",
                borderRadius: 8,
                padding: "12px 20px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                transition: "all 0.2s",
                flex: 1
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          background: COLORS.white,
          borderRadius: CARD_RADIUS,
          padding: CARD_PADDING,
          boxShadow: CARD_SHADOW
        }}>
          {activeTab === "Overview" && (
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1.5rem" }}>
                Overview
              </h3>
              <div style={{ color: COLORS.darkBlue, opacity: 0.7 }}>
                Welcome to your onboarding journey! Here you can track your progress and access all the resources you need.
              </div>
            </div>
          )}

          {activeTab === "Plan" && (
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1.5rem" }}>
                Your Onboarding Plan
              </h3>
              
              {/* Onboarding Plan Content */}
              {onboardingPlan.plan_data.milestones.map((milestone: any, idx: number) => (
                <div key={milestone.label} style={{ 
                  marginBottom: 24,
                  background: `${milestone.color}08`,
                  borderRadius: 16,
                  border: `2px solid ${milestone.color}20`,
                  overflow: "hidden",
                  boxShadow: `0 2px 12px ${milestone.color}15`
                }}>
                  {/* Milestone Header */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    gap: 16, 
                    padding: "16px 20px",
                    background: `linear-gradient(135deg, ${milestone.color} 0%, ${milestone.color}dd 100%)`,
                    color: COLORS.white,
                    cursor: "pointer"
                  }}
                  onClick={() => toggleMilestone(milestone.label)}
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
                    </div>
                    <div style={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: 12
                    }}>
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
                        {milestone.tasks.length} {milestone.tasks.length === 1 ? 'task' : 'tasks'}
                      </div>
                      <div style={{ fontSize: 20 }}>
                        {collapsedMilestones[milestone.label] ? '▼' : '▲'}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Container */}
                  {!collapsedMilestones[milestone.label] && (
                    <div style={{ 
                      padding: "16px",
                      background: COLORS.white
                    }}>
                      <div style={{ display: "grid", gap: 12 }}>
                        {milestone.tasks.map((task: any) => (
                          <div key={task.id} style={{ 
                            background: COLORS.white, 
                            border: `1px solid ${task.status === "Done" ? COLORS.teal : task.status === "Overdue" ? COLORS.red : task.status === "In Progress" ? COLORS.orange : COLORS.gray}`,
                            borderRadius: 12,
                            padding: 16,
                            boxShadow: "0 2px 8px rgba(38,70,83,0.06)",
                            transition: "all 0.3s",
                            position: "relative",
                            overflow: "hidden",
                            borderLeft: `4px solid ${milestone.color}`
                          }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontWeight: 700, 
                                  fontSize: 16, 
                                  color: COLORS.darkBlue, 
                                  marginBottom: 8 
                                }}>
                                  {task.title}
                                </div>
                                <div style={{ 
                                  fontSize: 14, 
                                  color: COLORS.textGray, 
                                  marginBottom: 12,
                                  lineHeight: 1.5
                                }}>
                                  {task.description}
                                </div>
                                <div style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: 16,
                                  fontSize: 12,
                                  color: COLORS.textGray
                                }}>
                                  <span>Due: {task.dueDate}</span>
                                  <span>•</span>
                                  <span>Area: {task.areaOfBusiness}</span>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <select
                                  value={task.status}
                                  onChange={(e) => handleUpdateStatus(task, e.target.value)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    border: `1px solid ${COLORS.borderGray}`,
                                    fontSize: 12,
                                    background: COLORS.white,
                                    color: COLORS.darkBlue,
                                    cursor: "pointer"
                                  }}
                                >
                                  <option value="Not Started">Not Started</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Done">Done</option>
                                  <option value="Overdue">Overdue</option>
                                </select>
                                <button
                                  onClick={() => handleViewDetails(task)}
                                  style={{
                                    background: COLORS.teal,
                                    color: COLORS.white,
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "6px 12px",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: 600
                                  }}
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "Feedback" && (
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1.5rem" }}>
                Feedback & Reviews
              </h3>
              <div style={{ color: COLORS.darkBlue, opacity: 0.7 }}>
                Feedback from buddies, managers, and self-assessments will be displayed here.
              </div>
            </div>
          )}

          {activeTab === "Useful Resources" && (
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, marginBottom: "1.5rem" }}>
                Useful Resources
              </h3>
              
              <div style={{ display: "grid", gap: "1rem" }}>
                {/* Company Resources */}
                <div style={{ 
                  background: COLORS.white, 
                  borderRadius: 12, 
                  padding: "1.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  border: `1px solid ${COLORS.borderGray}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                      Company Resources
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
                    {resources.filter(r => r.category === 'Company Resources').map((resource) => (
                      <div key={resource.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <a 
                          href={resource.type === 'link' ? resource.url : '#'} 
                          target={resource.type === 'link' ? "_blank" : undefined}
                          rel={resource.type === 'link' ? "noopener noreferrer" : undefined}
                          style={{ 
                            color: COLORS.teal, 
                            textDecoration: "none",
                            padding: "0.5rem",
                            borderRadius: 6,
                            background: `${COLORS.teal}10`,
                            transition: "all 0.2s",
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          {getResourceIcon(resource.type)} {resource.title}
                        </a>
                        <button 
                          onClick={() => setEditingResource(resource)}
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.darkBlue,
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "0.25rem 0.5rem",
                            marginLeft: "0.5rem"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IT Resources */}
                <div style={{ 
                  background: COLORS.white, 
                  borderRadius: 12, 
                  padding: "1.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  border: `1px solid ${COLORS.borderGray}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                      IT Resources
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
                    {resources.filter(r => r.category === 'IT Resources').map((resource) => (
                      <div key={resource.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <a 
                          href={resource.type === 'link' ? resource.url : '#'} 
                          target={resource.type === 'link' ? "_blank" : undefined}
                          rel={resource.type === 'link' ? "noopener noreferrer" : undefined}
                          style={{ 
                            color: COLORS.teal, 
                            textDecoration: "none",
                            padding: "0.5rem",
                            borderRadius: 6,
                            background: `${COLORS.teal}10`,
                            transition: "all 0.2s",
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          {getResourceIcon(resource.type)} {resource.title}
                        </a>
                        <button 
                          onClick={() => setEditingResource(resource)}
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.darkBlue,
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "0.25rem 0.5rem",
                            marginLeft: "0.5rem"
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
              resources={resources}
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
  employees,
  resources
}: { 
  resource: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
  employees: NewHire[];
  resources: Resource[];
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
          Accessibility *
        </label>
        <select
          value={formData.accessible_to}
          onChange={(e) => setFormData(prev => ({ ...prev, accessible_to: e.target.value }))}
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
          <option value="all">All Employees</option>
          <option value="specific">Specific Employees</option>
        </select>
      </div>

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
          {(() => {
            // Get unique categories from existing resources and add default ones
            const existingCategories = [...new Set(resources.map(r => r.category))];
            const defaultCategories = [
              'Company Resources',
              'IT Resources', 
              'Policies & Procedures',
              'Training Materials'
            ];
            const allCategories = [...new Set([...existingCategories, ...defaultCategories])];
            
            // Sort alphabetically
            return allCategories.sort().map(category => (
              <option key={category} value={category}>{category}</option>
            ));
          })()}
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