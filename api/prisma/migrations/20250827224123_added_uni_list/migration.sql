/*
  Warnings:

  - You are about to drop the column `location` on the `University` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Control" AS ENUM ('PUBLIC', 'PRIVATE_NONPROFIT', 'PRIVATE_FORPROFIT');

-- CreateEnum
CREATE TYPE "public"."IncomeBracket" AS ENUM ('B1_0_30K', 'B2_30_48K', 'B3_48_75K', 'B4_75_110K', 'B5_110K_PLUS');

-- CreateEnum
CREATE TYPE "public"."NetPriceSector" AS ENUM ('PUB', 'PRIV', 'PROG', 'OTHER');

-- AlterTable
ALTER TABLE "public"."University" DROP COLUMN "location",
ADD COLUMN     "aANAPII" BOOLEAN,
ADD COLUMN     "accredAgency" TEXT,
ADD COLUMN     "alias" TEXT,
ADD COLUMN     "ccSizSet" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "control" "public"."Control",
ADD COLUMN     "controlPeps" INTEGER,
ADD COLUMN     "curroper" BOOLEAN,
ADD COLUMN     "distanceOnly" BOOLEAN,
ADD COLUMN     "hBCU" BOOLEAN,
ADD COLUMN     "hSI" BOOLEAN,
ADD COLUMN     "highDeg" INTEGER,
ADD COLUMN     "icLevel" INTEGER,
ADD COLUMN     "instUrl" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locale" INTEGER,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "main" BOOLEAN,
ADD COLUMN     "menOnly" BOOLEAN,
ADD COLUMN     "npcUrl" TEXT,
ADD COLUMN     "numBranch" INTEGER,
ADD COLUMN     "openAdmp" BOOLEAN,
ADD COLUMN     "pBI" BOOLEAN,
ADD COLUMN     "predDeg" INTEGER,
ADD COLUMN     "prgmOfr" TEXT,
ADD COLUMN     "region" INTEGER,
ADD COLUMN     "relAffil" INTEGER,
ADD COLUMN     "schDeg" INTEGER,
ADD COLUMN     "schType" INTEGER,
ADD COLUMN     "tribal" BOOLEAN,
ADD COLUMN     "ugds" INTEGER,
ADD COLUMN     "womenOnly" BOOLEAN,
ADD COLUMN     "zip" TEXT,
ALTER COLUMN "state" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "University_state_idx" ON "public"."University"("state");

-- CreateIndex
CREATE INDEX "University_region_idx" ON "public"."University"("region");

-- CreateIndex
CREATE INDEX "University_name_idx" ON "public"."University"("name");
