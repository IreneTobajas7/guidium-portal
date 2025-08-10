// src/components/ClerkWrapper.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function ClerkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/app/dashboard"
      signUpFallbackRedirectUrl="/app/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}