-- AlterTable: Add fields for instance type scaling
ALTER TABLE "schedules" ADD COLUMN "target_instance_type" VARCHAR(100);
ALTER TABLE "schedules" ADD COLUMN "original_instance_type" VARCHAR(100);

-- Update action column comment
COMMENT ON COLUMN "schedules"."action" IS 'Possible values: stop, start, reboot, scale_down, scale_up';

