-- Add password reset fields to users table
ALTER TABLE "users" ADD COLUMN "password_reset_token" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "password_reset_expires" TIMESTAMP(3);

-- Add index for password reset token lookup
CREATE INDEX IF NOT EXISTS "users_password_reset_token_idx" ON "users"("password_reset_token");

