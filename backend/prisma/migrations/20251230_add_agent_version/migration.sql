-- Add agent version tracking fields to servers table
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "agent_version" VARCHAR(20);
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "last_agent_contact" TIMESTAMP;

