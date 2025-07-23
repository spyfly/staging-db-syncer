-- Post-restore script 03: Add staging-specific test data
-- This script adds test data useful for development and testing

-- Example: Create test accounts for development
-- INSERT IGNORE INTO users (username, email, password_hash, role, created_at) VALUES
-- ('staging_admin', 'admin@staging.local', '$2b$10$dummy_hash_for_password', 'admin', NOW()),
-- ('staging_user', 'user@staging.local', '$2b$10$dummy_hash_for_password', 'user', NOW()),
-- ('test_developer', 'dev@staging.local', '$2b$10$dummy_hash_for_password', 'developer', NOW());

-- Example: Create test data for specific features
-- INSERT IGNORE INTO test_categories (name, description) VALUES
-- ('Staging Category 1', 'Test category for staging environment'),
-- ('Staging Category 2', 'Another test category for development');

-- Example: Add development API keys or tokens
-- INSERT IGNORE INTO api_keys (key_name, key_value, environment, created_at) VALUES
-- ('staging_api_key', 'staging_key_12345', 'staging', NOW()),
-- ('test_webhook_key', 'test_webhook_67890', 'staging', NOW());

-- Log the execution
SELECT 'Staging test data added successfully' as Status;
