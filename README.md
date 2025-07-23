# Staging Database Syncer

A simple tool to synchronize a production database replica to a staging environment with a web interface. **Runs entirely with Docker Compose - no local Node.js installation required.**

## Features

- 🔄 **Database Sync**: Clone production database to staging
- 🌐 **Web Interface**: Simple dashboard for monitoring and control
- ⏰ **Scheduled Sync**: Configurable cron-based automation
- 📊 **Live Logs**: Real-time sync progress monitoring
- 🐳 **Fully Containerized**: No local dependencies needed

## Quick Start

**Prerequisites**: Docker and Docker Compose only

1. **Start the system:**
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   docker compose up -d
   ```

2. **Access the web interface:**
   Open http://localhost:3000

3. **Trigger a manual sync:**
   Click "Start Sync" in the web interface

## Commands

```bash
make start    # Start all services
make stop     # Stop all services  
make logs     # View logs
make status   # Check status
make sync     # Trigger manual sync
```

## Configuration

The system is highly configurable through environment variables:

### Database Configuration
- **MYSQL_ROOT_PASSWORD**: Root password for databases (default: `test`)
- **EXCLUDED_DATABASES**: Comma-separated list of databases to exclude from backup (default: `phpmyadmin`)

### Container Configuration
- **PROD_DB_CONTAINER**: Production database container name (default: `staging-db-syncer-prod_db_replica-1`)
- **DEV_DB_CONTAINER**: Staging database container name (default: `staging-db-syncer-dev_db-1`)

### Scheduling Configuration
- **CRON_ENABLED**: Enable/disable automatic sync schedule (default: `true`, set to `false` to disable)
- **CRON_SCHEDULE**: Cron expression for automatic sync schedule (default: `0 2 * * *` - daily at 2 AM)
  - Format: `minute hour day month dayofweek`
  - Examples:
    - `0 2 * * *` - Daily at 2:00 AM
    - `0 */6 * * *` - Every 6 hours
    - `0 2 * * 1` - Every Monday at 2:00 AM
    - `30 14 * * 0` - Every Sunday at 2:30 PM

### Post-Restore Configuration
- **POST_RESTORE_SQL_DIR**: Directory containing SQL files executed after restore (default: `/app/post-restore`)
  - All `.sql` files in this directory are executed in alphabetical order
  - Set to empty string to disable post-restore script execution
  - Host directory `./post-restore` is mounted to `/app/post-restore` in container

### Port Configuration
- **Production DB**: Port 3307 (read-only replica)
- **Staging DB**: Port 3308 (sync target)
- **Web UI**: Port 3000

### Environment File
Create a `.env` file in the project root to customize configuration:

```bash
# Copy example and customize
cp env.example .env
# Edit .env with your values
```

## File Structure

```
├── docker-compose.yml         # Docker services configuration
├── Dockerfile                 # Web application container
├── server.js                  # Node.js web application
├── provision_dev_db_users.sql # Default database user setup (deprecated)
├── custom_setup.sql.example   # Example custom post-restore script (deprecated)
├── env.example                # Example environment configuration
├── start.sh                   # Simple startup script
├── post-restore/              # SQL scripts executed after each sync
│   ├── README.md              # Documentation for post-restore scripts
│   ├── 01_create_staging_users.sql   # Create staging-specific users
│   ├── 02_update_staging_config.sql  # Update configuration for staging
│   ├── 03_add_test_data.sql          # Add staging-specific test data
│   └── 04_maintenance_tasks.sql      # Performance and maintenance tasks
├── public/                    # Web interface files
└── logs/                      # Application logs (created at runtime)
```

## Post-Restore SQL Scripts

The system now supports executing multiple SQL scripts after each database sync. Scripts are placed in the `./post-restore/` directory and executed in alphabetical order.

### How It Works
1. Place `.sql` files in the `./post-restore/` directory
2. Use numbered prefixes to control execution order (e.g., `01_`, `02_`, etc.)
3. After each database restore, all scripts are executed automatically
4. Scripts run with MySQL root privileges

### Examples Included
- **01_create_staging_users.sql**: Creates staging-specific database users
- **02_update_staging_config.sql**: Updates configuration for staging environment
- **03_add_test_data.sql**: Adds staging-specific test data
- **04_maintenance_tasks.sql**: Performs maintenance and optimization tasks

### Customization
- Add your own `.sql` files to the `post-restore/` directory
- Modify existing scripts to match your database schema
- See `post-restore/README.md` for detailed documentation and best practices

### Legacy Support
The older single-file approach (`POST_RESTORE_SQL` environment variable) is deprecated but still supported for backward compatibility.

## How It Works

1. **Backup**: Creates a backup from the production replica using `docker exec` and MariaBackup
2. **Container Recreation**: Stops and recreates the staging database container with fresh volumes
3. **Restore**: Restores the backup to the new staging database container
4. **Provisioning**: Sets up database users and permissions

The entire sync process runs through Docker commands executed from the web application container, ensuring full containerization.

## License

This project is licensed under the GNU General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details.

**Commercial Use with Copyleft**: This software may be used for commercial purposes under the GPL v3 license, which requires that:
- Any modifications or derivative works must be released under the same GPL v3 license
- The complete source code of applications using this software must be made publicly available
- Users must be informed of their rights under the GPL v3 license
- Attribution to the original author (spyfly) must be provided

The GPL v3 ensures that commercial software incorporating this code remains open source, preventing proprietary forks while enabling commercial innovation.

## Author

Created by **spyfly**

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/spyfly/staging-db-syncer/issues) on GitHub.
