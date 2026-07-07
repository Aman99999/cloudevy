-- Add per-server SSH credentials to servers table
ALTER TABLE "servers" ADD COLUMN "ssh_private_key" TEXT;
ALTER TABLE "servers" ADD COLUMN "ssh_username" VARCHAR(100);
ALTER TABLE "servers" ADD COLUMN "ssh_port" INTEGER;
ALTER TABLE "servers" ADD COLUMN "ssh_configured_at" TIMESTAMP(3);

