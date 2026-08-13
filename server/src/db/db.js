import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Allow tests to point at an in-memory or throwaway database file via env var.
const DB_PATH = process.env.TASKFLOW_DB_PATH || path.join(__dirname, 'taskflow.sqlite3');

const db = new Database(DB_PATH);

// SQLite does not enforce foreign keys by default - must be turned on per connection.
db.pragma('foreign_keys = ON');

// Make sure the schema exists every time we open a connection. CREATE TABLE IF NOT EXISTS
// statements make this safe to run repeatedly (e.g. on every server start, and in tests).
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

export default db;
