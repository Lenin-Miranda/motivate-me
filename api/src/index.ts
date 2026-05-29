import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  createQuestionnaire,
  listQuestionnaires,
} from "./controllers/questionarie.controller";
import { prisma } from "./lib/prisma";
import { logger } from "./middleware/logger";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: clientOrigin,
  }),
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      ok: true,
      service: "api",
      database: "ok",
    });
  } catch (error) {
    logger.error("Healthcheck database query failed", { error });
    res.status(500).json({
      ok: false,
      service: "api",
      database: "error",
    });
  }
});

app.get("/questionnaires", listQuestionnaires);
app.post("/questionnaires", createQuestionnaire);

app.listen(port, () => {
  logger.info(`API running on http://localhost:${port}`);
});
