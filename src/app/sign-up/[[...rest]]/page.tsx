// src/app/sign-up/[[...rest]]/page.tsx
'use client'
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #2A9D8F 0%, #264653 100%)",
      padding: "2rem"
    }}>
      <SignUp 
        redirectUrl="/app/dashboard"
        appearance={{
          elements: {
            rootBox: {
              width: "100%",
              maxWidth: "400px"
            }
          }
        }}
      />
    </div>
  );
}