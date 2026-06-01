/*
  Warnings:

  - You are about to drop the column `area` on the `QuestionnaireSubmission` table. All the data in the column will be lost.
  - Added the required column `focus` to the `QuestionnaireSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuestionnaireSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mood" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_QuestionnaireSubmission" ("createdAt", "id", "mood", "style", "updatedAt") SELECT "createdAt", "id", "mood", "style", "updatedAt" FROM "QuestionnaireSubmission";
DROP TABLE "QuestionnaireSubmission";
ALTER TABLE "new_QuestionnaireSubmission" RENAME TO "QuestionnaireSubmission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
