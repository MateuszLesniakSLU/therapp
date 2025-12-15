/*
  DAILY SURVEY REFACTOR MIGRATION
  - removes locked / expiresAt / submittedAt
  - adds Survey.date (safe backfill)
  - replaces submittedAt with updatedAt
  - enforces unique constraints
*/

BEGIN;

-- =========================
-- 1️⃣ USER.updatedAt (NULL → createdAt)
-- =========================
UPDATE "User"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- =========================
-- 2️⃣ SURVEY: remove locked, add date (SAFE)
-- =========================

-- 2.1 Add date as NULLABLE first
ALTER TABLE "Survey"
ADD COLUMN "date" TIMESTAMP(3);

-- 2.2 Backfill date from createdAt (truncate to day)
UPDATE "Survey"
SET "date" = DATE_TRUNC('day', "createdAt")
WHERE "date" IS NULL;

-- 2.3 Enforce NOT NULL
ALTER TABLE "Survey"
ALTER COLUMN "date" SET NOT NULL;

-- 2.4 Drop locked column
ALTER TABLE "Survey"
DROP COLUMN IF EXISTS "locked";

-- =========================
-- 3️⃣ SURVEY ASSIGNMENT cleanup
-- =========================
ALTER TABLE "SurveyAssignment"
DROP COLUMN IF EXISTS "expiresAt";

-- =========================
-- 4️⃣ SURVEY RESPONSE: submittedAt → updatedAt
-- =========================

-- 4.1 Add updatedAt as NULLABLE
ALTER TABLE "SurveyResponse"
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- 4.2 Backfill updatedAt from submittedAt or now()
UPDATE "SurveyResponse"
SET "updatedAt" = COALESCE("submittedAt", NOW())
WHERE "updatedAt" IS NULL;

-- 4.3 Enforce NOT NULL
ALTER TABLE "SurveyResponse"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- 4.4 Drop submittedAt
ALTER TABLE "SurveyResponse"
DROP COLUMN IF EXISTS "submittedAt";

-- =========================
-- 5️⃣ UNIQUE CONSTRAINTS (AFTER DATA IS CLEAN)
-- =========================

-- 5.1 One survey per day
CREATE UNIQUE INDEX IF NOT EXISTS "Survey_date_key"
ON "Survey"("date");

-- 5.2 One response per user per survey
CREATE UNIQUE INDEX IF NOT EXISTS "SurveyResponse_surveyId_userId_key"
ON "SurveyResponse"("surveyId", "userId");

-- 5.3 One answer per question per response
CREATE UNIQUE INDEX IF NOT EXISTS "SurveyAnswer_responseId_questionId_key"
ON "SurveyAnswer"("responseId", "questionId");

-- 5.4 Stable ordering of options
CREATE UNIQUE INDEX IF NOT EXISTS "SurveyQuestionOption_questionId_order_key"
ON "SurveyQuestionOption"("questionId", "order");

COMMIT;
