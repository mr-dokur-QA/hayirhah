-- CreateTable
CREATE TABLE "numbered_task_assignments" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "numbered_task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "numbered_task_assignments_groupId_idx" ON "numbered_task_assignments"("groupId");

-- CreateIndex
CREATE INDEX "numbered_task_assignments_userId_idx" ON "numbered_task_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "numbered_task_assignments_groupId_userId_key" ON "numbered_task_assignments"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "numbered_task_assignments" ADD CONSTRAINT "numbered_task_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numbered_task_assignments" ADD CONSTRAINT "numbered_task_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

