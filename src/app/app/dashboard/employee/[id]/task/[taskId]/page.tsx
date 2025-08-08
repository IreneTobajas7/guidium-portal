"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { fetchManagers, fetchNewHires, fetchBuddies, fetchOnboardingPlan, type Manager, type NewHire, type Buddy, formatDate, getInitials, fetchTaskComments, addTaskComment, updateTaskComment, deleteTaskComment, type TaskComment } from "@/lib/api";

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

export default function EmployeeTaskDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const newHireId = params.id;
  const taskId = params.taskId;

  const [managers, setManagers] = useState<Manager[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [taskStatus, setTaskStatus] = useState("not_started");
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [taskResources, setTaskResources] = useState<any[]>([]);
  const [editingComment, setEditingComment] = useState<TaskComment | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const currentNewHire = newHires.find(hire => hire.id.toString() === newHireId?.toString());
  const currentManager = managers.find(manager => manager.id === currentNewHire?.manager_id);
  const currentBuddy = buddies.find(buddy => buddy.id === currentNewHire?.buddy_id);

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
          const plan = await fetchOnboardingPlan(currentNewHire.id);
          setOnboardingPlan(plan);
          
                  // Find the specific task
        if (plan && plan.plan_data && plan.plan_data.milestones) {
          for (const milestone of plan.plan_data.milestones) {
            const task = milestone.tasks?.find((t: any) => 
              t.id?.toString() === taskId?.toString() || 
              t.name === decodeURIComponent(taskId as string)
            );
            if (task) {
              setCurrentTask(task);
              setCurrentMilestone(milestone);
              setTaskStatus(task.status || "not_started");
              
              // Fetch comments for this task
              const taskComments = await fetchTaskComments(task.id || task.name, currentNewHire.id);
              setComments(taskComments);
              break;
            }
          }
        }
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
  }, [isLoaded, newHireId, taskId]);

  const handleStatusChange = (newStatus: string) => {
    setTaskStatus(newStatus);
    // TODO: Update task status in database
  };

  const handleAddComment = async () => {
    if (newComment.trim() && currentTask && currentNewHire) {
      const comment = await addTaskComment(
        currentTask.id || currentTask.name,
        currentNewHire.id,
        currentNewHire?.name || 'Employee',
        user?.primaryEmailAddress?.emailAddress || '',
        newComment.trim()
      );
      
      if (comment) {
        setComments([...comments, comment]);
        setNewComment("");
        
        // Update the task's comment count locally
        if (currentTask.comments) {
          currentTask.comments.push(comment);
        } else {
          currentTask.comments = [comment];
        }
        
        // Update the original task in the onboarding plan to ensure the comment count updates in task cards
        if (onboardingPlan && onboardingPlan.plan_data && onboardingPlan.plan_data.milestones) {
          for (const milestone of onboardingPlan.plan_data.milestones) {
            const task = milestone.tasks?.find((t: any) => 
              t.id?.toString() === (currentTask.id || currentTask.name)?.toString() || 
              t.name === currentTask.name
            );
            if (task) {
              if (task.comments) {
                task.comments.push(comment);
              } else {
                task.comments = [comment];
              }
              // Update the comment count for the task card display
              task.comment_count = (task.comment_count || 0) + 1;
              break;
            }
          }
        }
      }
    }
  };

  // Comment edit/delete functions
  const handleEditComment = async () => {
    if (!editingComment || !editingCommentText.trim()) return;

    const updatedComment = await updateTaskComment(
      editingComment.id,
      editingCommentText.trim()
    );

    if (updatedComment) {
      setComments(comments.map(c => c.id === editingComment.id ? updatedComment : c));
      setEditingComment(null);
      setEditingCommentText('');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const success = await deleteTaskComment(commentId);
    if (success) {
      setComments(comments.filter(c => c.id !== commentId));
      
      // Update the original task in the onboarding plan to reflect the reduced comment count
      if (onboardingPlan && onboardingPlan.plan_data && onboardingPlan.plan_data.milestones) {
        for (const milestone of onboardingPlan.plan_data.milestones) {
          const task = milestone.tasks?.find((t: any) => 
            t.id?.toString() === (currentTask?.id || currentTask?.name)?.toString() || 
            t.name === currentTask?.name
          );
          if (task) {
            task.comment_count = Math.max(0, (task.comment_count || 0) - 1);
            break;
          }
        }
      }
    }
  };

  const startEditComment = (comment: TaskComment) => {
    setEditingComment(comment);
    setEditingCommentText(comment.comment_text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.successGreen;
      case 'in_progress':
        return COLORS.warningAmber;
      case 'on_hold':
        return COLORS.yellow;
      case 'overdue':
        return COLORS.errorRed;
      default:
        return COLORS.darkGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'on_hold':
        return 'On Hold';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Not Started';
    }
  };

  const handleBackToPlan = () => {
    router.push(`/app/dashboard/employee?tab=Plan`);
  };

  const handleAddResource = async (resourceData: any) => {
    try {
      // Add the resource to the task
      const newResource = {
        id: Date.now().toString(), // Temporary ID
        ...resourceData,
        created_at: new Date().toISOString()
      };
      
      setTaskResources([...taskResources, newResource]);
      
      // Update the task's resources array
      if (currentTask.resources) {
        currentTask.resources.push(newResource.title);
      } else {
        currentTask.resources = [newResource.title];
      }
      
      // Update the original task in the onboarding plan to ensure the file count updates in task cards
      if (onboardingPlan && onboardingPlan.plan_data && onboardingPlan.plan_data.milestones) {
        for (const milestone of onboardingPlan.plan_data.milestones) {
          const task = milestone.tasks?.find((t: any) => 
            t.id?.toString() === (currentTask.id || currentTask.name)?.toString() || 
            t.name === currentTask.name
          );
          if (task) {
            if (task.attachments) {
              task.attachments.push(newResource);
            } else {
              task.attachments = [newResource];
            }
            break;
          }
        }
      }
      
      setShowResourceForm(false);
      setEditingResource(null);
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Failed to add resource. Please try again.');
    }
  };

  const handleUpdateResource = async (resourceId: string, updates: any) => {
    try {
      const updatedResources = taskResources.map(resource => 
        resource.id === resourceId ? { ...resource, ...updates } : resource
      );
      setTaskResources(updatedResources);
      setShowResourceForm(false);
      setEditingResource(null);
    } catch (error) {
      console.error('Error updating resource:', error);
      alert('Failed to update resource. Please try again.');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      const resourceToDelete = taskResources.find(r => r.id === resourceId);
      if (resourceToDelete) {
        // Remove from task resources
        if (currentTask.resources) {
          currentTask.resources = currentTask.resources.filter((r: string) => r !== resourceToDelete.title);
        }
        
        // Remove from local state
        setTaskResources(taskResources.filter(r => r.id !== resourceId));
        
        // Update the original task in the onboarding plan
        if (onboardingPlan && onboardingPlan.plan_data && onboardingPlan.plan_data.milestones) {
          for (const milestone of onboardingPlan.plan_data.milestones) {
            const task = milestone.tasks?.find((t: any) => 
              t.id?.toString() === (currentTask.id || currentTask.name)?.toString() || 
              t.name === currentTask.name
            );
            if (task && task.attachments) {
              task.attachments = task.attachments.filter((r: any) => r.id !== resourceId);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource. Please try again.');
    }
  };

  // Function to get assignee display name
  const getAssigneeDisplayName = (assignee: string) => {
    if (!assignee) return 'You';
    
    switch (assignee.toLowerCase()) {
      case 'new_hire':
      case 'employee':
      case 'you':
        return currentNewHire ? `${currentNewHire.name} ${(currentNewHire as any)["surname (s)"] || ''}`.trim() : 'You';
      case 'manager':
        return currentManager ? `${currentManager.name} ${(currentManager as any)["surname (s)"] || ''}`.trim() : 'Manager';
      case 'buddy':
        return currentBuddy ? `${currentBuddy.name} ${(currentBuddy as any)["surname (s)"] || ''}`.trim() : 'Buddy';
      case 'hr':
        return 'HR Team';
      case 'it':
        return 'IT Team';
      default:
        // If it's not a known role, try to find a person with that name
        const allPeople = [...managers, ...newHires, ...buddies];
        const person = allPeople.find(p => 
          p.name?.toLowerCase() === assignee.toLowerCase() ||
          `${p.name} ${(p as any)["surname (s)"] || ''}`.toLowerCase().trim() === assignee.toLowerCase()
        );
        return person ? `${person.name} ${(person as any)["surname (s)"] || ''}`.trim() : assignee;
    }
  };

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
        Loading task details...
      </div>
    );
  }

  if (!currentTask || !currentNewHire) {
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
        Task not found
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: GRADIENT_BG }}>
      {/* Header */}
      <header style={{ 
        background: COLORS.white, 
        padding: "1rem 2rem", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={handleBackToPlan}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: COLORS.darkBlue
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
              Task Details
            </h1>
            <p style={{ fontSize: 14, color: COLORS.textGray, margin: "4px 0 0 0" }}>
              {currentNewHire.name} • {currentMilestone?.label}
            </p>
          </div>
        </div>
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
      </header>

      {/* Main Content */}
      <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
          {/* Left Column - Task Details */}
          <div>
            {/* Task Information */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                  {currentTask.name}
                </h2>
                <select
                  value={taskStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: getStatusColor(taskStatus),
                    color: COLORS.white,
                    minWidth: "140px"
                  }}
                >
                  <option value="not_started" style={{ background: COLORS.darkGray, color: COLORS.white }}>Not Started</option>
                  <option value="in_progress" style={{ background: COLORS.warningAmber, color: COLORS.white }}>In Progress</option>
                  <option value="completed" style={{ background: COLORS.successGreen, color: COLORS.white }}>Completed</option>
                  <option value="on_hold" style={{ background: COLORS.yellow, color: COLORS.darkBlue }}>On Hold</option>
                  <option value="overdue" style={{ background: COLORS.errorRed, color: COLORS.white }}>Overdue</option>
                </select>
              </div>
              
              {currentTask.description && (
                <p style={{ fontSize: 16, color: COLORS.textGray, lineHeight: 1.6, marginBottom: "1rem" }}>
                  {currentTask.description}
                </p>
              )}
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <strong style={{ color: COLORS.darkBlue }}>Priority:</strong> <span style={{ color: COLORS.darkBlue, fontWeight: 500 }}>{currentTask.priority || 'Medium'}</span>
                </div>
                <div>
                  <strong style={{ color: COLORS.darkBlue }}>Estimated Hours:</strong> <span style={{ color: COLORS.darkBlue, fontWeight: 500 }}>{currentTask.estimated_hours || 'Not specified'}</span>
                </div>
                <div>
                  <strong style={{ color: COLORS.darkBlue }}>Assignee:</strong> <span style={{ color: COLORS.darkBlue, fontWeight: 500 }}>{getAssigneeDisplayName(currentTask.assignee)}</span>
                </div>
                <div>
                  <strong style={{ color: COLORS.darkBlue }}>Due Date:</strong> <span style={{ color: COLORS.darkBlue, fontWeight: 500 }}>{currentTask.due_date || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 1rem 0" }}>
                Comments
              </h3>
              
              <div style={{ marginBottom: "1rem" }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "0.75rem",
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 8,
                    fontSize: 14,
                    resize: "vertical",
                    color: COLORS.darkBlue
                  }}
                />
                <button
                  onClick={handleAddComment}
                  style={{
                    background: COLORS.teal,
                    color: COLORS.white,
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    marginTop: "0.5rem"
                  }}
                >
                  Add Comment
                </button>
              </div>
              
              {comments.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{
                      background: COLORS.lightGray,
                      borderRadius: 8,
                      padding: "1rem",
                      border: `1px solid ${COLORS.borderGray}`
                    }}>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        marginBottom: "0.5rem" 
                      }}>
                        <div style={{ fontWeight: 600, color: COLORS.darkBlue, fontSize: 14 }}>
                          {comment.author_name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 12, color: COLORS.textGray }}>
                            {new Date(comment.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {comment.author_email === user?.primaryEmailAddress?.emailAddress && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                onClick={() => startEditComment(comment)}
                                style={{
                                  background: COLORS.teal,
                                  color: COLORS.white,
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                style={{
                                  background: COLORS.errorRed,
                                  color: COLORS.white,
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                  fontSize: 11,
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
                      <div style={{ color: COLORS.darkBlue, fontSize: 14, lineHeight: 1.5 }}>
                        {comment.comment_text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: COLORS.textGray, fontSize: 14, fontStyle: "italic" }}>
                  No comments yet. Be the first to add one!
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div>
            {/* Resources */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                  Resources
                </h3>
                <button 
                  onClick={() => setShowResourceForm(true)}
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
                  + Add
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {taskResources.map((resource, index) => (
                  <div key={resource.id} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "0.5rem", 
                    background: COLORS.gray, 
                    borderRadius: 6,
                    fontSize: 14,
                    color: COLORS.darkBlue
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 500 }}>{resource.title}</span>
                      {resource.type === 'file' && <span style={{ fontSize: 12, color: COLORS.textGray }}>📎</span>}
                      {resource.type === 'link' && <span style={{ fontSize: 12, color: COLORS.textGray }}>🔗</span>}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {resource.type === 'link' && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.teal,
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "0.25rem 0.5rem",
                            textDecoration: "none"
                          }}
                        >
                          Open
                        </a>
                      )}
                      {resource.type === 'file' && (
                        <a
                          href={`/api/resources/${resource.id}/download`}
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.teal,
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "0.25rem 0.5rem",
                            textDecoration: "none"
                          }}
                        >
                          Download
                        </a>
                      )}
                      <button 
                        onClick={() => {
                          setEditingResource(resource);
                          setShowResourceForm(true);
                        }}
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
                ))}
                {taskResources.length === 0 && (
                  <div style={{ color: COLORS.textGray, fontSize: 14, fontStyle: "italic" }}>
                    No resources attached to this task.
                  </div>
                )}
              </div>
            </div>

            {/* Task Progress */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 1rem 0" }}>
                Task Progress
              </h3>
              <div style={{ 
                background: COLORS.gray, 
                height: 8, 
                borderRadius: 4, 
                overflow: "hidden",
                marginBottom: "0.5rem"
              }}>
                <div style={{
                  background: getStatusColor(taskStatus),
                  height: "100%",
                  width: `${taskStatus === "completed" ? 100 : taskStatus === "in_progress" ? 50 : 0}%`,
                  transition: "width 0.3s ease"
                }} />
              </div>
              <div style={{ fontSize: 14, color: COLORS.textGray }}>
                Status: {getStatusText(taskStatus)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Form Modal */}
      {showResourceForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: 12,
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: COLORS.darkBlue, margin: 0 }}>
                {editingResource ? 'Edit Resource' : 'Add Resource'}
              </h3>
              <button
                onClick={() => {
                  setShowResourceForm(false);
                  setEditingResource(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: COLORS.darkBlue
                }}
              >
                ×
              </button>
            </div>
            
            <ResourceForm
              resource={editingResource}
              onSubmit={editingResource ? (data) => handleUpdateResource(editingResource.id, data) : handleAddResource}
              onCancel={() => {
                setShowResourceForm(false);
                setEditingResource(null);
              }}
              employees={newHires}
            />
          </div>
        </div>
      )}

      {/* Edit Comment Modal */}
      {editingComment && (
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
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
                Edit Comment
              </h2>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditingCommentText('');
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

            <form onSubmit={(e) => { e.preventDefault(); handleEditComment(); }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontWeight: 600, color: COLORS.darkBlue, marginBottom: "0.5rem" }}>
                  Comment
                </label>
                <textarea
                  value={editingCommentText}
                  onChange={(e) => setEditingCommentText(e.target.value)}
                  placeholder="Edit your comment..."
                  style={{
                    width: "100%",
                    minHeight: 100,
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
                    setEditingComment(null);
                    setEditingCommentText('');
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
                  Update Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ResourceForm Component
function ResourceForm({ 
  resource, 
  onSubmit, 
  onCancel,
  employees 
}: { 
  resource: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
  employees: any[];
}) {
  const [formData, setFormData] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    type: resource?.type || 'link',
    url: resource?.url || '',
    file_path: resource?.file_path || '',
    category: resource?.category || 'Task Resources',
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
      created_by: 'Employee'
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
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "12px 16px",
            border: `1px solid ${COLORS.borderGray}`,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.darkBlue,
            resize: "vertical"
          }}
          placeholder="Describe what this resource contains..."
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: COLORS.darkBlue }}>
          Resource Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1px solid ${COLORS.borderGray}`,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.darkBlue
          }}
        >
          <option value="link">Link</option>
          <option value="file">File Upload</option>
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
              padding: "12px 16px",
              border: `1px solid ${COLORS.borderGray}`,
              borderRadius: 8,
              fontSize: 14,
              color: COLORS.darkBlue
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: COLORS.gray,
            color: COLORS.darkBlue,
            border: "none",
            padding: "12px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600
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
            padding: "12px 24px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {resource ? 'Update Resource' : 'Add Resource'}
        </button>
      </div>
    </form>
  );
} 