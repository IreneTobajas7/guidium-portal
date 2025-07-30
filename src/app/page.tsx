'use client';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/app/dashboard");
    }
  }, [isSignedIn, router]);

  return (
    <main>
      {/* Your landing page content */}
      <h1>Welcome to the Portal</h1>
    </main>
  );
}
