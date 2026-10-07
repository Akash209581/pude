const { createBackup } = require('./backup');

/**
 * Starts a recurring background timer that backs up DB and uploaded files every 24 hours.
 * @param {Object} options
 * @param {boolean} options.runOnStart - Whether to trigger an initial backup when server starts
 */
function startBackupScheduler(options = { runOnStart: false }) {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  console.log('[BackupScheduler] Automated 24-hour backup scheduler initialized.');

  if (options.runOnStart) {
    console.log('[BackupScheduler] Executing initial backup on startup...');
    createBackup().catch((err) => {
      console.error('[BackupScheduler] Startup backup error:', err.message);
    });
  }

  const intervalId = setInterval(() => {
    console.log('[BackupScheduler] Triggering scheduled 24-hour backup...');
    createBackup().catch((err) => {
      console.error('[BackupScheduler] Scheduled backup failed:', err.message);
    });
  }, TWENTY_FOUR_HOURS);

  // Allow process to exit cleanly without waiting for timer
  if (intervalId.unref) {
    intervalId.unref();
  }

  return intervalId;
}

module.exports = { startBackupScheduler };