-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "server_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "rrule" TEXT NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_executions" (
    "id" SERIAL NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "error_msg" TEXT,
    "duration" INTEGER NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_workspace_id_idx" ON "schedules"("workspace_id");

-- CreateIndex
CREATE INDEX "schedules_server_id_idx" ON "schedules"("server_id");

-- CreateIndex
CREATE INDEX "schedules_enabled_idx" ON "schedules"("enabled");

-- CreateIndex
CREATE INDEX "schedules_next_run_at_idx" ON "schedules"("next_run_at");

-- CreateIndex
CREATE INDEX "schedule_executions_schedule_id_idx" ON "schedule_executions"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_executions_executed_at_idx" ON "schedule_executions"("executed_at");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_executions" ADD CONSTRAINT "schedule_executions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

