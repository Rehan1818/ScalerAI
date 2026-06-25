"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/hosted-zones" : "/login");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <div className="text-sm text-[#545b64]">Redirecting...</div>
    </div>
  );
}
