import { Router } from "express";
import { submitQuestionarie } from "../controllers/questionarie.controller";

const router = Router();

router.post("/submit", submitQuestionarie);

export default router;
