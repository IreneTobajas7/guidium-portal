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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => { setMounted(true); }, []);

  // Auto-redirect based on user email
  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      
      if (email) {
        // Redirect based on email
        if (email === "irenetobajas@gmail.com") {
          router.push("/app/dashboard/manager");
        } else if (email.includes("buddy") || email.includes("jimmy") || email.includes("karl") || email.includes("leonard")) {
          router.push("/app/dashboard/buddy");
        } else {
          // Default to employee dashboard for other emails
          router.push("/app/dashboard/employee");
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
        Please sign in to access the dashboard.
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
      Redirecting to your dashboard...
        </div>
  );
}