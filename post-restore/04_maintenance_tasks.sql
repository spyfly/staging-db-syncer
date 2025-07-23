-- Post-restore script 04: Performance and maintenance tasks
-- This script performs maintenance tasks suitable for staging environment

-- Example: Update statistics for better query performance
-- ANALYZE TABLE users;
-- ANALYZE TABLE orders;
-- ANALYZE TABLE products;

-- Example: Optimize tables (be careful with large tables in production-like data)
-- OPTIMIZE TABLE session_data;
-- OPTIMIZE TABLE log_entries;

-- Example: Set staging-specific timeouts and limits
-- SET GLOBAL wait_timeout = 28800;
-- SET GLOBAL interactive_timeout = 28800;

-- Example: Enable query logging for debugging (staging only)
-- SET GLOBAL general_log = 'ON';
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 2;

-- Example: Create staging-specific indexes for testing
-- CREATE INDEX IF NOT EXISTS idx_staging_created_at ON users(created_at);
-- CREATE INDEX IF NOT EXISTS idx_staging_status ON orders(status, created_at);

-- Log the execution
SELECT 'Performance and maintenance tasks completed' as Status;
