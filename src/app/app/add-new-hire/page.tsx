'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { fetchManagers, type Manager } from "@/lib/api";

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
const NAV_RADIUS = 32;
const NAV_BG = "rgba(255,255,255,0.85)";

export default function AddNewHireForm() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    'surname(s)': '',
    email: '',
    start_date: '',
    manager_id: '',
    role: '',
    buddy_id: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [buddies, setBuddies] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loadingBuddies, setLoadingBuddies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'idle' | 'adding' | 'generating' | 'complete'>('idle');

  // Find current manager
  const currentManager = managers.find(manager => manager.email === user?.primaryEmailAddress?.emailAddress);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingManagers(true);
      setLoadingBuddies(true);
      try {
        const [managersRes, buddiesRes] = await Promise.all([
          fetch('http://localhost:3000/api/managers'),
          fetch('http://localhost:3000/api/buddies')
        ]);
        
        const managersData = await managersRes.json();
        const buddiesData = await buddiesRes.json();
        
        if (managersRes.ok) setManagers(managersData);
        if (buddiesRes.ok) setBuddies(buddiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoadingManagers(false);
      setLoadingBuddies(false);
    };
    
    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = COLORS.teal;
    e.target.style.boxShadow = `0 0 0 3px ${COLORS.teal}20`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = COLORS.gray;
    e.target.style.boxShadow = "none";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStep('adding');
    setMessage('');

    try {
      // Prepare the payload, excluding buddy_id if it's empty
      const payload: any = {
        ...form,
        manager_id: currentManager?.id || form.manager_id
      };
      
      // Remove buddy_id if it's empty to make it truly optional
      if (!payload.buddy_id || payload.buddy_id === '') {
        delete payload.buddy_id;
      }

      // Step 1: Add the new hire
      setMessage('Adding new hire to the system...');
      const res = await fetch('http://localhost:3000/api/new-hires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        // Step 2: Generate AI onboarding plan
        setMessage('Generating personalised AI onboarding plan... This may take up to 2 minutes.');
        setSubmissionStep('generating');
        
        // Add timeout to AI plan generation fetch
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 120000) // 2 minute timeout
        );
        const planPromise = fetch('http://localhost:3000/api/onboarding-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_hire_id: result.data[0].id,
            role: form.role,
            start_date: form.start_date,
            new_hire_name: `${form.name} ${form['surname(s)']}`
          })
        });
        
        try {
          const planRes = await Promise.race([planPromise, timeoutPromise]) as Response;
          
          if (planRes.ok) {
            const planResult = await planRes.json();
            console.log('✅ AI onboarding plan created:', planResult);
            setSubmissionStep('complete');
            setMessageType('success');
            setMessage('✅ New hire added successfully! AI-powered onboarding plan generated.');
          } else {
            const planError = await planRes.json(); // Get error details from response
            console.error('AI plan generation failed:', planError);
            setSubmissionStep('complete');
            setMessageType('success');
            setMessage('✅ New hire added successfully! (AI plan generation failed - will retry later)');
          }
        } catch (timeoutError) {
          console.error('AI plan generation timed out:', timeoutError);
          
          // Check if the plan was actually created despite the timeout
          try {
            const verifyResponse = await fetch(`http://localhost:3000/api/onboarding-plans?new_hire_id=${result.data[0].id}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.plan) {
                console.log('✅ Plan was actually created despite timeout');
                setSubmissionStep('complete');
                setMessageType('success');
                setMessage('✅ New hire added successfully! AI-powered onboarding plan generated.');
              } else {
                setSubmissionStep('complete');
                setMessageType('success');
                setMessage('✅ New hire added successfully! (AI plan generation is still processing in the background)');
              }
            } else {
              setSubmissionStep('complete');
              setMessageType('success');
              setMessage('✅ New hire added successfully! (AI plan generation is still processing in the background)');
            }
          } catch (verifyError) {
            console.error('Error verifying plan creation:', verifyError);
            setSubmissionStep('complete');
            setMessageType('success');
            setMessage('✅ New hire added successfully! (AI plan generation is still processing in the background)');
          }
        }

        setForm({
          name: '',
          'surname(s)': '',
          email: '',
          start_date: '',
          manager_id: '',
          role: '',
          buddy_id: ''
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/app/dashboard/manager');
        }, 3000);
      } else {
        setSubmissionStep('idle');
        setMessageType('error');
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setSubmissionStep('idle');
      setMessageType('error');
      setMessage('Network error: Could not submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
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
        Loading...
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
        Please sign in to access this page.
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
      paddingBottom: 40,
    }}>
      {/* Top Nav */}
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
          <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.darkBlue }}>
            Add New Hire
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/app/dashboard/manager" style={{ textDecoration: 'none' }}>
            <button style={{
              background: COLORS.teal,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.2s"
            }}>
              Back to Dashboard
            </button>
          </Link>
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
            fontSize: 24,
            boxShadow: "0 2px 8px rgba(42,157,143,0.18)",
          }}>
            {currentManager?.name?.charAt(0) || 'M'}
          </span>
          <SignOutButton>
            <button style={{
              background: COLORS.red,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.2s"
            }}>
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "0 2rem" }}>
        {/* Main Form Card */}
        <div style={{
          background: COLORS.white,
          borderRadius: CARD_RADIUS,
          padding: CARD_PADDING,
          boxShadow: CARD_SHADOW,
          maxWidth: 600,
          width: "100%",
          border: `1px solid ${COLORS.borderGray}`
        }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.darkBlue,
            marginBottom: 32,
            textAlign: "center"
          }}>
            Add a new hire to the team.
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Name Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.darkBlue,
                  marginBottom: 8
                }}>
                  First Name *
                </label>
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 8,
                    fontSize: 16,
                    color: COLORS.darkBlue,
                    background: COLORS.white,
                    transition: "border-color 0.2s"
                  }}
                  placeholder="Enter first name"
      />
              </div>
              <div>
                <label style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.darkBlue,
                  marginBottom: 8
                }}>
                  Surname *
                </label>
      <input
        type="text"
        name="surname(s)"
        value={form['surname(s)']}
        onChange={handleChange}
        required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${COLORS.borderGray}`,
                    borderRadius: 8,
                    fontSize: 16,
                    color: COLORS.darkBlue,
                    background: COLORS.white,
                    transition: "border-color 0.2s"
                  }}
                  placeholder="Enter surname"
      />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.darkBlue,
                marginBottom: 8
              }}>
                Email Address *
              </label>
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${COLORS.borderGray}`,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.darkBlue,
                  background: COLORS.white,
                  transition: "border-color 0.2s"
                }}
                placeholder="Enter email address"
              />
            </div>

            {/* Role Field */}
            <div>
              <label style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.darkBlue,
                marginBottom: 8
              }}>
                Role *
              </label>
              <input
                type="text"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${COLORS.borderGray}`,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.darkBlue,
                  background: COLORS.white,
                  transition: "border-color 0.2s"
                }}
                placeholder="Enter role (e.g., Software Engineer)"
      />
            </div>

            {/* Start Date Field */}
            <div>
              <label style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.darkBlue,
                marginBottom: 8
              }}>
                Start Date *
              </label>
      <input
        type="date"
        name="start_date"
        value={form.start_date}
        onChange={handleChange}
        required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${COLORS.borderGray}`,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.darkBlue,
                  background: COLORS.white,
                  transition: "border-color 0.2s"
                }}
              />
            </div>

            {/* Buddy Selection */}
            <div>
              <label style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.darkBlue,
                marginBottom: 8
              }}>
                Assign Buddy (Optional)
              </label>
      <select
                name="buddy_id"
                value={form.buddy_id || ""}
        onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${COLORS.borderGray}`,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.darkBlue,
                  background: COLORS.white,
                  transition: "border-color 0.2s"
                }}
              >
                <option value="">Select a buddy (optional)</option>
                {buddies.sort((a, b) => `${a.name} ${a["surname (s)"] || ""}`.localeCompare(`${b.name} ${b["surname (s)"] || ""}`)).map((buddy) => (
                  <option key={buddy.id} value={buddy.id}>
                    {buddy.name} {buddy["surname (s)"] || ""}
            </option>
                ))}
      </select>
            </div>

            {/* Progress Indicator */}
            {isSubmitting && (
              <div style={{
                marginBottom: "16px",
                padding: "16px",
                background: `${COLORS.teal}10`,
                borderRadius: "12px",
                border: `1px solid ${COLORS.teal}30`
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px"
                }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    border: `2px solid ${COLORS.teal}`,
                    borderTop: `2px solid transparent`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }} />
                  <span style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: COLORS.teal
                  }}>
                    {submissionStep === 'adding' && "Step 1: Adding new hire to system"}
                    {submissionStep === 'generating' && "Step 2: Generating AI onboarding plan"}
                    {submissionStep === 'complete' && "Step 3: Completing setup"}
                  </span>
                </div>
                <div style={{
                  fontSize: "12px",
                  color: COLORS.darkGray,
                  lineHeight: "1.4"
                }}>
                  {submissionStep === 'adding' && "Adding new hire to the system..."}
                  {submissionStep === 'generating' && "AI is creating a personalised onboarding plan tailored to their role. This may take up to 2 minutes."}
                  {submissionStep === 'complete' && "Finalising setup and preparing to redirect to dashboard..."}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: COLORS.teal,
                color: COLORS.white,
                border: "none",
                borderRadius: 12,
                padding: "16px 24px",
                fontSize: 16,
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(42,157,143,0.2)",
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {isSubmitting && (
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: `2px solid ${COLORS.white}`,
                  borderTop: `2px solid transparent`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
              )}
              {isSubmitting 
                ? submissionStep === 'adding' 
                  ? "Adding New Hire..." 
                  : submissionStep === 'generating'
                  ? "Generating AI Plan..."
                  : "Completing..."
                : "Add New Hire"
              }
      </button>
    </form>

            {/* Message */}
            {message && (
              <div style={{
                marginTop: "1.5rem",
                padding: "16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
                background: messageType === 'success' ? `${COLORS.teal}15` : `${COLORS.red}15`,
                color: messageType === 'success' ? COLORS.teal : COLORS.red,
                border: `1px solid ${messageType === 'success' ? COLORS.teal : COLORS.teal}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}>
                {messageType === 'success' && (
                  <span style={{ fontSize: "16px" }}>✅</span>
                )}
                {messageType === 'error' && (
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                )}
                <span>{message}</span>
              </div>
            )}
        </div>
      </main>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input::placeholder {
          color: #264653 !important;
          opacity: 0.7 !important;
        }
        
        input[type="date"] {
          color: #264653 !important;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.3);
        }
        
        select {
          color: #264653 !important;
        }
        
        select option {
          color: #264653 !important;
        }
        
        input[name="role"] {
          color: #264653 !important;
        }
        input, select, textarea {
          color: #264653 !important;
        }
      `}</style>
    </div>
  );
}