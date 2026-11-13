# Project Agent Guidelines

## Supabase Database & Table Access Rules

Whenever creating a new table or accessing tables in Supabase via SQL migrations or PostgREST API, **always** apply the following rules:

1. **Explicit `GRANT` Permissions for PostgREST Roles (`anon`, `authenticated`)**
   - Always include explicit `GRANT` SQL statements so that `anon` and `authenticated` roles can access the table through the PostgREST API (while relying on RLS policies to enforce actual row-level access control):
     - `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO anon, authenticated;`
     - If the table uses sequences (e.g., `SERIAL` / `BIGSERIAL`), also grant sequence usage:
       `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;`

2. **Mandatory Row Level Security (RLS) & `authenticated` Policies**
   - Always enable Row Level Security on every created table:
     `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;`
   - Always create RLS policies so that **only authenticated users (`authenticated`)** can read and write rows (e.g., scoped to `auth.uid()` for user-owned data, or `TO authenticated` as appropriate):
     - Never leave a table without RLS enabled or with overly permissive `TO anon` / `TO public` write policies.

### Standard SQL Template for New Tables

```sql
CREATE TABLE IF NOT EXISTS public.<table_name> (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1. Enable RLS
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- 2. Explicit PostgREST Role Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO anon, authenticated;

-- 3. Authenticated-only RLS Policies
CREATE POLICY "Authenticated users can select own rows"
  ON public.<table_name>
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own rows"
  ON public.<table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own rows"
  ON public.<table_name>
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own rows"
  ON public.<table_name>
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```
