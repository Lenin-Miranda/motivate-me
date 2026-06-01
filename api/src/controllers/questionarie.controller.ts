import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../middleware/logger";
import getStringField from "../helpers";

export async function submitQuestionarie(req: Request, res: Response) {
  try {
    const mood = getStringField(req.body.mood);
    const focus = getStringField(req.body.focus);
    const style = getStringField(req.body.style);
    const userId = getStringField(req.body.userId);

    if (!mood || !focus || !style || !userId) {
      logger.error({
        status: 400,
        message: "Mood, focus, style and userId are required",
      });

      return res.status(400).json({ message: "Mood, focus, style and userId are required" });
    }

    const questionnaire = await prisma.questionnaireSubmission.create({
      data: {
        mood,
        focus,
        style,
        user: {
          connect: { id: userId },
        },
      },
    });

    logger.info({
      status: 201,
      message: "Questionarie submitted succesfully",
    });
    return res.status(201).json(questionnaire);
  } catch (e) {
    logger.error({
      status: 500,
      message: `Internal Server Error: ${e} `,
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}
