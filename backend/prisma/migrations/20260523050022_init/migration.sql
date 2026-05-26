/*
  Warnings:

  - The values [executor_selected] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `categoryId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('draft', 'published', 'in_progress', 'on_review', 'completed');
ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TABLE "task_status_history" ALTER COLUMN "fromStatus" TYPE "TaskStatus_new" USING ("fromStatus"::text::"TaskStatus_new");
ALTER TABLE "task_status_history" ALTER COLUMN "toStatus" TYPE "TaskStatus_new" USING ("toStatus"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_categoryId_fkey";

-- DropIndex
DROP INDEX "tasks_categoryId_status_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "categories";
