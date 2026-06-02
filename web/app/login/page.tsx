"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../providers/AuthProvider";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.push("/");
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Could not sign in",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface text-primary font-sans">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-12">
        <Link href="/" aria-label="Motivate Me home" className="btn-transition rounded-sm">
          <BrandLogo />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors duration-150 hover:text-primary"
        >
          back
        </Link>
      </nav>

      {/* Ambient glow — same as landing */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-accent blur-[120px]"
          style={{ top: "-8rem", width: "520px", height: "520px", opacity: 0.055 }}
        />
      </div>

      <main className="mx-auto flex min-h-dvh max-w-120 flex-col justify-center px-6 pb-20 pt-24 sm:px-10">

        {/* Headline */}
        <div className="animate-slide-up mb-10">
          <h1
            className="mb-3 font-extrabold leading-[0.92] tracking-tight text-primary"
            style={{ fontSize: "clamp(2.5rem, 9vw, 4rem)" }}
          >
            Hey, you&apos;re
            <br />
            <em className="not-italic text-accent">back.</em>
          </h1>
          <p className="text-[15px] leading-relaxed text-muted" style={{ maxWidth: "28ch" }}>
            Pick up where you left off.
          </p>
        </div>

        {/* Form */}
        <form
          className="animate-slide-up flex flex-col gap-5"
          style={{ animationDelay: "80ms" }}
          onSubmit={submitLogin}
          noValidate
        >
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5 text-sm text-primary placeholder:text-muted transition-[border-color] duration-150 ease-out focus:border-border-accent focus:outline-none"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
              >
                Password
              </label>
              <a
                href="/forgot"
                className="text-[12px] font-medium text-muted transition-colors duration-150 hover:text-primary"
              >
                forgot?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5 pr-12 text-sm text-primary placeholder:text-muted transition-[border-color] duration-150 ease-out focus:border-border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors duration-150 ease-out hover:text-primary"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.3" />
                    <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-transition mt-1 w-full rounded-xl bg-accent py-4 text-sm font-bold text-surface hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          {error ? (
            <p className="text-sm font-medium text-accent">{error}</p>
          ) : null}
        </form>

        {/* Register link */}
        <p
          className="animate-slide-up mt-8 text-sm text-muted"
          style={{ animationDelay: "160ms" }}
        >
          First time here?{" "}
          <Link
            href="/"
            className="font-semibold text-accent transition-colors duration-150 hover:text-primary"
          >
            Take the questionnaire.
          </Link>
        </p>
      </main>
    </div>
  );
}
