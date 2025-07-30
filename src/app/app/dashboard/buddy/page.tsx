"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { fetchBuddies, fetchNewHires, fetchOnboardingPlan, type Buddy, type NewHire, calculateOnboardingProgress, calculateActualProgressFromTasks, getCurrentMilestoneFromTasks, calculateScheduledProgress, calculateScheduledProgressForFuture, calculateWorkingDaysUntilStart, getStatusColor, formatDate, getInitials } from "@/lib/api";

const COLORS = {
  darkBlue: "#264653",
  teal: "#2A9D8F",
  yellow: "#E9C46A",
  orange: "#F4A261",
  red: "#E76F51",
  white: "#fff",
  gray: "#f6f6f6",
};
const GRADIENT_BG = "linear-gradient(135deg, #2A9D8F 0%, #264653 100%)";
const CARD_SHADOW = "0 4px 24px rgba(38,70,83,0.10)";
const CARD_RADIUS = 28;

export default function BuddyDashboardPage() {
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [onboardingPlans, setOnboardingPlans] = useState<{[key: number]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [buddiesData, newHiresData] = await Promise.all([
          fetchBuddies(),
          fetchNewHires()
        ]);
        setBuddies(buddiesData);
        setNewHires(newHiresData);

        // Fetch onboarding plans for assigned new hires
        const currentBuddy = buddiesData[0]; // For demo purposes
        if (currentBuddy) {
          const assignedNewHires = newHiresData.filter(hire => hire.buddy_id === currentBuddy.id);
          const plans: {[key: number]: any} = {};
          
          for (const hire of assignedNewHires) {
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

    fetchData();
  }, []);

  // For demo purposes, let's assume the current user is the first buddy
  const currentBuddy = buddies[0];
  const assignedNewHires = newHires.filter(hire => hire.buddy?.id === currentBuddy?.id);

  if (loading) {
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
    <div style={{ fontFamily: "Ubuntu, Arial, sans-serif", background: GRADIENT_BG, minHeight: "100vh", paddingBottom: 40 }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.85)", padding: "1.5rem 2rem 1rem 2rem", boxShadow: "0 2px 16px rgba(38,70,83,0.10)", borderRadius: `0 0 32px 32px`, marginBottom: "2.5rem", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image src="/guidium-logo.png" alt="Guidium Logo" width={90} height={90} style={{ display: "block" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: COLORS.darkBlue, fontWeight: 600, fontSize: 16 }}>
            Welcome, {currentBuddy?.name || 'Buddy'}!
          </span>
          <span style={{ 
            background: COLORS.teal, 
            color: COLORS.white, 
            borderRadius: "50%", 
            width: 48, 
            height: 48, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontWeight: 700, 
            fontSize: 20 
          }}>
            {currentBuddy ? getInitials(currentBuddy.name) : 'B'}
          </span>
        </div>
      </nav>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
        {/* Dashboard Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", marginBottom: "2.5rem" }}>
          <div style={{ 
            background: COLORS.white, 
            borderRadius: CARD_RADIUS, 
            boxShadow: CARD_SHADOW, 
            padding: 32,
            border: `3px solid ${COLORS.teal}`
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.teal, marginBottom: 10 }}>
              Assigned New Hires
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.darkBlue }}>
              {assignedNewHires.length}
            </div>
          </div>
          
          <div style={{ 
            background: COLORS.white, 
            borderRadius: CARD_RADIUS, 
            boxShadow: CARD_SHADOW, 
            padding: 32,
            border: `3px solid ${COLORS.orange}`
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.orange, marginBottom: 10 }}>
              In Progress
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.darkBlue }}>
              {assignedNewHires.filter(hire => hire.calculated_status === 'in_progress').length}
            </div>
          </div>
          
          <div style={{ 
            background: COLORS.white, 
            borderRadius: CARD_RADIUS, 
            boxShadow: CARD_SHADOW, 
            padding: 32,
            border: `3px solid ${COLORS.red}`
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.red, marginBottom: 10 }}>
              Need Attention
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.darkBlue }}>
              {assignedNewHires.filter(hire => hire.calculated_status === 'overdue').length}
            </div>
          </div>
        </div>

        {/* Assigned New Hires Section */}
        <div style={{ background: COLORS.white, borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, padding: 40 }}>
          <h2 style={{ color: COLORS.darkBlue, fontWeight: 800, fontSize: 28, marginBottom: 24 }}>
            Your Assigned New Hires
          </h2>
          
          {assignedNewHires.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.darkBlue, opacity: 0.7 }}>
              <div style={{ fontSize: 24, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No new hires assigned yet</div>
              <div style={{ fontSize: 16 }}>You'll see your assigned new hires here once they're assigned to you.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
              {assignedNewHires.map((hire) => (
                <div key={hire.id} style={{ 
                  background: `${getStatusColor(hire.calculated_status)}08`, 
                  borderRadius: 16, 
                  padding: 24,
                  border: `2px solid ${getStatusColor(hire.calculated_status)}20`,
                  boxShadow: "0 4px 16px rgba(38,70,83,0.08)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div style={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: "50%", 
                      background: getStatusColor(hire.calculated_status), 
                      color: COLORS.white, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontWeight: 700, 
                      fontSize: 20 
                    }}>
                      {getInitials(hire.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: COLORS.darkBlue, fontSize: 18, marginBottom: 4 }}>{hire.name}</div>
                      <div style={{ color: COLORS.darkBlue, opacity: 0.7, fontSize: 14, marginBottom: 4 }}>{hire.role || 'Role not set'}</div>
                      <div style={{ color: COLORS.darkBlue, opacity: 0.7, fontSize: 14 }}>Start Date: {formatDate(hire.start_date)}</div>
                    </div>
                    <span style={{
                      background: getStatusColor(hire.calculated_status),
                      color: COLORS.white,
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase"
                    }}>
                      {hire.calculated_status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.darkBlue, fontWeight: 600 }}>Onboarding Progress</span>
                      <span style={{ fontSize: 13, color: COLORS.darkBlue, fontWeight: 700 }}>
                        {(() => {
                          if (onboardingPlans[hire.id]) {
                            const actualProgress = calculateActualProgressFromTasks(onboardingPlans[hire.id]);
                            return `${Math.round((actualProgress / 5) * 100)}%`;
                          }
                          return `${calculateOnboardingProgress(hire.workdays_since_start || 0, hire.calculated_status || '')}%`;
                        })()}
                      </span>
                    </div>
                    <div style={{ height: 8, background: COLORS.gray, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ 
                        width: `${(() => {
                          if (onboardingPlans[hire.id]) {
                            const actualProgress = calculateActualProgressFromTasks(onboardingPlans[hire.id]);
                            return (actualProgress / 5) * 100;
                          }
                          return calculateOnboardingProgress(hire.workdays_since_start || 0, hire.calculated_status || '');
                        })()}%`, 
                        height: 8, 
                        background: getStatusColor(hire.calculated_status),
                        borderRadius: 4,
                        transition: "width 0.3s"
                      }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7, marginBottom: 4 }}>Start Date</div>
                      <div style={{ fontSize: 14, color: COLORS.darkBlue, fontWeight: 600 }}>{formatDate(hire.start_date)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.darkBlue, opacity: 0.7, marginBottom: 4 }}>Manager</div>
                      <div style={{ fontSize: 14, color: COLORS.darkBlue, fontWeight: 600 }}>
                        {hire.manager ? hire.manager.name : 'Not Assigned'}
                      </div>
                    </div>
                  </div>

                  <button style={{
                    background: COLORS.teal,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    width: "100%",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(42,157,143,0.2)"
                  }}>
                    Support New Hire
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 