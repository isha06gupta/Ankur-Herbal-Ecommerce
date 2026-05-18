const fs = require('fs');
const path = require('path');
const { query } = require('./db');

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.migrationsTable = 'schema_migrations';
  }

  // Initialize migrations table
  async initMigrationsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        filename VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await query(createTableQuery);
    console.log('Migrations table initialized');
  }

  // Get all migration files
  getMigrationFiles() {
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    return files;
  }

  // Get executed migrations
  async getExecutedMigrations() {
    const selectQuery = `SELECT filename FROM ${this.migrationsTable}`;
    const result = await query(selectQuery);
    return result.rows.map(row => row.filename);
  }

  // Read migration file content
  readMigrationFile(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    return fs.readFileSync(filePath, 'utf8');
  }

  // Execute migration
  async executeMigration(filename) {
    try {
      console.log(`Executing migration: ${filename}`);
      const sql = this.readMigrationFile(filename);
      
      // Split SQL by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await query(statement);
        }
      }

      // Record migration as executed
      const insertQuery = `
        INSERT INTO ${this.migrationsTable} (filename)
        VALUES ($1)
        ON CONFLICT (filename) DO NOTHING
      `;
      await query(insertQuery, [filename]);

      console.log(`✓ Migration ${filename} executed successfully`);
      return true;
    } catch (error) {
      console.error(`✗ Error executing migration ${filename}:`, error);
      throw error;
    }
  }

  // Run pending migrations
  async runMigrations() {
    try {
      console.log('Running migrations...');
      await this.initMigrationsTable();
      
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('✓ All migrations executed successfully');
    } catch (error) {
      console.error('✗ Migration failed:', error);
      throw error;
    }
  }

  // Get migration status
  async getMigrationStatus() {
    try {
      await this.initMigrationsTable();
      
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const status = migrationFiles.map(file => ({
        filename: file,
        status: executedMigrations.includes(file) ? 'executed' : 'pending'
      }));

      return status;
    } catch (error) {
      console.error('Error getting migration status:', error);
      throw error;
    }
  }

  // Rollback last migration (if rollback file exists)
  async rollbackLastMigration() {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        console.log('No migrations to rollback');
        return;
      }

      const lastMigration = executedMigrations[executedMigrations.length - 1];
      const rollbackFile = lastMigration.replace('.sql', '_rollback.sql');
      const rollbackPath = path.join(this.migrationsPath, rollbackFile);

      if (!fs.existsSync(rollbackPath)) {
        console.log(`No rollback file found for ${lastMigration}`);
        return;
      }

      const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');
      await query(rollbackSql);

      // Remove migration from executed list
      const deleteQuery = `DELETE FROM ${this.migrationsTable} WHERE filename = $1`;
      await query(deleteQuery, [lastMigration]);

      console.log(`Rolled back migration: ${lastMigration}`);
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  
  runner.runMigrations()
    .then(() => {
      console.log('Migration process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = MigrationRunner;
