'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types
interface Manager {
  id: number;
  name: string;
  email: string;
  department: string;
}

interface NewHire {
  id: number;
  name: string;
  email: string;
  role: string;
  start_date: string;
  manager_id: number;
  buddy_id: number | null;
  current_milestone: string;
  calculated_status: string;
}

interface Buddy {
  id: number;
  name: string;
  email: string;
  department: string;
}

// Colors
const COLORS = {
  white: '#FFFFFF',
  darkBlue: '#264653',
  teal: '#2A9D8F',
  orange: '#E9C46A',
  successGreen: '#2A9D8F',
  warningAmber: '#F4A261',
  errorRed: '#E76F51',
  yellow: '#F4A261',
  darkGray: '#6B7280',
  gray: '#F3F4F6',
  textGray: '#6B7280',
  borderGray: '#E5E7EB'
};

// API functions
const fetchManagers = async (): Promise<Manager[]> => {
  const response = await fetch('/api/managers', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch managers');
  return response.json();
};

const fetchNewHires = async (): Promise<NewHire[]> => {
  const response = await fetch('/api/new-hires', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch new hires');
  return response.json();
};

const fetchBuddies = async (): Promise<Buddy[]> => {
  const response = await fetch('/api/buddies', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch buddies');
  return response.json();
};

// Utility functions
const calculateActualProgress = (currentMilestone: string, status: string): number => {
  const milestoneOrder = ['day_1', 'week_1', 'day_30', 'day_60', 'day_90'];
  const milestoneIndex = milestoneOrder.indexOf(currentMilestone);
  return milestoneIndex >= 0 ? milestoneIndex + 1 : 0;
};

export default function AIInsightsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [insightType, setInsightType] = useState<'team' | 'individual' | 'strategic'>('team');
  
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

  // Generate AI insights
  const generateAIInsights = useCallback(async () => {
    if (managerNewHires.length === 0) return;
    
    setLoadingAI(true);
    try {
      const teamData = {
        totalNewHires: managerNewHires.length,
        overdueCount: managerNewHires.filter(hire => hire.calculated_status === 'overdue').length,
        inProgressCount: managerNewHires.filter(hire => hire.calculated_status === 'in_progress').length,
        completedCount: managerNewHires.filter(hire => hire.calculated_status === 'completed').length,
        notStartedCount: managerNewHires.filter(hire => hire.calculated_status === 'not_started').length,
        averageProgress: Math.round(managerNewHires.reduce((sum, hire) => sum + calculateActualProgress(hire.current_milestone, hire.calculated_status || ''), 0) / Math.max(managerNewHires.length, 1)),
        newHiresWithoutBuddies: managerNewHires.filter(hire => !hire.buddy_id).length,
        newHires: managerNewHires.map(hire => ({
          name: hire.name,
          role: hire.role,
          status: hire.calculated_status,
          currentMilestone: hire.current_milestone,
          startDate: hire.start_date,
          hasBuddy: !!hire.buddy_id
        }))
      };

      const response = await fetch(`/api/ai-onboarding?action=recommendations&teamData=${encodeURIComponent(JSON.stringify(teamData))}&type=${insightType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAiRecommendations(data);
      } else {
        console.error('Failed to fetch AI insights:', response.status);
        setError('Failed to generate AI insights. Please try again.');
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  }, [managerNewHires, insightType]);

  if (!isLoaded || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: `linear-gradient(135deg, ${COLORS.teal}15 0%, ${COLORS.orange}15 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: COLORS.darkBlue, marginBottom: 8 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  if (!currentManager) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: `linear-gradient(135deg, ${COLORS.teal}15 0%, ${COLORS.orange}15 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: COLORS.darkBlue, marginBottom: 8 }}>Manager not found</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${COLORS.teal}15 0%, ${COLORS.orange}15 100%)`,
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        background: COLORS.white,
        padding: '1.5rem',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue, margin: 0 }}>
            AI Insights & Recommendations
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textGray, margin: '0.5rem 0 0 0' }}>
            Get personalised AI-powered insights for your team
          </p>
        </div>
        <Link href="/app/dashboard/manager" style={{
          background: COLORS.darkBlue,
          color: COLORS.white,
          border: 'none',
          borderRadius: 8,
          padding: '0.75rem 1.5rem',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'none',
          transition: 'all 0.2s'
        }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Control Panel */}
        <div style={{ 
          background: COLORS.white, 
          borderRadius: 12, 
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, marginBottom: '1rem' }}>
            Generate Insights
          </h3>
          
          {/* Insight Type Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.darkBlue, marginBottom: '0.5rem', display: 'block' }}>
              Insight Type
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => setInsightType('team')}
                style={{
                  background: insightType === 'team' ? COLORS.teal : COLORS.white,
                  color: insightType === 'team' ? COLORS.white : COLORS.darkBlue,
                  border: `1px solid ${insightType === 'team' ? COLORS.teal : COLORS.borderGray}`,
                  borderRadius: 6,
                  padding: '0.75rem',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                🎯 Team Performance
              </button>
              <button
                onClick={() => setInsightType('individual')}
                style={{
                  background: insightType === 'individual' ? COLORS.teal : COLORS.white,
                  color: insightType === 'individual' ? COLORS.white : COLORS.darkBlue,
                  border: `1px solid ${insightType === 'individual' ? COLORS.teal : COLORS.borderGray}`,
                  borderRadius: 6,
                  padding: '0.75rem',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                👤 Individual Focus
              </button>
              <button
                onClick={() => setInsightType('strategic')}
                style={{
                  background: insightType === 'strategic' ? COLORS.teal : COLORS.white,
                  color: insightType === 'strategic' ? COLORS.white : COLORS.darkBlue,
                  border: `1px solid ${insightType === 'strategic' ? COLORS.teal : COLORS.borderGray}`,
                  borderRadius: 6,
                  padding: '0.75rem',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                📊 Strategic Planning
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateAIInsights}
            disabled={loadingAI || managerNewHires.length === 0}
            style={{
              background: loadingAI || managerNewHires.length === 0 ? COLORS.gray : COLORS.darkBlue,
              color: COLORS.white,
              border: 'none',
              borderRadius: 8,
              padding: '1rem',
              fontSize: 16,
              fontWeight: 600,
              cursor: loadingAI || managerNewHires.length === 0 ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            {loadingAI ? 'Generating Insights...' : 'Generate AI Insights'}
          </button>

          {managerNewHires.length === 0 && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: `${COLORS.orange}10`, 
              borderRadius: 6,
              fontSize: 13,
              color: COLORS.darkBlue
            }}>
              No team members found. Add new hires to generate insights.
            </div>
          )}

          {/* Team Overview */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${COLORS.borderGray}` }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, marginBottom: '0.75rem' }}>
              Team Overview
            </h4>
            <div style={{ fontSize: 13, color: COLORS.textGray, lineHeight: 1.5 }}>
              <div>Total Members: {managerNewHires.length}</div>
              <div>In Progress: {managerNewHires.filter(hire => hire.calculated_status === 'in_progress').length}</div>
              <div>Not Started: {managerNewHires.filter(hire => hire.calculated_status === 'not_started').length}</div>
              <div>Need Buddy: {managerNewHires.filter(hire => !hire.buddy_id).length}</div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{ 
          background: COLORS.white, 
          borderRadius: 12, 
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: '400px'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.darkBlue, marginBottom: '1rem' }}>
            AI Insights Results
          </h3>

          {error && (
            <div style={{ 
              padding: '1rem', 
              background: `${COLORS.errorRed}10`, 
              borderRadius: 8,
              border: `1px solid ${COLORS.errorRed}30`,
              color: COLORS.errorRed,
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {loadingAI ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: 18, color: COLORS.darkBlue, marginBottom: '1rem' }}>
                Generating AI insights...
              </div>
              <div style={{ fontSize: 14, color: COLORS.textGray }}>
                This may take 15-30 seconds as we analyse your team data.
              </div>
            </div>
          ) : aiRecommendations ? (
            <div>
              {/* Insights */}
              {aiRecommendations.insights && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, marginBottom: '1rem' }}>
                    Key Insights
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {aiRecommendations.insights.map((insight: string, index: number) => (
                      <div key={index} style={{ 
                        padding: '1rem', 
                        background: `${COLORS.teal}10`, 
                        borderRadius: 8,
                        borderLeft: `3px solid ${COLORS.teal}`,
                        fontSize: 14,
                        color: COLORS.darkBlue
                      }}>
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {aiRecommendations.actions && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, marginBottom: '1rem' }}>
                    Recommended Actions
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {aiRecommendations.actions.map((action: string, index: number) => (
                      <div key={index} style={{ 
                        padding: '1rem', 
                        background: `${COLORS.orange}10`, 
                        borderRadius: 8,
                        borderLeft: `3px solid ${COLORS.orange}`,
                        fontSize: 14,
                        color: COLORS.darkBlue
                      }}>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trends */}
              {aiRecommendations.trends && (
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: COLORS.darkBlue, marginBottom: '1rem' }}>
                    Trends & Patterns
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {aiRecommendations.trends.map((trend: string, index: number) => (
                      <div key={index} style={{ 
                        padding: '1rem', 
                        background: `${COLORS.successGreen}10`, 
                        borderRadius: 8,
                        borderLeft: `3px solid ${COLORS.successGreen}`,
                        fontSize: 14,
                        color: COLORS.darkBlue
                      }}>
                        {trend}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: 18, color: COLORS.darkBlue, marginBottom: '1rem' }}>
                Ready to Generate Insights
              </div>
              <div style={{ fontSize: 14, color: COLORS.textGray }}>
                Select an insight type and click "Generate AI Insights" to get personalised recommendations for your team.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 