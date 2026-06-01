import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../middleware/logger";
import getStringField from "../helpers";
import { get } from "node:http";

export async function submitQuestionarie(res: Response, req: Request) {
  try {
    const mood = getStringField(req.body.mood);
    const focus = getStringField(req.body.focus);
    const style = getStringField(req.body.style);

    if (!mood || !focus || !style) {
      logger.error({
        status: 400,
        message: "One or more required fields are missing",
      });

      return res
        .status(400)
        .json({ message: "One or more required fields are missing" });
    }

    const questionnaire = await prisma.questionnaireSubmission.create({
      data: {
        mood,
        focus,
        style,
      },
    });

    logger.info({
      status: 201,
      message: "Questionarie submitted succesfully",
    });
    return res.status(201).json(questionnaire);
  } catch (e) {
    logger.error({
      stauts: 500,
      message: `Internal Server Error: ${e} `,
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}
