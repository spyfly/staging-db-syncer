-- Post-restore script 02: Update configuration for staging environment
-- This script modifies application-specific settings for staging use

-- Example: Update app configuration table (modify based on your schema)
-- UPDATE app_config SET config_value = 'staging' WHERE config_key = 'environment';
-- UPDATE app_config SET config_value = 'https://staging-api.example.com' WHERE config_key = 'api_url';
-- UPDATE app_config SET config_value = 'false' WHERE config_key = 'send_emails';

-- Example: Clear sensitive production data
-- UPDATE users SET email = CONCAT('staging_', id, '@example.com') WHERE email NOT LIKE 'staging_%';
-- UPDATE users SET phone = NULL WHERE phone IS NOT NULL;

-- Example: Update feature flags for staging
-- UPDATE feature_flags SET enabled = true WHERE flag_name IN ('debug_mode', 'staging_features');
-- UPDATE feature_flags SET enabled = false WHERE flag_name IN ('production_analytics', 'payment_processing');

-- Example: Clear production cache tables
-- TRUNCATE TABLE cache_entries;
-- TRUNCATE TABLE session_data;

-- Log the execution
SELECT 'Staging environment configuration updated' as Status;
