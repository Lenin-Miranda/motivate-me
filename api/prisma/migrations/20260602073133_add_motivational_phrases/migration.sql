-- CreateEnum
CREATE TYPE "PhraseTone" AS ENUM ('GENTLE', 'DIRECT', 'DEEP', 'PLAYFUL');

-- CreateTable
CREATE TABLE "MotivationalPhrase" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tone" "PhraseTone" NOT NULL,
    "userId" TEXT NOT NULL,
    "questionnaireSubmissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "MotivationalPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MotivationalPhrase_userId_createdAt_idx" ON "MotivationalPhrase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MotivationalPhrase_questionnaireSubmissionId_idx" ON "MotivationalPhrase"("questionnaireSubmissionId");

-- AddForeignKey
ALTER TABLE "MotivationalPhrase" ADD CONSTRAINT "MotivationalPhrase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivationalPhrase" ADD CONSTRAINT "MotivationalPhrase_questionnaireSubmissionId_fkey" FOREIGN KEY ("questionnaireSubmissionId") REFERENCES "QuestionnaireSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
