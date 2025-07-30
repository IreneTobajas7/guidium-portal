"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { fetchManagers, fetchNewHires, fetchBuddies, fetchOnboardingPlan, type Manager, type NewHire, type Buddy, formatDate, getInitials } from "@/lib/api";

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

export default function TaskDetailPage() {
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

  const currentManager = managers.find(manager => manager.email === user?.primaryEmailAddress?.emailAddress);
  const currentNewHire = newHires.find(hire => hire.id.toString() === newHireId?.toString());
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

  const handleAddComment = () => {
    if (newComment.trim()) {
      // TODO: Add comment to database
      setNewComment("");
    }
  };

  const handleBackToPlan = () => {
    router.push(`/app/dashboard/team/${newHireId}`);
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
              fontSize: 16,
              color: COLORS.darkBlue,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            ← Back to Plan
          </button>
          <div style={{ width: "1px", height: "24px", background: COLORS.borderGray }}></div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
            {currentTask.name}
          </h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: COLORS.gray,
            borderRadius: 8,
            fontSize: 14,
            color: COLORS.darkBlue
          }}>
            <span style={{ fontWeight: 600 }}>Assigned to:</span>
            <span>{currentNewHire.name} {currentNewHire["surname(s)"]}</span>
          </div>
          
          <SignOutButton>
            <button style={{
              background: COLORS.darkBlue,
              color: COLORS.white,
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}>
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
          
          {/* Left Column - Task Details */}
          <div>
            {/* Task Header */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: COLORS.darkBlue, margin: "0 0 0.5rem 0" }}>
                    {currentTask.name}
                  </h2>
                  <p style={{ fontSize: 16, color: COLORS.textGray, margin: 0, lineHeight: 1.6 }}>
                    {currentTask.description}
                  </p>
                </div>
                
                <select
                  value={taskStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    border: `1px solid ${COLORS.borderGray}`,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "2rem", fontSize: 14, color: COLORS.textGray }}>
                <div>
                  <strong>Due Date:</strong> {formatDate(currentTask.due_date)}
                </div>
                <div>
                  <strong>Estimated Time:</strong> {currentTask.estimated_hours}h
                </div>
                <div>
                  <strong>Priority:</strong> {currentTask.priority}
                </div>
                <div>
                  <strong>Milestone:</strong> {currentMilestone?.label}
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 1rem 0" }}>
                Task Details
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 0.5rem 0" }}>
                    Learning Objectives
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem", color: COLORS.textGray }}>
                    {currentTask.learning_objectives?.map((objective: string, index: number) => (
                      <li key={index} style={{ marginBottom: "0.5rem" }}>{objective}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 0.5rem 0" }}>
                    Success Metrics
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem", color: COLORS.textGray }}>
                    {currentTask.success_metrics?.map((metric: string, index: number) => (
                      <li key={index} style={{ marginBottom: "0.5rem" }}>{metric}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {currentTask.ai_insights && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", background: `${COLORS.teal}10`, borderRadius: 8, border: `1px solid ${COLORS.teal}30` }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: COLORS.teal, margin: "0 0 0.5rem 0" }}>
                    AI Insights
                  </h4>
                  <p style={{ margin: 0, color: COLORS.textGray, fontSize: 14 }}>
                    {currentTask.ai_insights}
                  </p>
                </div>
              )}
            </div>

            {/* Checklist */}
            {currentTask.checklist && currentTask.checklist.length > 0 && (
              <div style={{ 
                background: COLORS.white, 
                borderRadius: 12, 
                padding: "1.5rem",
                marginBottom: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 1rem 0" }}>
                  Checklist
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {currentTask.checklist.map((item: string, index: number) => (
                    <label key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input type="checkbox" style={{ width: "18px", height: "18px" }} />
                      <span style={{ color: COLORS.textGray }}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
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
                    resize: "vertical"
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
              
              <div style={{ color: COLORS.textGray, fontSize: 14, fontStyle: "italic" }}>
                No comments yet. Be the first to add one!
              </div>
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
                <button style={{
                  background: COLORS.teal,
                  color: COLORS.white,
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer"
                }}>
                  + Add
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {currentTask.resources?.map((resource: string, index: number) => (
                  <div key={index} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "0.5rem", 
                    background: COLORS.gray, 
                    borderRadius: 6,
                    fontSize: 14,
                    color: COLORS.textGray
                  }}>
                    <span>{resource}</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button style={{
                        background: "none",
                        border: "none",
                        color: COLORS.teal,
                        fontSize: 12,
                        cursor: "pointer",
                        padding: "0.25rem 0.5rem"
                      }}>
                        Add Link
                      </button>
                      <button style={{
                        background: "none",
                        border: "none",
                        color: COLORS.darkBlue,
                        fontSize: 12,
                        cursor: "pointer",
                        padding: "0.25rem 0.5rem"
                      }}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
                {(!currentTask.resources || currentTask.resources.length === 0) && (
                  <div style={{ color: COLORS.textGray, fontSize: 14, fontStyle: "italic" }}>
                    No resources added yet
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 1rem 0" }}>
                Tags
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {currentTask.tags?.map((tag: string, index: number) => (
                  <span key={index} style={{ 
                    padding: "0.25rem 0.5rem", 
                    background: `${COLORS.teal}20`, 
                    color: COLORS.teal,
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 1rem 0" }}>
                Attachments
              </h3>
              <div style={{ color: COLORS.textGray, fontSize: 14, fontStyle: "italic" }}>
                No attachments yet
              </div>
              <button style={{
                background: "none",
                border: `1px solid ${COLORS.teal}`,
                color: COLORS.teal,
                padding: "0.5rem 1rem",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                marginTop: "1rem",
                width: "100%"
              }}>
                + Add Attachment
              </button>
            </div>

            {/* Team Info */}
            <div style={{ 
              background: COLORS.white, 
              borderRadius: 12, 
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, margin: "0 0 1rem 0" }}>
                Team
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textGray, marginBottom: "0.25rem" }}>
                    Manager
                  </div>
                  <div style={{ fontSize: 14, color: COLORS.darkBlue }}>
                    {currentManager?.name}
                  </div>
                </div>
                {currentBuddy && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textGray, marginBottom: "0.25rem" }}>
                      Buddy
                    </div>
                    <div style={{ fontSize: 14, color: COLORS.darkBlue }}>
                      {currentBuddy.name} {currentBuddy["surname (s)"]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 