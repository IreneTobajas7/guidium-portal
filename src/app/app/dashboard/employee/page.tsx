"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { fetchNewHires, fetchOnboardingPlan, type NewHire, calculateOnboardingProgress, calculateActualProgressFromTasks, getCurrentMilestoneFromTasks, calculateScheduledProgress, calculateScheduledProgressForFuture, calculateWorkingDaysUntilStart, getStatusColor, formatDate, getInitials } from "@/lib/api";

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
const NAV_TABS = {
  newhire: ["Home", "Growth", "Opportunities", "Resources"],
};
const GRADIENT_BG = "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)";
const CARD_SHADOW = "0 4px 24px rgba(38,70,83,0.10)";
const CARD_RADIUS = 28;
const CARD_PADDING = 32;
const NAV_RADIUS = 32;
const NAV_BG = "rgba(255,255,255,0.85)";
const NAV_ACTIVE_BG = COLORS.teal;
const NAV_INACTIVE_BG = "rgba(255,255,255,0.5)";
const NAV_ACTIVE_COLOR = COLORS.white;
const NAV_INACTIVE_COLOR = COLORS.darkBlue;
const ROLE_OPTIONS = [
  { label: "Manager", value: "manager" },
  { label: "Employee", value: "newhire" },
  { label: "Buddy", value: "buddy" },
];

export default function EmployeeDashboardPage() {
  const [mounted, setMounted] = React.useState(false);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [currentNewHire, setCurrentNewHire] = useState<NewHire | null>(null);
  const [onboardingPlan, setOnboardingPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        
        // Find the current user's new hire record and fetch their onboarding plan
        const currentUserEmail = 'irenetobajas@gmail.com'; // This should come from Clerk auth
        const currentNewHire = newHiresData.find(hire => hire.email === currentUserEmail);
        
        if (currentNewHire) {
          setCurrentNewHire(currentNewHire);
          const planData = await fetchOnboardingPlan(currentNewHire.id);
          setOnboardingPlan(planData);
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Only render the employee dashboard content for the 'newhire' role
  const [activeTab, setActiveTab] = React.useState(NAV_TABS.newhire[0]);

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
        color: COLORS.darkBlue,
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
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
            E
          </span>
        </div>
      </nav>
      {/* Main Content */}
      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "0 2rem" }}>
        {/* Employee Home Tab */}
        {activeTab === "Home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Gamified Onboarding Journey Map */}
            <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 40, marginBottom: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 24, color: COLORS.teal, marginBottom: 24 }}>Onboarding Journey</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 0, position: "relative", marginBottom: 24 }}>
                {/* Journey Path */}
                <div style={{ position: "absolute", top: 32, left: 60, right: 60, height: 8, background: COLORS.gray, borderRadius: 8, zIndex: 0 }} />
                {/* Milestones */}
                {(() => {
                  if (!onboardingPlan) {
                    return [
                      { label: "Day 1", color: COLORS.teal, complete: false, current: true },
                      { label: "Week 1", color: COLORS.teal, complete: false },
                      { label: "Day 30", color: COLORS.yellow, complete: false },
                      { label: "Day 60", color: COLORS.orange, complete: false },
                      { label: "Day 90", color: COLORS.red, complete: false },
                    ];
                  }
                  
                  const milestoneOrder = ['day_1', 'week_1', 'day_30', 'day_60', 'day_90'];
                  const milestoneLabels = ['Day 1', 'Week 1', 'Day 30', 'Day 60', 'Day 90'];
                  const milestoneColors = [COLORS.teal, COLORS.teal, COLORS.yellow, COLORS.orange, COLORS.red];
                  
                  const actualProgress = calculateActualProgressFromTasks(onboardingPlan);
                  const currentMilestone = getCurrentMilestoneFromTasks(onboardingPlan);
                  
                  return milestoneOrder.map((milestoneId, idx) => {
                    const isCompleted = idx < actualProgress;
                    const isCurrent = milestoneId === currentMilestone;
                    
                    return {
                      label: milestoneLabels[idx],
                      color: milestoneColors[idx],
                      complete: isCompleted,
                      current: isCurrent
                    };
                  });
                })().map((milestone, idx, arr) => (
                  <div key={milestone.label} style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: milestone.complete ? milestone.color : milestone.current ? COLORS.white : COLORS.gray,
                      border: `4px solid ${milestone.current ? milestone.color : milestone.complete ? milestone.color : COLORS.gray}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 20,
                      color: milestone.complete ? COLORS.white : milestone.current ? milestone.color : COLORS.darkBlue,
                      boxShadow: milestone.current ? `0 0 0 6px ${milestone.color}33` : undefined,
                      transition: "all 0.3s",
                    }}>
                      {milestone.complete ? "✓" : milestone.label[0]}
                    </div>
                    <div style={{ marginTop: 10, fontWeight: 700, color: milestone.current ? milestone.color : COLORS.darkBlue, fontSize: 16 }}>{milestone.label}</div>
                  </div>
                ))}
              </div>
              {/* Onboarding Progress % Widget */}
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 20, color: COLORS.darkBlue, background: COLORS.gray, borderRadius: 12, padding: "10px 32px", display: "inline-block" }}>
                Onboarding Progress: <span style={{ color: COLORS.teal, fontWeight: 800 }}>
                  {(() => {
                    if (!onboardingPlan) return '0%';
                    const actualProgress = calculateActualProgressFromTasks(onboardingPlan);
                    return `${Math.round((actualProgress / 5) * 100)}%`;
                  })()}
                </span>
              </div>
            </div>
            {/* Modern Onboarding Plan - PM Tool Style */}
            <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 32, background: COLORS.teal, borderRadius: 4 }} />
                  <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Your Onboarding Plan</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ 
                    background: COLORS.gray, 
                    color: COLORS.darkBlue, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "8px 16px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <span>View All</span>
                  </button>
                  <button style={{ 
                    background: COLORS.teal, 
                    color: COLORS.white, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "8px 16px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: "flex", gap: 2, marginBottom: 24, background: COLORS.gray, borderRadius: 10, padding: 4 }}>
                {["All Tasks", "This Week", "Overdue", "Completed"].map((filter) => (
                  <button key={filter} style={{
                    background: filter === "All Tasks" ? COLORS.white : "transparent",
                    color: filter === "All Tasks" ? COLORS.darkBlue : COLORS.darkBlue,
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    boxShadow: filter === "All Tasks" ? "0 2px 8px rgba(38,70,83,0.08)" : "none",
                    transition: "all 0.2s"
                  }}>
                    {filter}
                  </button>
                ))}
              </div>

              {/* AI-Generated Onboarding Plan */}
              {onboardingPlan ? (
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
                    background: `linear-gradient(135deg, ${milestone.color} 0%, ${milestone.color}dd 100%)`,
                    color: COLORS.white,
                    position: "relative"
                  }}>
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
                  </div>

                  {/* Compact Task Cards Container */}
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
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          borderLeft: `4px solid ${milestone.color}`
                        }}>
                          {/* Priority Indicator */}
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: task.priority === "High" ? COLORS.red : task.priority === "Medium" ? COLORS.orange : COLORS.teal
                          }} />
                          
                          {/* Simplified Task Content */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ 
                              fontWeight: 700, 
                              fontSize: 16, 
                              color: COLORS.darkBlue, 
                              marginBottom: 8,
                              textDecoration: task.status === "completed" ? "line-through" : "none",
                              opacity: task.status === "completed" ? 0.6 : 1
                            }}>
                              {task.name}
                            </div>
                            
                            {/* Due Date */}
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 600 }}>Due date: </span>
                              <span style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.8 }}>{task.due}</span>
                            </div>

                            {/* Status */}
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 600 }}>Status: </span>
                              <span style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 12,
                                background: task.status === "completed" ? COLORS.teal : 
                                           task.status === "in progress" ? COLORS.orange : 
                                           task.status === "on hold" ? COLORS.yellow : 
                                           task.status === "not applicable" ? COLORS.gray : COLORS.gray,
                                color: task.status === "not started" ? COLORS.darkBlue : COLORS.white,
                                fontWeight: 600,
                                fontSize: 10,
                                textTransform: "uppercase"
                              }}>
                                {task.status}
                              </span>
                            </div>

                            {/* Comments */}
                            {task.comments?.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 600 }}>Comments: </span>
                                <div style={{ 
                                  background: COLORS.gray, 
                                  borderRadius: 6, 
                                  padding: 6, 
                                  fontSize: 11, 
                                  color: COLORS.darkBlue,
                                  marginTop: 4,
                                  border: "1px solid rgba(38,70,83,0.1)"
                                }}>
                                  {task.comments?.[0]}
                                  {task.comments?.length > 1 && (
                                    <span style={{ color: COLORS.teal, fontWeight: 600 }}> +{(task.comments?.length || 0) - 1} more</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Attachments */}
                            {task.attachments?.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 600 }}>Attachments: </span>
                                <div style={{ 
                                  display: "flex", 
                                  gap: 4, 
                                  marginTop: 4,
                                  flexWrap: "wrap"
                                }}>
                                  {task.attachments.map((attachment: any, idx: number) => (
                                    <span key={idx} style={{
                                      background: `${COLORS.teal}15`,
                                      color: COLORS.teal,
                                      padding: "2px 6px",
                                      borderRadius: 8,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      border: `1px solid ${COLORS.teal}30`
                                    }}>
                                      {attachment.name || `File ${idx + 1}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                boxShadow: CARD_SHADOW
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
          </div>
        )}
        {/* Placeholder for other tabs */}
        {activeTab !== "Home" && (
          <div style={{ color: COLORS.darkBlue, opacity: 0.7 }}>
            This is the <b>{activeTab}</b> section. Here you'll see relevant widgets, lists, and actions for this role.
          </div>
        )}

        {/* Growth Tab */}
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
                  { label: "Self-Awareness", color: COLORS.teal, complete: true, icon: "🧠" },
                  { label: "Goal Setting", color: COLORS.yellow, complete: true, icon: "🎯" },
                  { label: "Skill Building", color: COLORS.orange, complete: false, current: true, icon: "📚" },
                  { label: "Leadership", color: COLORS.red, complete: false, icon: "👑" },
                ].map((stage, idx) => (
                  <div key={stage.label} style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: stage.complete ? stage.color : stage.current ? COLORS.white : COLORS.gray,
                      border: `4px solid ${stage.current ? stage.color : stage.complete ? stage.color : COLORS.gray}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 24,
                      color: stage.complete ? COLORS.white : stage.current ? stage.color : COLORS.darkBlue,
                      boxShadow: stage.current ? `0 0 0 8px ${stage.color}33` : undefined,
                      transition: "all 0.3s",
                    }}>
                      {stage.icon}
                    </div>
                    <div style={{ marginTop: 12, fontWeight: 700, color: stage.current ? stage.color : COLORS.darkBlue, fontSize: 14, textAlign: "center" }}>{stage.label}</div>
                  </div>
                ))}
              </div>
              {/* Development Progress % Widget */}
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 20, color: COLORS.darkBlue, background: COLORS.gray, borderRadius: 12, padding: "10px 32px", display: "inline-block" }}>
                Development Progress: <span style={{ color: COLORS.teal, fontWeight: 800 }}>65%</span>
              </div>
            </div>

            {/* Personality Tests & Insights Section */}
            <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 32, background: COLORS.yellow, borderRadius: 4 }} />
                  <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Personality & Self-Discovery</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ 
                    background: COLORS.yellow, 
                    color: COLORS.darkBlue, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "8px 16px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    View All Results
                  </button>
                  <button style={{ 
                    background: COLORS.teal, 
                    color: COLORS.white, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "8px 16px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    Take New Test
                  </button>
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
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Completed Tests</div>
                  </div>
                  
                  {[
                    { name: "Myers-Briggs Type", result: "ENFP", insight: "You're naturally creative and people-oriented" },
                    { name: "DISC Assessment", result: "Influencer", insight: "Great at motivating and inspiring others" },
                    { name: "StrengthsFinder", result: "Top 5: Communication, Empathy, Adaptability, Creativity, Learning" }
                  ].map((test, idx) => (
                    <div key={idx} style={{ 
                      background: COLORS.white, 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 12,
                      border: `1px solid ${COLORS.borderGray}`,
                      boxShadow: "0 2px 8px rgba(42,157,143,0.08)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>{test.name}</div>
                        <span style={{
                          background: COLORS.teal,
                          color: COLORS.white,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {test.result}
                        </span>
                      </div>
                      <div style={{ color: COLORS.darkBlue, opacity: 0.8, fontSize: 14, lineHeight: 1.4 }}>
                        {test.insight}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Available Tests */}
                <div style={{ 
                  background: `${COLORS.orange}08`,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.orange}20`,
                  padding: 24,
                  overflow: "hidden"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    marginBottom: 16,
                    padding: "12px 16px",
                    background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.orange}dd 100%)`,
                    borderRadius: 12,
                    color: COLORS.white
                  }}>
                    <div style={{ fontSize: 24 }}>📝</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Available Tests</div>
                  </div>
                  
                  {[
                    { name: "Emotional Intelligence", duration: "15 min", benefit: "Understand your EQ strengths" },
                    { name: "Learning Style", duration: "10 min", benefit: "Optimise your learning approach" },
                    { name: "Career Values", duration: "20 min", benefit: "Align work with your values" },
                    { name: "Leadership Style", duration: "25 min", benefit: "Discover your leadership potential" }
                  ].map((test, idx) => (
                    <div key={idx} style={{ 
                      background: COLORS.white, 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 12,
                      border: `1px solid ${COLORS.orange}30`,
                      boxShadow: "0 2px 8px rgba(244,162,97,0.08)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>{test.name}</div>
                        <span style={{
                          background: COLORS.orange,
                          color: COLORS.white,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {test.duration}
                        </span>
                      </div>
                      <div style={{ color: COLORS.darkBlue, opacity: 0.8, fontSize: 14, lineHeight: 1.4 }}>
                        🎯 {test.benefit}
                      </div>
                      <button style={{
                        background: COLORS.orange,
                        color: COLORS.white,
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 12,
                        marginTop: 8
                      }}>
                        Start Test
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Career Goals & Objectives Section */}
            <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 32, background: COLORS.red, borderRadius: 4 }} />
                  <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Career Goals & Objectives</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ 
                    background: COLORS.red, 
                    color: COLORS.white, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "8px 16px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <span>+</span> Add New Goal
                  </button>
                </div>
              </div>

              {/* Goals Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
                {/* Short-term Goals */}
                <div style={{ 
                  background: `${COLORS.teal}08`,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.teal}20`,
                  padding: 24,
                  overflow: "hidden"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    marginBottom: 20,
                    padding: "12px 16px",
                    background: `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.teal}dd 100%)`,
                    borderRadius: 12,
                    color: COLORS.white
                  }}>
                    <div style={{ fontSize: 24 }}>🎯</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Short-term Goals (3-6 months)</div>
                  </div>
                  
                  {[
                    { goal: "Master React and Next.js", progress: 75, deadline: "2024-09-01", status: "In Progress" },
                    { goal: "Complete UX Design Course", progress: 30, deadline: "2024-10-15", status: "In Progress" },
                    { goal: "Lead a team project", progress: 0, deadline: "2024-12-01", status: "Not Started" }
                  ].map((goal, idx) => (
                    <div key={idx} style={{ 
                      background: COLORS.white, 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 16,
                      border: `1px solid ${COLORS.teal}30`,
                      boxShadow: "0 2px 8px rgba(42,157,143,0.08)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16, flex: 1 }}>{goal.goal}</div>
                        <span style={{
                          background: goal.status === "Completed" ? COLORS.teal : goal.status === "In Progress" ? COLORS.orange : COLORS.gray,
                          color: COLORS.white,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {goal.status}
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 600 }}>Progress</span>
                          <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 700 }}>{goal.progress}%</span>
                        </div>
                        <div style={{ height: 6, background: COLORS.gray, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ 
                            width: `${goal.progress}%`, 
                            height: 6, 
                            background: COLORS.teal,
                            borderRadius: 3,
                            transition: "width 0.3s"
                          }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7 }}>
                        📅 Due: {goal.deadline}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Long-term Goals */}
                <div style={{ 
                  background: `${COLORS.red}08`,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.red}20`,
                  padding: 24,
                  overflow: "hidden"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    marginBottom: 20,
                    padding: "12px 16px",
                    background: `linear-gradient(135deg, ${COLORS.red} 0%, ${COLORS.red}dd 100%)`,
                    borderRadius: 12,
                    color: COLORS.white
                  }}>
                    <div style={{ fontSize: 24 }}>🏆</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Long-term Goals (1-3 years)</div>
                  </div>
                  
                  {[
                    { goal: "Become a Senior Developer", progress: 25, deadline: "2026-01-01", status: "In Progress" },
                    { goal: "Lead a development team", progress: 10, deadline: "2026-06-01", status: "In Progress" },
                    { goal: "Contribute to open source", progress: 0, deadline: "2025-12-01", status: "Not Started" }
                  ].map((goal, idx) => (
                    <div key={idx} style={{ 
                      background: COLORS.white, 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 16,
                      border: `1px solid ${COLORS.red}30`,
                      boxShadow: "0 2px 8px rgba(231,111,81,0.08)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16, flex: 1 }}>{goal.goal}</div>
                        <span style={{
                          background: goal.status === "Completed" ? COLORS.teal : goal.status === "In Progress" ? COLORS.orange : COLORS.gray,
                          color: COLORS.white,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700
                        }}>
                          {goal.status}
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 600 }}>Progress</span>
                          <span style={{ fontSize: 12, color: COLORS.darkBlue, fontWeight: 700 }}>{goal.progress}%</span>
                        </div>
                        <div style={{ height: 6, background: COLORS.gray, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ 
                            width: `${goal.progress}%`, 
                            height: 6, 
                            background: COLORS.red,
                            borderRadius: 3,
                            transition: "width 0.3s"
                          }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7 }}>
                        📅 Due: {goal.deadline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Development & Learning Path */}
            <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 32, background: COLORS.orange, borderRadius: 4 }} />
                  <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Skills Development & Learning</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ 
                    background: COLORS.orange, 
                    color: COLORS.white, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "8px 16px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <span>📚</span> Browse Courses
                  </button>
                </div>
              </div>

              {/* Skills Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {[
                  { skill: "Technical Skills", icon: "💻", items: ["React", "Next.js", "TypeScript", "Node.js"], level: "Intermediate" },
                  { skill: "Soft Skills", icon: "🤝", items: ["Communication", "Leadership", "Problem Solving", "Teamwork"], level: "Advanced" },
                  { skill: "Domain Knowledge", icon: "🎯", items: ["Product Management", "UX Design", "Agile Methodologies"], level: "Beginner" }
                ].map((skillGroup, idx) => (
                  <div key={idx} style={{ 
                    background: `${COLORS.orange}08`,
                    borderRadius: 16,
                    border: `2px solid ${COLORS.orange}20`,
                    padding: 24,
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12, 
                      marginBottom: 16,
                      padding: "12px 16px",
                      background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.orange}dd 100%)`,
                      borderRadius: 12,
                      color: COLORS.white
                    }}>
                      <div style={{ fontSize: 24 }}>{skillGroup.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{skillGroup.skill}</div>
                    </div>
                    
                    <div style={{ marginBottom: 12 }}>
                      <span style={{
                        background: COLORS.orange,
                        color: COLORS.white,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        {skillGroup.level}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {skillGroup.items.map((item, itemIdx) => (
                        <div key={itemIdx} style={{ 
                          background: COLORS.white, 
                          borderRadius: 8, 
                          padding: "8px 12px",
                          border: `1px solid ${COLORS.orange}30`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span style={{ color: COLORS.darkBlue, fontWeight: 600, fontSize: 14 }}>{item}</span>
                          <button style={{
                            background: COLORS.orange,
                            color: COLORS.white,
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 11
                          }}>
                            Learn
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentorship & Networking */}
            <div style={{ background: COLORS.white, borderRadius: 18, boxShadow: CARD_SHADOW, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 32, background: COLORS.yellow, borderRadius: 4 }} />
                  <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.darkBlue }}>Mentorship & Networking</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ 
                    background: COLORS.yellow, 
                    color: COLORS.darkBlue, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "8px 16px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <span>🤝</span> Find Mentor
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                {/* Current Mentorship */}
                <div style={{ 
                  background: `${COLORS.teal}08`,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.teal}20`,
                  padding: 24
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    marginBottom: 16,
                    padding: "12px 16px",
                    background: `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.teal}dd 100%)`,
                    borderRadius: 12,
                    color: COLORS.white
                  }}>
                    <div style={{ fontSize: 24 }}>👨‍🏫</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Current Mentor</div>
                  </div>
                  
                  <div style={{ 
                    background: COLORS.white, 
                    borderRadius: 12, 
                    padding: 20,
                    border: `1px solid ${COLORS.teal}30`,
                    boxShadow: "0 2px 8px rgba(42,157,143,0.08)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: "50%", 
                        background: COLORS.teal, 
                        color: COLORS.white, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontWeight: 700, 
                        fontSize: 20 
                      }}>
                        JS
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16 }}>John Smith</div>
                        <div style={{ color: COLORS.darkBlue, opacity: 0.7, fontSize: 14 }}>Senior Software Engineer</div>
                      </div>
                    </div>
                    <div style={{ color: COLORS.darkBlue, fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
                      "Focus on building a strong foundation in React and TypeScript. Let's work on your leadership skills next month."
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7 }}>
                      📅 Next session: 2024-07-15 at 2:00 PM
                    </div>
                  </div>
                </div>

                {/* Networking Opportunities */}
                <div style={{ 
                  background: `${COLORS.yellow}08`,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.yellow}20`,
                  padding: 24
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    marginBottom: 16,
                    padding: "12px 16px",
                    background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.yellow}dd 100%)`,
                    borderRadius: 12,
                    color: COLORS.darkBlue
                  }}>
                    <div style={{ fontSize: 24 }}>🌐</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Networking Events</div>
                  </div>
                  
                  {[
                    { event: "Tech Meetup: React Best Practises", date: "2024-07-20", type: "In-person" },
                    { event: "Women in Tech Conference", date: "2024-08-05", type: "Virtual" },
                    { event: "Company Hackathon", date: "2024-08-15", type: "In-person" }
                  ].map((event, idx) => (
                    <div key={idx} style={{ 
                      background: COLORS.white, 
                      borderRadius: 12, 
                      padding: 16, 
                      marginBottom: 12,
                      border: `1px solid ${COLORS.yellow}30`,
                      boxShadow: "0 2px 8px rgba(233,196,106,0.08)"
                    }}>
                      <div style={{ fontWeight: 700, color: COLORS.darkBlue, fontSize: 16, marginBottom: 8 }}>{event.event}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7 }}>📅 {event.date}</span>
                        <span style={{
                          background: event.type === "In-person" ? COLORS.teal : COLORS.orange,
                          color: COLORS.white,
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 600
                        }}>
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== "Home" && activeTab !== "Growth" && (
          <div style={{ color: COLORS.darkBlue, opacity: 0.7 }}>
            This is the <b>{activeTab}</b> section. Here you'll see relevant widgets, lists, and actions for this role.
          </div>
        )}
      </main>
    </div>
  );
} 