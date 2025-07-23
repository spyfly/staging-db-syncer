-- Post-restore script 01: Create staging-specific users and permissions
-- This script creates development/staging users with appropriate permissions

-- Create a staging developer user
CREATE USER IF NOT EXISTS 'staging_dev'@'%' IDENTIFIED BY 'dev_password_123';

-- Grant read/write permissions on all databases except system databases
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, CREATE TEMPORARY TABLES 
ON *.* TO 'staging_dev'@'%';

-- Create a read-only user for QA/testing
CREATE USER IF NOT EXISTS 'staging_readonly'@'%' IDENTIFIED BY 'readonly_pass_123';

-- Grant only SELECT permissions for read-only access
GRANT SELECT ON *.* TO 'staging_readonly'@'%';

-- Create a reporting user with broader read access
CREATE USER IF NOT EXISTS 'staging_reports'@'%' IDENTIFIED BY 'reports_pass_123';
GRANT SELECT, SHOW VIEW ON *.* TO 'staging_reports'@'%';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Log the execution
SELECT 'Staging users created successfully' as Status;
