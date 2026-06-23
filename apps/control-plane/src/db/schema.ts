import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const deployments = pgTable(
  "deployments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prNumber: integer("pr_number").notNull(),
    branch: text("branch").notNull(),
    commitSha: text("commit_sha").notNull(),
    status: text("status").notNull(),
    previewUrl: text("preview_url"),
    githubRepo: text("github_repo").notNull(),
    githubCommentId: integer("github_comment_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    destroyedAt: timestamp("destroyed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("deployments_repo_pr_idx").on(table.githubRepo, table.prNumber)],
);

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
