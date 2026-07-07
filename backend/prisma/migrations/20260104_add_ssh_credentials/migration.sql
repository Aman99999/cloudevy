-- Add SSH credentials to cloud_accounts for log streaming
ALTER TABLE cloud_accounts
ADD COLUMN ssh_private_key TEXT,
ADD COLUMN ssh_username VARCHAR(100),
ADD COLUMN ssh_port INTEGER DEFAULT 22;

