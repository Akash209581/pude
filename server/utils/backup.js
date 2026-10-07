const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('../config/db');

async function createBackup() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
  const backupRoot = process.env.BACKUP_DIR || '/data/backups/pudeb';
  let backupDir;
  try {
    backupDir = path.join(backupRoot, `backup_${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });
  } catch (err) {
    // Fallback to local backups folder if Linux /data/backups path is inaccessible
    backupDir = path.join(__dirname, '..', 'backups', `backup_${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const uploadsBackupDir = path.join(backupDir, 'uploads');
  const dbBackupDir = path.join(backupDir, 'database');

  fs.mkdirSync(uploadsBackupDir, { recursive: true });
  fs.mkdirSync(dbBackupDir, { recursive: true });

  console.log(`Starting backup process...`);
  console.log(`Backup Location: ${backupDir}\n`);

  // 1. Backup Database Tables to JSON & SQL format
  const tables = ['users', 'publications', 'publication_authors', 'events', 'pending_edits'];
  const fullDump = {};

  for (const table of tables) {
    try {
      const { rows } = await db.query(`SELECT * FROM ${table}`);
      fullDump[table] = rows;
      const tableFilePath = path.join(dbBackupDir, `${table}.json`);
      fs.writeFileSync(tableFilePath, JSON.stringify(rows, null, 2));
      console.log(` ✓ Exported database table '${table}' (${rows.length} records)`);
    } catch (err) {
      console.warn(` ! Note on table '${table}': ${err.message}`);
    }
  }

  const consolidatedPath = path.join(dbBackupDir, 'db_full_backup.json');
  fs.writeFileSync(consolidatedPath, JSON.stringify(fullDump, null, 2));
  console.log(` ✓ Consolidated DB backup created at db_full_backup.json`);

  // 2. Backup Uploaded Files
  const sourceUploads = path.join(__dirname, '..', 'uploads');
  let fileCount = 0;

  if (fs.existsSync(sourceUploads)) {
    const files = fs.readdirSync(sourceUploads);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const srcFile = path.join(sourceUploads, file);
      const destFile = path.join(uploadsBackupDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        fileCount++;
      }
    }
  }

  console.log(` ✓ Copying file uploads: ${fileCount} files backed up to uploads/`);
  console.log(`\n==================================================`);
  console.log(`BACKUP COMPLETED SUCCESSFULLY!`);
  console.log(`Location: ${backupDir}`);
  console.log(`==================================================\n`);

  return { backupDir, timestamp, fileCount, tablesExported: Object.keys(fullDump).length };
}

if (require.main === module) {
  createBackup()
    .then(async () => {
      await db.pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Backup failed:', error);
      try { await db.pool.end(); } catch (_) {}
      process.exit(1);
    });
}

module.exports = { createBackup };
