"use client";

import type { FormEvent } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useQuestionnaire } from "../providers/QuestionnaireProvider";

export default function QuestionnaireFlow() {
  const { isReady, user } = useAuth();
  const {
    answers,
    animKey,
    currentStep,
    currentStepIndex,
    error,
    isComplete,
    isLoadingLatest,
    isSigningUp,
    isSubmitting,
    latestAnswers,
    latestQuestionnaire,
    selectAnswer,
    setShowSignupPassword,
    setSignupEmail,
    setSignupPassword,
    showSignupPassword,
    signupComplete,
    signupEmail,
    signupError,
    signupPassword,
    steps,
    submitSignup,
  } = useQuestionnaire();

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitSignup();
  }

  if (!isReady) {
    return (
      <p className="animate-fade-in text-sm font-medium text-muted">
        Checking your session...
      </p>
    );
  }

  if (user && !isComplete) {
    return (
      <div className="animate-slide-up">
        <p className="mb-3 text-2xl font-bold leading-tight text-primary">
          You&apos;re signed in.
        </p>
        <p
          className="mb-8 text-[15px] leading-relaxed text-muted"
          style={{ maxWidth: "30ch" }}
        >
          Your check-in is saved here, no need to take the questionnaire again.
        </p>

        {isLoadingLatest ? (
          <p className="text-sm font-medium text-accent">
            Loading your latest check-in...
          </p>
        ) : latestQuestionnaire ? (
          <div className="mb-8 flex flex-col gap-3">
            {latestAnswers.map((answer) => (
              <div
                key={answer.label}
                className="rounded-xl border border-border bg-surface-raised px-4 py-3.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {answer.label}
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-primary">
                  {answer.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-border bg-surface-raised px-4 py-3.5">
            <p className="text-sm font-semibold text-primary">
              No saved check-in yet.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              The app will keep your mood, focus, and support style together once you create one.
            </p>
          </div>
        )}

        <DownloadButton />
      </div>
    );
  }

  if (!isComplete) {
    return (
      <div>
        <div
          className="animate-fade-in mb-7 flex gap-1.5"
          style={{ animationDelay: "200ms" }}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`progress-segment h-0.75 flex-1 rounded-full ${
                index < currentStepIndex
                  ? "bg-accent"
                  : index === currentStepIndex
                    ? "bg-accent opacity-40"
                    : "bg-border"
              }`}
            />
          ))}
        </div>

        <div key={animKey} className="question-block">
          <p className="question-text mb-5 text-base font-semibold leading-snug text-primary">
            {currentStep.question}
          </p>
          <div className="flex flex-col gap-2">
            {currentStep.options.map((option) => {
              const selected = answers[currentStep.id] === option.value;
              const Icon = option.Icon;

              return (
                <button
                  key={option.value}
                  disabled={isSubmitting}
                  onClick={() => selectAnswer(option.value)}
                  className={`option-item btn-transition group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium active:scale-[0.985] ${
                    selected
                      ? "border-border-accent bg-surface-raised text-primary"
                      : "border-border bg-transparent text-muted hover:border-border-accent hover:bg-surface-raised hover:text-primary"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {Icon ? (
                      <Icon
                        aria-hidden
                        className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                          selected ? "text-accent" : "text-muted group-hover:text-accent"
                        }`}
                        strokeWidth={1.9}
                      />
                    ) : null}
                    <span>{option.label}</span>
                  </span>
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-[border-color,background-color] duration-150 ease-out ${
                      selected
                        ? "border-accent bg-accent"
                        : "border-border group-hover:border-muted"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {isSubmitting ? (
            <p className="mt-5 text-sm font-medium text-accent">
              Writing phrases that actually fit...
            </p>
          ) : null}
          {error ? (
            <p className="mt-5 text-sm font-medium text-accent">
              {error}. Try that last choice again.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <p className="mb-3 text-2xl font-bold leading-tight text-primary">
        Your support bro is ready.
      </p>
      <p
        className="mb-8 text-[15px] leading-relaxed text-muted"
        style={{ maxWidth: "28ch" }}
      >
        Save this batch, then grab the app when you&apos;re ready.
      </p>

      {!signupComplete ? (
        <form className="mb-8 flex flex-col gap-5" onSubmit={handleSignup} noValidate>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="signup-email"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={signupEmail}
              onChange={(event) => setSignupEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5 text-sm text-primary placeholder:text-muted transition-[border-color] duration-150 ease-out focus:border-border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="signup-password"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showSignupPassword ? "text" : "password"}
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="12+ characters"
                className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5 pr-20 text-sm text-primary placeholder:text-muted transition-[border-color] duration-150 ease-out focus:border-border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted transition-colors duration-150 hover:text-primary"
              >
                {showSignupPassword ? "hide" : "show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningUp}
            className="btn-transition w-full rounded-xl bg-accent py-4 text-sm font-bold text-surface hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningUp ? "Creating account..." : "Sign up"}
          </button>

          {signupError ? (
            <p className="text-sm font-medium text-accent">{signupError}</p>
          ) : null}
        </form>
      ) : null}

      {signupComplete ? (
        <>
          <div className="mb-8 rounded-xl border border-border bg-surface-raised px-4 py-3.5">
            <p className="text-sm font-semibold text-primary">You&apos;re in.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Your phrases are saved. The app can pick it up from here.
            </p>
          </div>
          <DownloadButton />
        </>
      ) : null}
    </div>
  );
}

function DownloadButton() {
  return (
    <a
      href="#download"
      className="btn-transition inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-7 py-4 text-sm font-bold text-surface hover:bg-accent-hover active:scale-[0.97]"
    >
      Download the app
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
        <path
          d="M6.5 1.5v8M3 7l3.5 3.5L10 7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
