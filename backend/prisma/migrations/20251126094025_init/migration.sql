-- CreateTable
CREATE TABLE "workspaces" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "subscription_status" VARCHAR(50) NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '14 days',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'owner',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_accounts" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "credentials" TEXT,
    "region" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloud_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "cloud_account_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "provider" VARCHAR(50),
    "region" VARCHAR(100),
    "instance_type" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'running',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "containers" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "server_id" INTEGER,
    "container_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "image" VARCHAR(255),
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(255) NOT NULL,
    "resource_type" VARCHAR(100),
    "resource_id" INTEGER,
    "details" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_slug_idx" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_workspace_id_idx" ON "users"("workspace_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "cloud_accounts_workspace_id_idx" ON "cloud_accounts"("workspace_id");

-- CreateIndex
CREATE INDEX "servers_workspace_id_idx" ON "servers"("workspace_id");

-- CreateIndex
CREATE INDEX "containers_workspace_id_idx" ON "containers"("workspace_id");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_idx" ON "audit_logs"("workspace_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud_accounts" ADD CONSTRAINT "cloud_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_cloud_account_id_fkey" FOREIGN KEY ("cloud_account_id") REFERENCES "cloud_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
