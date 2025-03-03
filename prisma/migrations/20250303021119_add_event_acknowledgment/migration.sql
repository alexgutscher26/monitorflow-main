-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "acknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acknowledgedAt" TIMESTAMP(3);
