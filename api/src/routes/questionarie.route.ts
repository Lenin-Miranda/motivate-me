import { Router } from "express";
import {
  getRandomMotivationalPhrases,
  submitQuestionarie,
} from "../controllers/questionarie.controller";

const router = Router();

router.post("/submit", submitQuestionarie);
router.get("/phrases/random", getRandomMotivationalPhrases);

export default router;
