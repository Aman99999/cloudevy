-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- AlterTable
ALTER TABLE "public"."workspaces" ALTER COLUMN "trial_ends_at" SET DEFAULT (CURRENT_TIMESTAMP + '14 days'::interval);

-- RenameIndex
ALTER INDEX "public"."network_traffic_hourly_server_id_hour_timestamp_key" RENAME TO "network_traffic_hourly_server_hour_unique";

