-- AlterTable: Add fields for EBS volume scaling
ALTER TABLE "schedules" ADD COLUMN "target_volume_size" INTEGER;
ALTER TABLE "schedules" ADD COLUMN "target_volume_type" VARCHAR(50);
ALTER TABLE "schedules" ADD COLUMN "target_volume_iops" INTEGER;
ALTER TABLE "schedules" ADD COLUMN "target_volume_throughput" INTEGER;
ALTER TABLE "schedules" ADD COLUMN "original_volume_size" INTEGER;
ALTER TABLE "schedules" ADD COLUMN "original_volume_type" VARCHAR(50);
ALTER TABLE "schedules" ADD COLUMN "original_volume_iops" INTEGER;
ALTER TABLE "schedules" ADD COLUMN "original_volume_throughput" INTEGER;

-- Update action column comment
COMMENT ON COLUMN "schedules"."action" IS 'Possible values: stop, start, reboot, scale_down, scale_up. scale_down/scale_up can modify instance type and/or EBS volumes';

