-- CreateTable
CREATE TABLE "clusters" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "version" VARCHAR(50),
    "network_plugin" VARCHAR(50),
    "kubeconfig" TEXT,
    "api_endpoint" VARCHAR(255),
    "node_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cluster_nodes" (
    "id" SERIAL NOT NULL,
    "cluster_id" INTEGER NOT NULL,
    "server_id" INTEGER,
    "node_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "cpu_usage" DOUBLE PRECISION,
    "memory_usage" DOUBLE PRECISION,
    "pod_count" INTEGER,
    "conditions" JSONB,
    "joined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cluster_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clusters_workspace_id_idx" ON "clusters"("workspace_id");

-- CreateIndex
CREATE INDEX "clusters_status_idx" ON "clusters"("status");

-- CreateIndex
CREATE INDEX "cluster_nodes_cluster_id_idx" ON "cluster_nodes"("cluster_id");

-- CreateIndex
CREATE INDEX "cluster_nodes_server_id_idx" ON "cluster_nodes"("server_id");

-- AddForeignKey
ALTER TABLE "clusters" ADD CONSTRAINT "clusters_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cluster_nodes" ADD CONSTRAINT "cluster_nodes_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "clusters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cluster_nodes" ADD CONSTRAINT "cluster_nodes_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
