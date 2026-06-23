import type postgres from "postgres";

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number INTEGER NOT NULL,
  branch TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'live', 'failed', 'destroyed')),
  preview_url TEXT,
  github_repo TEXT NOT NULL,
  github_comment_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  destroyed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS deployments_repo_pr_idx ON deployments (github_repo, pr_number);
CREATE INDEX IF NOT EXISTS deployments_status_idx ON deployments (status);
CREATE INDEX IF NOT EXISTS deployments_created_at_idx ON deployments (created_at DESC);
`;

export async function runMigrations(sql: postgres.Sql): Promise<void> {
  await sql.unsafe(INIT_SQL);
}
