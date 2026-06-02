import { Router } from "express";
import {
  getLatestQuestionarie,
  getRandomMotivationalPhrases,
  submitQuestionarie,
} from "../controllers/questionarie.controller";

const router = Router();

router.post("/submit", submitQuestionarie);
router.get("/phrases/random", getRandomMotivationalPhrases);
router.get("/me/latest", getLatestQuestionarie);

export default router;
