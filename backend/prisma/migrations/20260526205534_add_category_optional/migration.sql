-- DropIndex
DROP INDEX "task_skills_skillId_idx";

-- DropIndex
DROP INDEX "tasks_status_deadline_idx";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "task_skills_skillId_taskId_idx" ON "task_skills"("skillId", "taskId");

-- CreateIndex
CREATE INDEX "tasks_status_deadline_publishedAt_idx" ON "tasks"("status", "deadline", "publishedAt");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
