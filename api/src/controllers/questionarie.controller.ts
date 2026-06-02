import type { Request, Response } from "express";
import { generateMotivationalPhrases } from "../lib/llm";
import { prisma } from "../lib/prisma";
import { logger } from "../middleware/logger";
import getStringField from "../helpers";

type RandomPhrase = {
  id: string;
  text: string;
  tone: string;
  createdAt: Date;
};

function getNumberField(value: unknown, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function submitQuestionarie(req: Request, res: Response) {
  try {
    const mood = getStringField(req.body.mood);
    const focus = getStringField(req.body.focus);
    const style = getStringField(req.body.style);
    const userId = getStringField(req.body.userId);

    if (!mood || !focus || !style) {
      logger.error({
        status: 400,
        message: "Mood, focus and style are required",
      });

      return res
        .status(400)
        .json({ message: "Mood, focus and style are required" });
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    const motivation = await generateMotivationalPhrases({
      mood,
      focus,
      style,
    });

    const questionnaire = await prisma.questionnaireSubmission.create({
      data: {
        mood,
        focus,
        style,
        ...(userId
          ? {
              user: {
                connect: { id: userId },
              },
            }
          : {}),
        motivationalPhrases: {
          create: motivation.phrases.map((phrase) => ({
            text: phrase.text,
            tone: phrase.tone,
            ...(userId
              ? {
                  user: {
                    connect: { id: userId },
                  },
                }
              : {}),
          })),
        },
      },
      include: {
        motivationalPhrases: {
          select: {
            id: true,
            text: true,
            tone: true,
            createdAt: true,
          },
        },
      },
    });

    logger.info({
      status: 201,
      message: "Questionarie submitted succesfully with motivational phrases",
    });
    return res.status(201).json({
      questionnaire,
      phrases: questionnaire.motivationalPhrases,
    });
  } catch (e) {
    logger.error({
      status: 500,
      message: `Internal Server Error: ${e} `,
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getRandomMotivationalPhrases(req: Request, res: Response) {
  try {
    const userId = getStringField(req.query.userId);
    const take = Math.min(getNumberField(req.query.take, 3), 10);

    const phrases = userId
      ? await prisma.$queryRaw<RandomPhrase[]>`
          SELECT "id", "text", "tone", "createdAt"
          FROM "MotivationalPhrase"
          WHERE "userId" = ${userId}
          ORDER BY RANDOM()
          LIMIT ${take}
        `
      : await prisma.$queryRaw<RandomPhrase[]>`
          SELECT "id", "text", "tone", "createdAt"
          FROM "MotivationalPhrase"
          ORDER BY RANDOM()
          LIMIT ${take}
        `;

    return res.status(200).json({ phrases });
  } catch (e) {
    logger.error({
      status: 500,
      message: `Failed to fetch random motivational phrases: ${e}`,
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}
