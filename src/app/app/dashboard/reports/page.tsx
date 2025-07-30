"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { fetchManagers, fetchNewHires, fetchBuddies, type Manager, type NewHire, type Buddy, calculateScheduledProgress, calculateActualProgress, getStatusColor, formatDate } from "@/lib/api";

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

export default function ReportsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Find the current manager based on authenticated user's email
  const currentManager = managers.find(manager => manager.email === user?.primaryEmailAddress?.emailAddress);
  const managerNewHires = newHires.filter(hire => hire.manager_id === currentManager?.id);

  // Fetch data on component mount
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

  // Calculate report statistics
  const totalNewHires = managerNewHires.length;
  const overdueItems = managerNewHires.filter(hire => hire.calculated_status === 'overdue').length;
  const inProgressItems = managerNewHires.filter(hire => hire.calculated_status === 'in_progress').length;
  const completedItems = managerNewHires.filter(hire => hire.calculated_status === 'completed').length;
  const notStartedItems = managerNewHires.filter(hire => hire.calculated_status === 'not_started').length;

  const averageProgress = totalNewHires > 0 
    ? Math.round(managerNewHires.reduce((sum, hire) => sum + calculateActualProgress(hire.current_milestone, hire.calculated_status || ''), 0) / totalNewHires)
    : 0;

  // Function to generate and download PDF
  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      // Create PDF content
      const pdfContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #264653; margin-bottom: 10px; }
              .subtitle { font-size: 16px; color: #6B7280; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 18px; font-weight: bold; color: #264653; margin-bottom: 15px; border-bottom: 2px solid #2A9D8F; padding-bottom: 5px; }
              .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
              .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #2A9D8F; }
              .stat-value { font-size: 24px; font-weight: bold; color: #264653; }
              .stat-label { font-size: 12px; color: #6B7280; margin-top: 5px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .table th { background: #2A9D8F; color: white; font-weight: bold; }
              .table tr:nth-child(even) { background: #f9f9f9; }
              .status-overdue { color: #E76F51; font-weight: bold; }
              .status-in-progress { color: #F4A261; font-weight: bold; }
              .status-completed { color: #2A9D8F; font-weight: bold; }
              .status-not-started { color: #6B7280; font-weight: bold; }
              .callouts { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-top: 20px; }
              .callout-title { font-weight: bold; color: #856404; margin-bottom: 10px; }
              .callout-item { margin-bottom: 8px; color: #856404; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">New Hires Onboarding Report</div>
              <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-GB')} for ${currentManager?.name || 'Manager'}</div>
            </div>

            <div class="section">
              <div class="section-title">Executive Summary</div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${totalNewHires}</div>
                  <div class="stat-label">Total New Hires</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${averageProgress}/5</div>
                  <div class="stat-label">Average Progress</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${completedItems}</div>
                  <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${overdueItems}</div>
                  <div class="stat-label">Overdue</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Detailed Progress Overview</div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Start Date</th>
                    <th>Current Milestone</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Buddy</th>
                  </tr>
                </thead>
                <tbody>
                                     ${managerNewHires.map(hire => {
                     const buddy = buddies.find(b => b.id === hire.buddy_id);
                     const scheduledProgress = calculateScheduledProgress(hire.workdays_since_start);
                     const actualProgress = calculateActualProgress(hire.current_milestone, hire.calculated_status || '');
                     const statusClass = hire.calculated_status === 'overdue' ? 'status-overdue' : 
                                       hire.calculated_status === 'in_progress' ? 'status-in-progress' :
                                       hire.calculated_status === 'completed' ? 'status-completed' : 'status-not-started';
                     
                     return `
                       <tr>
                         <td>${hire.name}</td>
                         <td>${hire.role || 'N/A'}</td>
                         <td>${formatDate(hire.start_date)}</td>
                         <td>${hire.current_milestone || 'N/A'}</td>
                         <td>${actualProgress}/${scheduledProgress}</td>
                         <td class="${statusClass}">${hire.calculated_status?.toUpperCase() || 'N/A'}</td>
                         <td>${buddy ? `${buddy.name} ${buddy["surname (s)"] || ''}` : 'Not Assigned'}</td>
                       </tr>
                     `;
                   }).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Key Callouts & Recommendations</div>
              <div class="callouts">
                ${overdueItems > 0 ? `<div class="callout-item">⚠️ ${overdueItems} new hire(s) are overdue and require immediate attention</div>` : ''}
                ${notStartedItems > 0 ? `<div class="callout-item">📅 ${notStartedItems} new hire(s) haven't started their onboarding yet</div>` : ''}
                ${managerNewHires.filter(hire => !hire.buddy_id).length > 0 ? `<div class="callout-item">👥 ${managerNewHires.filter(hire => !hire.buddy_id).length} new hire(s) need buddy assignments</div>` : ''}
                ${averageProgress < 3 ? `<div class="callout-item">📈 Team average progress is below target (${averageProgress}/5). Consider additional support.</div>` : ''}
                ${completedItems > 0 ? `<div class="callout-item">✅ ${completedItems} new hire(s) have completed their onboarding successfully</div>` : ''}
                ${inProgressItems > 0 ? `<div class="callout-item">🔄 ${inProgressItems} new hire(s) are actively progressing through their onboarding</div>` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Next Steps</div>
              <ul>
                ${overdueItems > 0 ? '<li>Schedule 1:1 meetings with overdue new hires to identify blockers</li>' : ''}
                ${managerNewHires.filter(hire => !hire.buddy_id).length > 0 ? '<li>Assign buddies to new hires without mentors</li>' : ''}
                ${notStartedItems > 0 ? '<li>Reach out to new hires who haven\'t started to ensure they have access</li>' : ''}
                <li>Review and update onboarding materials based on feedback</li>
                <li>Plan team-building activities to strengthen relationships</li>
              </ul>
            </div>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `onboarding-report-${currentManager?.name || 'manager'}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
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
        Loading reports...
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
        Please sign in to access the reports.
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

  return (
    <div style={{
      fontFamily: "Ubuntu, Arial, sans-serif",
      background: GRADIENT_BG,
      minHeight: "100vh",
      padding: "2rem"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem"
      }}>
        <div>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "700",
            color: COLORS.darkBlue,
            margin: "0 0 8px 0"
          }}>
            Onboarding Reports
          </h1>
          <p style={{
            fontSize: "16px",
            color: COLORS.textGray,
            margin: 0
          }}>
            Generate comprehensive reports for {currentManager.name}'s team
          </p>
        </div>
        <button
          onClick={() => router.push('/app/dashboard/manager')}
          style={{
            background: COLORS.darkBlue,
            color: COLORS.white,
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
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
          ← Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        background: COLORS.white,
        borderRadius: 16,
        padding: "2rem",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        border: `1px solid ${COLORS.borderGray}`
      }}>
        {/* Summary Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          <div style={{
            background: COLORS.teal,
            color: COLORS.white,
            padding: "1.5rem",
            borderRadius: 12,
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
              {totalNewHires}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Total New Hires</div>
          </div>
          
          <div style={{
            background: COLORS.successGreen,
            color: COLORS.white,
            padding: "1.5rem",
            borderRadius: 12,
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
              {completedItems}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Completed</div>
          </div>
          
          <div style={{
            background: COLORS.warningAmber,
            color: COLORS.white,
            padding: "1.5rem",
            borderRadius: 12,
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
              {inProgressItems}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>In Progress</div>
          </div>
          
          <div style={{
            background: COLORS.errorRed,
            color: COLORS.white,
            padding: "1.5rem",
            borderRadius: 12,
            textAlign: "center"
          }}>
            <div style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
              {overdueItems}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Overdue</div>
          </div>
        </div>

        {/* Generate Report Button */}
        <div style={{
          textAlign: "center",
          marginBottom: "2rem"
        }}>
          <button
            onClick={generatePDF}
            disabled={generatingPDF}
            style={{
              background: generatingPDF ? COLORS.gray : COLORS.darkBlue,
              color: COLORS.white,
              border: "none",
              borderRadius: 12,
              padding: "16px 32px",
              fontWeight: "600",
              fontSize: "16px",
              cursor: generatingPDF ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(38,70,83,0.2)",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px"
            }}
            onMouseEnter={(e) => {
              if (!generatingPDF) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(38,70,83,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!generatingPDF) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(38,70,83,0.2)";
              }
            }}
          >
            {generatingPDF ? (
              <>
                <div style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid transparent",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Generating Report...
              </>
            ) : (
              <>
                📊 Generate Onboarding Report
              </>
            )}
          </button>
        </div>

        {/* Report Preview */}
        <div style={{
          background: COLORS.lightGray,
          borderRadius: 12,
          padding: "1.5rem",
          border: `1px solid ${COLORS.borderGray}`
        }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: COLORS.darkBlue,
            margin: "0 0 1rem 0"
          }}>
            Report Preview
          </h3>
          <p style={{
            fontSize: "14px",
            color: COLORS.textGray,
            lineHeight: 1.6,
            margin: 0
          }}>
            The generated report will include:
          </p>
          <ul style={{
            fontSize: "14px",
            color: COLORS.textGray,
            lineHeight: 1.6,
            margin: "1rem 0 0 0",
            paddingLeft: "1.5rem"
          }}>
            <li>Executive summary with key metrics</li>
            <li>Detailed progress overview for each new hire</li>
            <li>Current milestone and status information</li>
            <li>Buddy assignments and contact details</li>
            <li>Key callouts and recommendations</li>
            <li>Next steps and action items</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 