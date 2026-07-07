-- HDFS Cluster Support Migration
-- This adds support for HDFS/Hadoop clusters to CloudEvy
-- SAFE TO RUN: Only adds new columns and tables, no data modification

-- Step 1: Add HDFS-specific columns to clusters table
ALTER TABLE "clusters" ADD COLUMN IF NOT EXISTS "distribution" VARCHAR(50);
ALTER TABLE "clusters" ADD COLUMN IF NOT EXISTS "hdfs_config" JSONB;

-- Step 2: Add index on cluster type for better query performance
CREATE INDEX IF NOT EXISTS "clusters_type_idx" ON "clusters"("type");

-- Step 3: Create hadoop_services table
CREATE TABLE IF NOT EXISTS "hadoop_services" (
  "id" SERIAL PRIMARY KEY,
  "cluster_id" INTEGER NOT NULL,
  "service_name" VARCHAR(50) NOT NULL,
  "service_version" VARCHAR(20),
  "status" VARCHAR(50) NOT NULL,
  "config" JSONB,
  "installed_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "hadoop_services_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE CASCADE
);

-- Step 4: Create indexes on hadoop_services
CREATE INDEX IF NOT EXISTS "hadoop_services_cluster_id_idx" ON "hadoop_services"("cluster_id");
CREATE INDEX IF NOT EXISTS "hadoop_services_status_idx" ON "hadoop_services"("status");

-- Step 5: Create hadoop_node_roles table
CREATE TABLE IF NOT EXISTS "hadoop_node_roles" (
  "id" SERIAL PRIMARY KEY,
  "cluster_id" INTEGER NOT NULL,
  "server_id" INTEGER NOT NULL,
  "role" VARCHAR(50) NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "hadoop_node_roles_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE CASCADE,
  CONSTRAINT "hadoop_node_roles_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE
);

-- Step 6: Create indexes on hadoop_node_roles
CREATE INDEX IF NOT EXISTS "hadoop_node_roles_cluster_id_idx" ON "hadoop_node_roles"("cluster_id");
CREATE INDEX IF NOT EXISTS "hadoop_node_roles_server_id_idx" ON "hadoop_node_roles"("server_id");

-- Verification queries (optional)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clusters' AND column_name IN ('distribution', 'hdfs_config');
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('hadoop_services', 'hadoop_node_roles');

