-- Enable Row Level Security on every application table in public.
-- The API accesses PostgreSQL through Prisma using the server-side DATABASE_URL.
-- No anon/authenticated policies are created intentionally: clients must go through
-- the authenticated NestJS API, not read application tables directly from Supabase REST.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 'public', t.tablename);
  END LOOP;
END $$;
