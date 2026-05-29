import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../middleware/logger";

function getStringField(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function listQuestionnaires(_req: Request, res: Response) {
  try {
    const submissions = await prisma.questionnaireSubmission.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    res.json({
      data: submissions,
    });
  } catch (error) {
    logger.error("Failed to fetch questionnaire submissions", { error });
    res.status(500).json({
      error: "Could not fetch questionnaire submissions.",
    });
  }
}

export async function createQuestionnaire(req: Request, res: Response) {
  const mood = getStringField(req.body?.mood);
  const area = getStringField(req.body?.area);
  const style = getStringField(req.body?.style);

  if (!mood || !area || !style) {
    return res.status(400).json({
      error: "Fields mood, area, and style are required.",
    });
  }

  try {
    const submission = await prisma.questionnaireSubmission.create({
      data: {
        mood,
        area,
        style,
      },
    });

    return res.status(201).json({
      data: submission,
    });
  } catch (error) {
    logger.error("Failed to create questionnaire submission", { error });
    return res.status(500).json({
      error: "Could not save questionnaire submission.",
    });
  }
}
