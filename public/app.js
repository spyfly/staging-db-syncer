// Socket.io connection
const socket = io();

// DOM elements
const currentStatus = document.getElementById('currentStatus');
const lastRun = document.getElementById('lastRun');
const syncButton = document.getElementById('syncButton');
const cronEnabled = document.getElementById('cronEnabled');
const cronSchedule = document.getElementById('cronSchedule');
const saveConfig = document.getElementById('saveConfig');
const logContainer = document.getElementById('logContainer');

// Socket event handlers
socket.on('statusUpdate', (status) => {
    updateStatus(status);
});

socket.on('log', (logEntry) => {
    addLogEntry(logEntry);
});

socket.on('logs', (logs) => {
    clearLogContainer();
    logs.forEach(log => addLogEntry(log));
});

// Update status
function updateStatus(status) {
    if (status.isRunning) {
        currentStatus.textContent = 'Running';
        currentStatus.className = 'badge bg-warning';
        syncButton.disabled = true;
        syncButton.textContent = 'Syncing...';
    } else {
        currentStatus.textContent = 'Idle';
        currentStatus.className = 'badge bg-success';
        syncButton.disabled = false;
        syncButton.textContent = 'Start Sync';
    }

    if (status.lastRun) {
        lastRun.textContent = new Date(status.lastRun).toLocaleString();
    } else {
        lastRun.textContent = 'Never';
    }

    cronEnabled.checked = status.cronEnabled;
    cronSchedule.value = status.cronSchedule || '';
}

// Log management
function addLogEntry(logEntry) {
    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${logEntry.type}`;
    
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    logElement.innerHTML = `<strong>[${timestamp}]</strong> ${logEntry.message}`;
    
    // Remove "No logs available" message
    const noLogsMessage = logContainer.querySelector('.text-muted');
    if (noLogsMessage) {
        noLogsMessage.remove();
    }
    
    logContainer.appendChild(logElement);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Keep only last 50 entries
    const logEntries = logContainer.querySelectorAll('.log-entry');
    if (logEntries.length > 50) {
        logEntries[0].remove();
    }
}

function clearLogContainer() {
    logContainer.innerHTML = '<div class="text-muted">No logs available</div>';
}

// Event handlers
syncButton.addEventListener('click', () => {
    fetch('/api/sync', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            }
        });
});

saveConfig.addEventListener('click', () => {
    const config = {
        cronEnabled: cronEnabled.checked,
        cronSchedule: cronSchedule.value.trim()
    };
    
    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Configuration saved');
            }
        });
});

// Initial load
fetch('/api/status')
    .then(response => response.json())
    .then(status => updateStatus(status));

fetch('/api/logs')
    .then(response => response.json())
    .then(logs => {
        clearLogContainer();
        logs.forEach(log => addLogEntry(log));
    });
