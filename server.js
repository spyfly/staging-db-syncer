const express = require('express');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

// Configuration from environment variables
const PROD_DB_CONTAINER = process.env.PROD_DB_CONTAINER;
const DEV_DB_CONTAINER = process.env.DEV_DB_CONTAINER;
const MYSQL_ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD;
const EXCLUDED_DATABASES = process.env.EXCLUDED_DATABASES || 'phpmyadmin';
const POST_RESTORE_SQL_DIR = process.env.POST_RESTORE_SQL_DIR || '/app/scripts/post-restore';
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 2 * * *'; // Daily at 2 AM by default
const CRON_ENABLED = process.env.CRON_ENABLED !== 'false'; // Enabled by default, set to 'false' to disable

// Create logs directory
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Simple logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/app.log' }),
        new winston.transports.Console()
    ]
});

app.use(express.json());
app.use(express.static('public'));

// Application state
let syncStatus = {
    isRunning: false,
    lastRun: null,
    nextScheduled: null,
    logs: [],
    cronEnabled: CRON_ENABLED,
    cronSchedule: CRON_SCHEDULE
};

// Execute command with logging
function executeCommand(command, description) {
    return new Promise((resolve, reject) => {
        const logEntry = { 
            timestamp: new Date().toISOString(), 
            type: 'info', 
            message: `Starting: ${description}` 
        };
        
        syncStatus.logs.push(logEntry);
        logger.info(logEntry.message);
        io.emit('log', logEntry);

        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                const errorEntry = { 
                    timestamp: new Date().toISOString(), 
                    type: 'error', 
                    message: `Error: ${description} - ${error.message}`
                };
                syncStatus.logs.push(errorEntry);
                logger.error(errorEntry.message);
                io.emit('log', errorEntry);
                reject(error);
            } else {
                const successEntry = { 
                    timestamp: new Date().toISOString(), 
                    type: 'success', 
                    message: `Completed: ${description}`
                };
                syncStatus.logs.push(successEntry);
                logger.info(successEntry.message);
                io.emit('log', successEntry);
                resolve(stdout);
            }
        });
    });
}

// Database sync function
async function syncDatabase() {
    if (syncStatus.isRunning) {
        logger.warn('Sync already in progress');
        return;
    }

    syncStatus.isRunning = true;
    syncStatus.logs = [];
    io.emit('statusUpdate', syncStatus);

    try {
        // Clean backup directory
        await executeCommand(`docker exec -t ${PROD_DB_CONTAINER} bash -c "cd /mnt/backup && rm -rf *"`, 'Cleaning backup directory');
        
        // Create database backup
        await executeCommand(`docker exec -t ${PROD_DB_CONTAINER} mariabackup --backup --target-dir=/mnt/backup/ --databases-exclude ${EXCLUDED_DATABASES} --user root -p${MYSQL_ROOT_PASSWORD}`, 'Creating database backup');
        
        // Prepare backup for restore
        await executeCommand(`docker exec -t ${PROD_DB_CONTAINER} mariabackup --prepare --target-dir=/mnt/backup`, 'Preparing backup for restore');
        
        // Stop staging database
        await executeCommand(`docker stop ${DEV_DB_CONTAINER}`, 'Stopping staging database');
        
        // Clean staging database files via mounted volume (directly from web_ui container)
        await executeCommand('rm -rf /staging_db_data/*', 'Cleaning staging database files');
        
        // Restore database via mounted volume
        await executeCommand(`docker exec -t ${DEV_DB_CONTAINER} mariabackup --move-back --target-dir=/mnt/backup`, 'Restoring database');
        
        // Fix permissions
        await executeCommand(`docker exec -t ${DEV_DB_CONTAINER} chown -R mysql:mysql /var/lib/mysql`, 'Fixing database permissions');
        
        // Start database service
        await executeCommand(`docker start ${DEV_DB_CONTAINER}`, 'Starting staging database');
        
        // Wait for database to be ready
        await executeCommand('sleep 10', 'Waiting for database restart');
        
        // Execute post-restore SQL files from directory if it exists
        if (POST_RESTORE_SQL_DIR && POST_RESTORE_SQL_DIR.trim()) {
            try {
                // Check if directory exists
                await executeCommand(`test -d ${POST_RESTORE_SQL_DIR}`, 'Checking if post-restore SQL directory exists');
                
                // Get list of SQL files in directory (sorted alphabetically)
                const result = await executeCommand(`find ${POST_RESTORE_SQL_DIR} -name "*.sql" -type f | sort`, 'Finding SQL files in post-restore directory');
                const sqlFiles = result.trim().split('\n').filter(file => file.trim() !== '');
                
                if (sqlFiles.length > 0) {
                    for (const sqlFile of sqlFiles) {
                        const fileName = sqlFile.split('/').pop();
                        await executeCommand(`docker cp ${sqlFile} ${DEV_DB_CONTAINER}:/tmp/${fileName}`, `Copying ${fileName}`);
                        await executeCommand(`docker exec -i ${DEV_DB_CONTAINER} mariadb -u root -p${MYSQL_ROOT_PASSWORD} < /tmp/${fileName}`, `Executing ${fileName}`);
                    }
                    
                    const successEntry = { 
                        timestamp: new Date().toISOString(), 
                        type: 'success', 
                        message: `Executed ${sqlFiles.length} post-restore SQL files` 
                    };
                    syncStatus.logs.push(successEntry);
                    logger.info(successEntry.message);
                    io.emit('log', successEntry);
                } else {
                    const infoEntry = { 
                        timestamp: new Date().toISOString(), 
                        type: 'info', 
                        message: 'No SQL files found in post-restore directory' 
                    };
                    syncStatus.logs.push(infoEntry);
                    logger.info(infoEntry.message);
                    io.emit('log', infoEntry);
                }
            } catch (error) {
                // Log warning but don't fail the entire sync
                const warningEntry = { 
                    timestamp: new Date().toISOString(), 
                    type: 'warning', 
                    message: `Post-restore SQL execution failed or directory not found: ${POST_RESTORE_SQL_DIR}` 
                };
                syncStatus.logs.push(warningEntry);
                logger.warn(warningEntry.message);
                io.emit('log', warningEntry);
            }
        } else {
            const infoEntry = { 
                timestamp: new Date().toISOString(), 
                type: 'info', 
                message: 'Post-restore SQL execution skipped (not configured)' 
            };
            syncStatus.logs.push(infoEntry);
            logger.info(infoEntry.message);
            io.emit('log', infoEntry);
        }

        syncStatus.lastRun = new Date().toISOString();
        logger.info('Database sync completed successfully');
        
    } catch (error) {
        logger.error('Database sync failed:', error.message);
    } finally {
        syncStatus.isRunning = false;
        io.emit('statusUpdate', syncStatus);
    }
}

// Cron job
let cronTask = null;

function setupCronJob() {
    if (cronTask) cronTask.stop();
    
    if (syncStatus.cronEnabled) {
        cronTask = cron.schedule(syncStatus.cronSchedule, () => {
            logger.info('Scheduled sync triggered');
            syncDatabase();
        });
        logger.info(`Cron scheduled: ${syncStatus.cronSchedule}`);
    }
}

// API Routes
app.get('/api/status', (req, res) => {
    res.json(syncStatus);
});

app.post('/api/sync', (req, res) => {
    if (syncStatus.isRunning) {
        return res.status(409).json({ error: 'Sync already running' });
    }
    
    logger.info('Manual sync triggered');
    syncDatabase();
    res.json({ message: 'Sync started' });
});

app.post('/api/config', (req, res) => {
    const { cronEnabled, cronSchedule } = req.body;
    
    if (cronEnabled !== undefined) {
        syncStatus.cronEnabled = cronEnabled;
    }
    
    if (cronSchedule && cron.validate(cronSchedule)) {
        syncStatus.cronSchedule = cronSchedule;
    }
    
    setupCronJob();
    res.json({ message: 'Config updated' });
});

app.get('/api/logs', (req, res) => {
    res.json(syncStatus.logs);
});

// WebSocket
io.on('connection', (socket) => {
    socket.emit('statusUpdate', syncStatus);
    socket.emit('logs', syncStatus.logs);
});

// Initialize
setupCronJob();

server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    if (cronTask) cronTask.stop();
    server.close(() => process.exit(0));
});
