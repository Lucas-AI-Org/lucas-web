/*
  Warnings:

  - The primary key for the `University` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `University` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unitId]` on the table `University` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unitId` to the `University` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."University" DROP CONSTRAINT "University_pkey",
DROP COLUMN "id",
ADD COLUMN     "unitId" INTEGER NOT NULL,
ADD CONSTRAINT "University_pkey" PRIMARY KEY ("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "University_unitId_key" ON "public"."University"("unitId");
