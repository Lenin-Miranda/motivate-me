import OpenAI from "openai";

export type MotivationInput = {
  mood: string;
  focus: string;
  style: string;
};

export type MotivationalPhrase = {
  text: string;
  tone: "GENTLE" | "DIRECT" | "DEEP" | "PLAYFUL";
};

export type MotivationalPhrasesResponse = {
  phrases: MotivationalPhrase[];
};

let openaiClient: OpenAI | null = null;
const PHRASES_PER_GENERATION = 12;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to use the LLM");
  }

  openaiClient ??= new OpenAI({ apiKey });

  return openaiClient;
}

function parseMotivationalPhrases(outputText: string): MotivationalPhrasesResponse {
  const parsed = JSON.parse(outputText) as MotivationalPhrasesResponse;

  if (
    !Array.isArray(parsed.phrases) ||
    parsed.phrases.length !== PHRASES_PER_GENERATION
  ) {
    throw new Error("LLM returned an invalid motivational phrases shape");
  }

  return parsed;
}

export async function generateMotivationalPhrases(
  input: MotivationInput,
): Promise<MotivationalPhrasesResponse> {
  const openai = getOpenAIClient();

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    instructions:
      "You write personalized motivational phrases for Motivate Me. The voice is casual, warm, direct, and human. Avoid toxic positivity, therapy claims, hustle culture, clichés, and long speeches. Return only valid JSON.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Generate ${PHRASES_PER_GENERATION} short motivational phrases for this user.`,
              `Mood: ${input.mood}`,
              `Focus: ${input.focus}`,
              `Preferred support style: ${input.style}`,
              "Each phrase should feel like a supportive text from a friend.",
              "Use tone values exactly as uppercase enum values: GENTLE, DIRECT, DEEP, or PLAYFUL.",
            ].join("\n"),
          },
        ],
      },
    ],
    max_output_tokens: 700,
    text: {
      format: {
        type: "json_schema",
        name: "motivational_phrases",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["phrases"],
          properties: {
            phrases: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["text", "tone"],
                properties: {
                  text: {
                    type: "string",
                  },
                  tone: {
                    type: "string",
                    enum: ["GENTLE", "DIRECT", "DEEP", "PLAYFUL"],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return parseMotivationalPhrases(response.output_text);
}
