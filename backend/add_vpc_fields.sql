-- Add VPC and Subnet ID columns to servers table
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "vpc_id" VARCHAR(255);
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "subnet_id" VARCHAR(255);

-- Add index for VPC lookups
CREATE INDEX IF NOT EXISTS "servers_vpc_id_idx" ON "servers"("vpc_id");
