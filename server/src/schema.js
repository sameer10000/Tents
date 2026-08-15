/**
 * Applies schema.sql to the configured Supabase database.
 *
 *   npm run db:schema
 *
 * Idempotent — every statement is CREATE IF NOT EXISTS or an ALTER that
 * settles to the same state, so re-running it is a no-op rather than an error.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { sql, closeDb } from './db.js'

const here = dirname(import.meta.filename)

export async function applySchema() {
  const ddl = readFileSync(join(here, 'schema.sql'), 'utf8')
  // .simple() is required for multi-statement SQL — the extended protocol
  // postgres.js uses by default accepts exactly one statement per round trip.
  // Safe here because the DDL carries no parameters.
  await sql.unsafe(ddl).simple()
}

// Only when run directly, so importing applySchema elsewhere does not connect.
// Compared as resolved paths — argv[1] arrives relative on Windows.
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  try {
    await applySchema()
    console.log('  Schema applied.')
  } finally {
    await closeDb()
  }
}
