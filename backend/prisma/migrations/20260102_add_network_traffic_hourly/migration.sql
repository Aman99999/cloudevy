-- Create table for hourly network traffic aggregates
CREATE TABLE IF NOT EXISTS "network_traffic_hourly" (
    "id" SERIAL PRIMARY KEY,
    "server_id" INTEGER NOT NULL,
    "hour_timestamp" TIMESTAMP(3) NOT NULL,
    "avg_in_mbps" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avg_out_mbps" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_in_mbps" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_out_mbps" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "min_in_mbps" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "min_out_mbps" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_in_mb" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_out_mb" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "samples_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "network_traffic_hourly_server_id_fkey" 
        FOREIGN KEY ("server_id") 
        REFERENCES "servers"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create unique index to prevent duplicate hourly records
CREATE UNIQUE INDEX IF NOT EXISTS "network_traffic_hourly_server_hour_unique" 
    ON "network_traffic_hourly"("server_id", "hour_timestamp");

-- Create index for faster queries by server_id
CREATE INDEX IF NOT EXISTS "network_traffic_hourly_server_id_idx" 
    ON "network_traffic_hourly"("server_id");

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS "network_traffic_hourly_timestamp_idx" 
    ON "network_traffic_hourly"("hour_timestamp" DESC);

