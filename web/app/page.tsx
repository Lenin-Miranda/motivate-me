"use client";
import { useEffect, useState } from "react";
import AOS from "aos";

const steps = [
  {
    id: "mood",
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
    id: "area",
    question: "What do you need a push with?",
    options: [
      "Work or career",
      "Starting something new",
      "My mental space",
      "Life in general",
    ],
  },
  {
    id: "style",
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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    AOS.init({ duration: 380, easing: "ease-out-quart", once: true, offset: 20 });
  }, []);

  function select(value: string) {
    const id = steps[step].id;
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (step < steps.length - 1) {
      setTimeout(() => {
        setStep((s) => s + 1);
        setAnimKey((k) => k + 1);
      }, 300);
    } else {
      setTimeout(() => setDone(true), 360);
    }
  }

  const current = steps[step];

  return (
    <div className="min-h-dvh bg-surface text-primary font-sans">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-12">
        <span className="text-sm font-bold tracking-tight text-accent">
          motivate me.
        </span>
        <a
          href="/login"
          className="text-sm font-medium text-muted transition-colors duration-150 hover:text-primary"
        >
          sign in
        </a>
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

        {/* Hero */}
        <div data-aos="fade-up" className="mb-12">
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

        {/* Questionnaire → CTA */}
        {!done ? (
          <div data-aos="fade-up" data-aos-delay="100">
            {/* Step progress */}
            <div className="mb-7 flex gap-1.5">
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

            {/* Question block — remounts each step to replay stagger animations */}
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
              Personalized phrases, every day. No fluff, just what you actually need.
            </p>
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
              <a
                href="/login"
                className="btn-transition inline-flex items-center justify-center rounded-xl border border-border px-7 py-4 text-sm font-medium text-muted hover:border-border-accent hover:text-primary active:scale-[0.97]"
              >
                sign in
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
