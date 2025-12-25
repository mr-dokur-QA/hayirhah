-- Add denormalized username columns for easier visual testing/debugging.
-- These columns are nullable and do not affect existing relations.

ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS "assignedToUsername" TEXT;

ALTER TABLE "group_members"
ADD COLUMN IF NOT EXISTS "userUsername" TEXT;

ALTER TABLE "numbered_task_assignments"
ADD COLUMN IF NOT EXISTS "userUsername" TEXT;

ALTER TABLE "prayer_trackings"
ADD COLUMN IF NOT EXISTS "userUsername" TEXT;

-- Backfill from users table
UPDATE "tasks" t
SET "assignedToUsername" = u."username"
FROM "users" u
WHERE t."assignedTo" IS NOT NULL
  AND u."id" = t."assignedTo"
  AND (t."assignedToUsername" IS NULL OR t."assignedToUsername" = '');

UPDATE "group_members" gm
SET "userUsername" = u."username"
FROM "users" u
WHERE u."id" = gm."userId"
  AND (gm."userUsername" IS NULL OR gm."userUsername" = '');

UPDATE "numbered_task_assignments" nta
SET "userUsername" = u."username"
FROM "users" u
WHERE u."id" = nta."userId"
  AND (nta."userUsername" IS NULL OR nta."userUsername" = '');

UPDATE "prayer_trackings" pt
SET "userUsername" = u."username"
FROM "users" u
WHERE u."id" = pt."userId"
  AND (pt."userUsername" IS NULL OR pt."userUsername" = '');


