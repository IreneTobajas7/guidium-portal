"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

// Color palette
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

// Role detection based on email patterns
const getRoleFromEmail = (email: string): 'manager' | 'buddy' | 'employee' => {
  const emailLower = email.toLowerCase();
  
  // Manager detection
  if (emailLower === "irenetobajas@gmail.com" || 
      emailLower.includes("manager") || 
      emailLower.includes("admin")) {
    return 'manager';
  }
  
  // Buddy detection
  if (emailLower.includes("buddy") || 
      emailLower.includes("jimmy") || 
      emailLower.includes("karl") || 
      emailLower.includes("leonard") ||
      emailLower.includes("mentor")) {
    return 'buddy';
  }
  
  // Default to employee
  return 'employee';
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [role, setRole] = useState<'manager' | 'buddy' | 'employee' | null>(null);
  
  React.useEffect(() => { setMounted(true); }, []);

  // Auto-redirect based on user email
  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      
      if (email) {
        const detectedRole = getRoleFromEmail(email);
        setRole(detectedRole);
        
        // Redirect based on detected role
        switch (detectedRole) {
          case 'manager':
            router.push("/app/dashboard/manager");
            break;
          case 'buddy':
            router.push("/app/dashboard/buddy");
            break;
          case 'employee':
            // For employees, we need to find their specific ID
            // For demo purposes, redirect to a sample employee
            router.push("/app/dashboard/employee/18"); // Sample employee ID
            break;
        }
      }
    }
  }, [isLoaded, user, router]);

  if (!mounted || !isLoaded) {
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
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔄</div>
          <div>Loading your dashboard...</div>
        </div>
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
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔒</div>
          <div>Please sign in to access the dashboard.</div>
        </div>
      </div>
    );
  }

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
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "16px" }}>
          {role === 'manager' && '👥'}
          {role === 'buddy' && '🤝'}
          {role === 'employee' && '👤'}
          {!role && '🔄'}
        </div>
        <div>
          {role ? `Redirecting to your ${role} dashboard...` : 'Detecting your role...'}
        </div>
        <div style={{ 
          fontSize: "14px", 
          marginTop: "16px", 
          opacity: 0.8,
          maxWidth: "400px"
        }}>
          Email: {user.primaryEmailAddress?.emailAddress}
        </div>
      </div>
    </div>
  );
}