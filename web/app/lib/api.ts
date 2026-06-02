export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiUser = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export type AuthResponse = {
  message: string;
  sessionToken: string;
  session: {
    id: string;
    expiresAt: string;
  };
  user: ApiUser;
};

export type AuthInput = {
  email: string;
  password: string;
};

export type RegisterInput = AuthInput & {
  questionnaireSubmissionId?: string;
};

export type QuestionnaireAnswers = {
  mood: string;
  focus: string;
  style: string;
  userId?: string;
};

export type QuestionnaireSubmitResponse = {
  questionnaire: {
    id: string;
    mood: string;
    focus: string;
    style: string;
    userId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  phrases: Array<{
    id: string;
    text: string;
    tone: string;
    createdAt: string;
  }>;
};

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "Request failed");
  }

  return data as T;
}

export function loginRequest(input: AuthInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerRequest(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitQuestionnaireRequest(
  input: QuestionnaireAnswers,
): Promise<QuestionnaireSubmitResponse> {
  return apiRequest<QuestionnaireSubmitResponse>("/questionarie/submit", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
