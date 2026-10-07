import 'dotenv/config'
import {neon} from '@neondatabase/serverless'
import {readMigrationFiles} from 'drizzle-orm/migrator'

// Apply the existing Drizzle migration journal over Neon HTTP in one transaction.
// The advisory lock and in-transaction journal checks serialize concurrent runs.
async function migrate(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required')
 const client=neon(process.env.DATABASE_URL)
 const migrations=readMigrationFiles({migrationsFolder:'./drizzle'})
 const commands=[client.query("select pg_advisory_xact_lock(hashtext('nova-drizzle-migrations'))"),client.query('CREATE SCHEMA IF NOT EXISTS drizzle'),client.query('CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)')]
 for(const migration of migrations){
  if(!/^[a-f0-9]+$/.test(migration.hash)||!Number.isSafeInteger(migration.folderMillis))throw new Error('Invalid migration metadata')
  const statements=migration.sql.map(s=>s.trim()).filter(Boolean).map(s=>s.replace(/;+$/,'')+';').join('\n')
  commands.push(client.query(`DO $nova_migration$ BEGIN
    IF EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at=${migration.folderMillis} AND hash <> '${migration.hash}') THEN
      RAISE EXCEPTION 'Migration checksum mismatch; restore the original migration file';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at=${migration.folderMillis}) THEN
      ${statements}
      INSERT INTO drizzle.__drizzle_migrations (hash,created_at) VALUES ('${migration.hash}',${migration.folderMillis});
    END IF;
  END $nova_migration$;`))
 }
 await client.transaction(commands)
 console.log(`Verified/applied ${migrations.length} Drizzle migrations atomically over Neon HTTP.`)
}
migrate().catch(error=>{console.error('Migration failed:',error instanceof Error?error.message:'Unknown error');process.exitCode=1})
