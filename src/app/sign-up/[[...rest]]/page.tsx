'use client';
import { SignUp } from '@clerk/nextjs';
import { GuidiumLogo } from "@/components/guidium-logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  return (
    <>
      <style jsx global>{`
        .cl-formButtonPrimary:hover {
          background-color: #264653 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 16px rgba(42, 157, 143, 0.4) !important;
        }
        .cl-formFieldInput:focus {
          border-color: #2A9D8F !important;
          box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.1) !important;
          outline: none !important;
        }
        .cl-socialButtonsBlockButton:hover {
          border-color: #2A9D8F !important;
          background-color: #f8fafc !important;
        }
        .cl-footerAction:hover,
        .cl-formFieldAction:hover {
          text-decoration: underline !important;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#264653] to-[#2A9D8F] flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <GuidiumLogo />
            </Link>
            <Link href="/" className="bg-[#2A9D8F] hover:bg-[#264653] text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <ArrowLeft className="inline-block w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Join <span style={{ fontFamily: 'var(--font-oregano)' }}>GUIDIUM</span>
            </h1>
            <p className="text-white/80">
              Create your account to get started with meaningful onboarding
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <SignUp 
              redirectUrl="/app/dashboard"
              appearance={{
                elements: {
                  rootBox: { 
                    width: "100%",
                    maxWidth: "100%",
                    margin: "0",
                    padding: "0"
                  },
                  card: {
                    background: "transparent",
                    boxShadow: "none",
                    border: "none",
                    padding: "0",
                    width: "100%",
                    margin: "0"
                  },
                  header: { display: "none" },
                  headerTitle: { display: "none" },
                  headerSubtitle: { display: "none" },
                  formButtonPrimary: {
                    backgroundColor: "#2A9D8F",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "600",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    marginTop: "24px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 12px rgba(42, 157, 143, 0.3)"
                  },
                  formFieldInput: {
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    width: "100%",
                    marginBottom: "16px",
                    transition: "all 0.2s ease",
                    color: "#1f2937"
                  },
                  formFieldLabel: {
                    color: "#374151",
                    fontSize: "15px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    display: "block"
                  },
                  dividerLine: { 
                    backgroundColor: "#e5e7eb",
                    margin: "24px 0"
                  },
                  dividerText: {
                    color: "#6b7280",
                    fontSize: "14px",
                    fontWeight: "500"
                  },
                  socialButtonsBlockButton: {
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    backgroundColor: "white",
                    color: "#374151",
                    fontSize: "16px",
                    fontWeight: "500",
                    width: "100%",
                    marginBottom: "12px",
                    transition: "all 0.2s ease",
                    cursor: "pointer"
                  },
                  formFieldRow: { 
                    marginBottom: "16px"
                  },
                  formField: {
                    marginBottom: "16px"
                  },
                  footer: {
                    marginTop: "24px",
                    textAlign: "center"
                  },
                  footerAction: {
                    color: "#2A9D8F",
                    textDecoration: "none",
                    fontWeight: "500"
                  },
                  formFieldAction: {
                    color: "#2A9D8F",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "14px"
                  }
                }
              }}
              afterSignUpUrl="/app/dashboard"
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
} 