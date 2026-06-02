"use client";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import BrandLogo from "./components/BrandLogo";
import {
  type LatestQuestionnaireResponse,
  getLatestQuestionnaireRequest,
  submitQuestionnaireRequest,
} from "./lib/api";
import { useAuth } from "./providers/AuthProvider";

type StepId = "mood" | "focus" | "style";

type QuestionnaireAnswers = Partial<Record<StepId, string>>;
type LatestQuestionnaire = LatestQuestionnaireResponse["questionnaire"];

const steps = [
  {
    id: "mood" as const,
    question: "Real talk, how are you doing right now?",
    options: [
      "😴 Running on empty",
      "😤 Frustrated",
      "😰 Anxious about something",
      "😶 Just... numb",
      "🙂 Hanging in there",
    ],
  },
  {
    id: "focus" as const,
    question: "What do you need a push with?",
    options: [
      "Work or career",
      "Starting something new",
      "My mental space",
      "Life in general",
    ],
  },
  {
    id: "style" as const,
    question: "How do you like your support?",
    options: [
      "Gentle and soft",
      "Straight, no chaser",
      "Deep and meaningful",
      "Make me smile",
    ],
  },
];

export default function Home() {
  const { isReady, logout, register, user } = useAuth();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [done, setDone]       = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [questionnaireSubmissionId, setQuestionnaireSubmissionId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [latestQuestionnaireState, setLatestQuestionnaireState] = useState<{
    userId: string;
    questionnaire: LatestQuestionnaire;
  } | null>(null);

  useEffect(() => {
    if (!isReady || !user) {
      return;
    }

    let isMounted = true;

    getLatestQuestionnaireRequest()
      .then(({ questionnaire }) => {
        if (isMounted) {
          setLatestQuestionnaireState({
            userId: user.id,
            questionnaire,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setLatestQuestionnaireState({
            userId: user.id,
            questionnaire: null,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isReady, user]);

  async function submitQuestionnaire(nextAnswers: QuestionnaireAnswers) {
    setError(null);
    setIsSubmitting(true);

    try {
      if (!nextAnswers.mood || !nextAnswers.focus || !nextAnswers.style) {
        throw new Error("Missing questionnaire answers");
      }

      const response = await submitQuestionnaireRequest({
        mood: nextAnswers.mood,
        focus: nextAnswers.focus,
        style: nextAnswers.style,
      });

      setQuestionnaireSubmissionId(response.questionnaire.id);
      setDone(true);
      setSignupComplete(Boolean(user));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create your phrases",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError(null);
    setIsSigningUp(true);

    try {
      await register({
        email: signupEmail,
        password: signupPassword,
        ...(questionnaireSubmissionId ? { questionnaireSubmissionId } : {}),
      });
      setSignupComplete(true);
    } catch (registerError) {
      setSignupError(
        registerError instanceof Error
          ? registerError.message
          : "Could not create your account",
      );
    } finally {
      setIsSigningUp(false);
    }
  }

  function select(value: string) {
    const id = steps[step].id;
    const nextAnswers = { ...answers, [id]: value };

    setAnswers(nextAnswers);

    if (step < steps.length - 1) {
      setTimeout(() => {
        setStep((s) => s + 1);
        setAnimKey((k) => k + 1);
      }, 300);
    } else {
      setTimeout(() => {
        void submitQuestionnaire(nextAnswers);
      }, 360);
    }
  }

  const current = steps[step];
  const latestQuestionnaire =
    user && latestQuestionnaireState?.userId === user.id
      ? latestQuestionnaireState.questionnaire
      : null;
  const isLoadingLatest =
    Boolean(user) && latestQuestionnaireState?.userId !== user?.id;
  const latestAnswers = latestQuestionnaire
    ? [
        { label: steps[0].question, value: latestQuestionnaire.mood },
        { label: steps[1].question, value: latestQuestionnaire.focus },
        { label: steps[2].question, value: latestQuestionnaire.style },
      ]
    : [];

  return (
    <div className="min-h-dvh bg-surface text-primary font-sans">

      {/* Nav */}
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

      {/* Ambient background glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-accent blur-[120px]"
          style={{ top: "-8rem", width: "520px", height: "520px", opacity: 0.055 }}
        />
      </div>

      {/* Main content */}
      <main className="mx-auto flex min-h-dvh max-w-120 flex-col justify-center px-6 pb-20 pt-24 sm:px-10">

        {/* Hero — slides up on page load */}
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

        {!isReady ? (
          <p className="animate-fade-in text-sm font-medium text-muted">
            Checking your session...
          </p>
        ) : user && !done ? (
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
          </div>
        ) : !done ? (
          <div>
            {/* Progress bar — fades in after hero */}
            <div
              className="animate-fade-in mb-7 flex gap-1.5"
              style={{ animationDelay: "200ms" }}
            >
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  className={`progress-segment h-0.75 flex-1 rounded-full ${
                    i < step
                      ? "bg-accent"
                      : i === step
                      ? "bg-accent opacity-40"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>

            {/* Question block — remounts each step to replay stagger */}
            <div key={animKey} className="question-block">
              <p className="question-text mb-5 text-base font-semibold leading-snug text-primary">
                {current.question}
              </p>
              <div className="flex flex-col gap-2">
                {current.options.map((opt) => {
                  const selected = answers[current.id] === opt;
                  return (
                    <button
                      key={opt}
                      disabled={isSubmitting}
                      onClick={() => select(opt)}
                      className={`option-item btn-transition group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium active:scale-[0.985] ${
                        selected
                          ? "border-border-accent bg-surface-raised text-primary"
                          : "border-border bg-transparent text-muted hover:border-border-accent hover:bg-surface-raised hover:text-primary"
                      }`}
                    >
                      <span>{opt}</span>
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
        ) : (
          /* Done state */
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
              <form className="mb-8 flex flex-col gap-5" onSubmit={submitSignup} noValidate>
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
              <div className="mb-8 rounded-xl border border-border bg-surface-raised px-4 py-3.5">
                <p className="text-sm font-semibold text-primary">You&apos;re in.</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Your phrases are saved. The app can pick it up from here.
                </p>
              </div>
            ) : null}

            {signupComplete ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
