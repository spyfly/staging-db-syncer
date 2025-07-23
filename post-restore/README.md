# Post-Restore SQL Scripts

This directory contains SQL scripts that are automatically executed after each database sync operation. Scripts are executed in alphabetical order, so use numbered prefixes to control execution sequence.

## How It Works

1. After the staging database is restored from the production replica
2. All `.sql` files in this directory are executed in alphabetical order
3. Each script is executed using the MySQL root user
4. Success/failure status is logged in the application logs

## File Naming Convention

Use numbered prefixes to control execution order:
- `01_create_staging_users.sql` - Create staging-specific database users
- `02_update_staging_config.sql` - Update configuration for staging environment
- `03_add_test_data.sql` - Add staging-specific test data
- `04_maintenance_tasks.sql` - Performance and maintenance tasks

## Examples

### Creating Staging Users
```sql
-- Create a development user
CREATE USER IF NOT EXISTS 'dev_user'@'%' IDENTIFIED BY 'dev_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'dev_user'@'%';
FLUSH PRIVILEGES;
```

### Environment Configuration
```sql
-- Update configuration for staging
UPDATE app_settings SET value = 'staging' WHERE key = 'environment';
UPDATE app_settings SET value = 'false' WHERE key = 'send_production_emails';
```

### Data Sanitization
```sql
-- Anonymize sensitive data
UPDATE users SET email = CONCAT('user_', id, '@staging.local') 
WHERE email NOT LIKE '%@staging.local';
```

### Adding Test Data
```sql
-- Insert test records
INSERT IGNORE INTO test_accounts (username, role) VALUES 
('staging_admin', 'admin'),
('staging_user', 'user');
```

## Environment Variables

- `POST_RESTORE_SQL_DIR`: Directory path inside container (default: `/app/post-restore`)
- Scripts in this directory are mounted from the host `./post-restore` directory

## Best Practices

1. **Always use `IF NOT EXISTS`** for CREATE statements
2. **Use `INSERT IGNORE`** for test data to avoid duplicate key errors
3. **Comment your scripts** extensively for future maintenance
4. **Test scripts thoroughly** before production use
5. **Keep scripts idempotent** - safe to run multiple times
6. **Use transactions** for complex operations that should be atomic

## Troubleshooting

- Check application logs for script execution results
- Each script execution is logged with success/failure status
- Failed scripts will halt the post-restore process
- Test individual scripts manually: `docker exec staging-db mysql -u root -p < script.sql`

## Security Notes

- Scripts run with MySQL root privileges
- Be careful with user creation and permission grants
- Don't include production passwords or sensitive data
- Use strong passwords for staging users
