-- Add instanceId and apiKey fields to servers table
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "instance_id" VARCHAR(255);
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "api_key" VARCHAR(255);

-- Create unique index on api_key
CREATE UNIQUE INDEX IF NOT EXISTS "servers_api_key_key" ON "servers"("api_key");

-- Create index on api_key for faster lookups
CREATE INDEX IF NOT EXISTS "servers_api_key_idx" ON "servers"("api_key");

