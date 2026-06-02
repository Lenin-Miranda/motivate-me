"use client";

import {
  BatteryWarning,
  CloudFog,
  Frown,
  Meh,
  Smile,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type LatestQuestionnaireResponse,
  getLatestQuestionnaireRequest,
  submitQuestionnaireRequest,
} from "../lib/api";
import { useAuth } from "./AuthProvider";

export type StepId = "mood" | "focus" | "style";

export type QuestionnaireAnswers = Partial<Record<StepId, string>>;

export type QuestionnaireOption = {
  label: string;
  value: string;
  Icon?: LucideIcon;
};

export type QuestionnaireStep = {
  id: StepId;
  question: string;
  options: QuestionnaireOption[];
};

type LatestQuestionnaire = LatestQuestionnaireResponse["questionnaire"];

type QuestionnaireContextValue = {
  answers: QuestionnaireAnswers;
  animKey: number;
  currentStep: QuestionnaireStep;
  currentStepIndex: number;
  error: string | null;
  isComplete: boolean;
  isLoadingLatest: boolean;
  isSigningUp: boolean;
  isSubmitting: boolean;
  latestAnswers: Array<{ label: string; value: string }>;
  latestQuestionnaire: LatestQuestionnaire;
  questionnaireSubmissionId: string | null;
  selectAnswer: (value: string) => void;
  showSignupPassword: boolean;
  signupComplete: boolean;
  signupEmail: string;
  signupError: string | null;
  signupPassword: string;
  steps: QuestionnaireStep[];
  submitSignup: () => Promise<void>;
  setShowSignupPassword: (value: boolean | ((current: boolean) => boolean)) => void;
  setSignupEmail: (value: string) => void;
  setSignupPassword: (value: string) => void;
};

const QuestionnaireContext = createContext<QuestionnaireContextValue | null>(
  null,
);

const steps: QuestionnaireStep[] = [
  {
    id: "mood",
    question: "Real talk, how are you doing right now?",
    options: [
      {
        label: "Running on empty",
        value: "Running on empty",
        Icon: BatteryWarning,
      },
      {
        label: "Frustrated",
        value: "Frustrated",
        Icon: Frown,
      },
      {
        label: "Anxious about something",
        value: "Anxious about something",
        Icon: CloudFog,
      },
      {
        label: "Just... numb",
        value: "Just... numb",
        Icon: Meh,
      },
      {
        label: "Hanging in there",
        value: "Hanging in there",
        Icon: Smile,
      },
    ],
  },
  {
    id: "focus",
    question: "What do you need a push with?",
    options: [
      { label: "Work or career", value: "Work or career" },
      { label: "Starting something new", value: "Starting something new" },
      { label: "My mental space", value: "My mental space" },
      { label: "Life in general", value: "Life in general" },
    ],
  },
  {
    id: "style",
    question: "How do you like your support?",
    options: [
      { label: "Gentle and soft", value: "Gentle and soft" },
      { label: "Straight, no chaser", value: "Straight, no chaser" },
      { label: "Deep and meaningful", value: "Deep and meaningful" },
      { label: "Make me smile", value: "Make me smile" },
    ],
  },
];

export function QuestionnaireProvider({ children }: { children: ReactNode }) {
  const { isReady, register, user } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [isComplete, setIsComplete] = useState(false);
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
    const currentUserId = user.id;

    async function loadLatestQuestionnaire() {
      try {
        const { questionnaire } = await getLatestQuestionnaireRequest();

        if (isMounted) {
          setLatestQuestionnaireState({
            userId: currentUserId,
            questionnaire,
          });
        }
      } catch {
        if (isMounted) {
          setLatestQuestionnaireState({
            userId: currentUserId,
            questionnaire: null,
          });
        }
      }
    }

    void loadLatestQuestionnaire();

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
      setIsComplete(true);
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

  function selectAnswer(value: string) {
    const id = steps[currentStepIndex].id;
    const nextAnswers = { ...answers, [id]: value };

    setAnswers(nextAnswers);

    if (currentStepIndex < steps.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex((stepIndex) => stepIndex + 1);
        setAnimKey((key) => key + 1);
      }, 300);
      return;
    }

    setTimeout(() => {
      void submitQuestionnaire(nextAnswers);
    }, 360);
  }

  async function submitSignup() {
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

  const value: QuestionnaireContextValue = {
    answers,
    animKey,
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    error,
    isComplete,
    isLoadingLatest,
    isSigningUp,
    isSubmitting,
    latestAnswers,
    latestQuestionnaire,
    questionnaireSubmissionId,
    selectAnswer,
    showSignupPassword,
    signupComplete,
    signupEmail,
    signupError,
    signupPassword,
    steps,
    submitSignup,
    setShowSignupPassword,
    setSignupEmail,
    setSignupPassword,
  };

  return (
    <QuestionnaireContext.Provider value={value}>
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);

  if (!context) {
    throw new Error("useQuestionnaire must be used inside QuestionnaireProvider");
  }

  return context;
}
