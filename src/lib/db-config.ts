// Nexus database configuration
// Single source of truth for the Postgres connection string.
// Update here when rotating credentials.

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.axgryqlmhbfbytdfyuke:lJBN2hBFdV2SRQqD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1";