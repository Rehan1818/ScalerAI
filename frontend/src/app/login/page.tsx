"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    router.replace("/hosted-zones");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      router.push("/hosted-zones");
    } catch (err) {
      setError(err instanceof ApiError ? String(err.message) : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#232f3e]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-lg shadow-2xl md:grid-cols-2">
          <div className="hidden bg-[#1a242f] p-10 text-white md:block">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded bg-[#ff9900] text-lg font-bold text-[#232f3e]">
              R53
            </div>
            <h1 className="mb-3 text-3xl font-light">Amazon Route 53</h1>
            <p className="text-sm leading-relaxed text-[#aab7b8]">
              A highly available and scalable cloud Domain Name System (DNS) web
              service. This clone recreates the Route 53 console experience with
              hosted zones and DNS record management.
            </p>
            <div className="mt-8 rounded border border-[#3b4752] bg-[#232f3e] p-4 text-xs text-[#aab7b8]">
              <p className="mb-1 font-semibold text-white">Demo credentials</p>
              <p>Username: admin</p>
              <p>Password: admin123</p>
            </div>
          </div>

          <div className="bg-white p-10">
            <h2 className="mb-1 text-xl font-normal text-[#16191f]">Sign in</h2>
            <p className="mb-6 text-sm text-[#545b64]">IAM user sign-in (mocked)</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#16191f]">
                  Account ID or alias
                </label>
                <input className="aws-input" value="123456789012" readOnly />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#16191f]">
                  IAM user name
                </label>
                <input
                  className="aws-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#16191f]">
                  Password
                </label>
                <input
                  className="aws-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded border border-[#d13212] bg-[#fdf3f1] px-3 py-2 text-sm text-[#d13212]">
                  {error}
                </div>
              )}

              <button type="submit" className="aws-btn-primary w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
