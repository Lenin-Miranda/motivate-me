"use client";

import Link from "next/link";
import BrandLogo from "./components/BrandLogo";
import QuestionnaireFlow from "./components/QuestionnaireFlow";
import { useAuth } from "./providers/AuthProvider";

export default function Home() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-dvh bg-surface text-primary font-sans">
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-12">
        <Link href="/" aria-label="Motivate Me home" className="btn-transition rounded-sm">
          <BrandLogo />
        </Link>
        {user ? (
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm font-medium text-muted transition-colors duration-150 hover:text-primary"
          >
            sign out
          </button>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-muted transition-colors duration-150 hover:text-primary"
          >
            sign in
          </Link>
        )}
      </nav>

      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-accent blur-[120px]"
          style={{ top: "-8rem", width: "520px", height: "520px", opacity: 0.055 }}
        />
      </div>

      <main className="mx-auto flex min-h-dvh max-w-120 flex-col justify-center px-6 pb-20 pt-24 sm:px-10">
        <div className="animate-slide-up mb-12">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            your support bro
          </p>
          <h1
            className="mb-5 font-extrabold leading-[0.88] tracking-tight text-primary"
            style={{ fontSize: "clamp(3rem, 11vw, 5.25rem)" }}
          >
            You needed
            <br />
            <em className="not-italic text-accent">this.</em>
          </h1>
          <p className="text-[15px] leading-relaxed text-muted" style={{ maxWidth: "28ch" }}>
            Three questions. Phrases that land for your mood, your grind, your day.
          </p>
        </div>

        <QuestionnaireFlow />
      </main>
    </div>
  );
}
