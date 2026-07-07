-- Add connectivity tracking fields to clusters table
ALTER TABLE "clusters" ADD COLUMN "connectivity_status" VARCHAR(50) DEFAULT 'unknown';
ALTER TABLE "clusters" ADD COLUMN "connectivity_mode" VARCHAR(50) DEFAULT 'manual';
ALTER TABLE "clusters" ADD COLUMN "last_connectivity_check" TIMESTAMP;
ALTER TABLE "clusters" ADD COLUMN "connectivity_error" TEXT;

-- Add index for connectivity status
CREATE INDEX "clusters_connectivity_status_idx" ON "clusters"("connectivity_status");

