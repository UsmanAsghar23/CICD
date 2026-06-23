import { createHmac, timingSafeEqual } from "node:crypto";
import type { DeploymentStatus } from "../config.js";

const COMMENT_MARKER = "<!-- deploy-preview-bot -->";

export function verifyGitHubSignature(
  payload: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export interface PullRequestWebhook {
  action: string;
  pull_request: {
    number: number;
    head: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    full_name: string;
  };
}

export function parsePullRequestWebhook(payload: unknown): PullRequestWebhook | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const body = payload as Partial<PullRequestWebhook>;
  if (
    typeof body.action !== "string" ||
    !body.pull_request ||
    typeof body.pull_request.number !== "number" ||
    !body.pull_request.head ||
    typeof body.pull_request.head.ref !== "string" ||
    typeof body.pull_request.head.sha !== "string" ||
    !body.repository ||
    typeof body.repository.full_name !== "string"
  ) {
    return null;
  }

  return body as PullRequestWebhook;
}

function renderCommentBody(options: {
  status: DeploymentStatus;
  previewUrl?: string | null;
  commitSha: string;
}): string {
  const shortSha = options.commitSha.slice(0, 7);
  const statusLine = options.status.toUpperCase();
  const urlLine =
    options.previewUrl && options.status === "live"
      ? `[${options.previewUrl}](${options.previewUrl})`
      : "_pending deploy_";

  return `## Deploy Preview

| | |
|---|---|
| **Status** | \`${statusLine}\` |
| **Preview** | ${urlLine} |
| **Commit** | \`${shortSha}\` |

${COMMENT_MARKER}`;
}

export async function upsertPullRequestComment(options: {
  token: string;
  repo: string;
  prNumber: number;
  status: DeploymentStatus;
  previewUrl?: string | null;
  commitSha: string;
  existingCommentId?: number | null;
}): Promise<number | null> {
  if (!options.token) {
    return options.existingCommentId ?? null;
  }

  const [owner, repo] = options.repo.split("/");
  if (!owner || !repo) {
    return options.existingCommentId ?? null;
  }

  const body = renderCommentBody({
    status: options.status,
    previewUrl: options.previewUrl,
    commitSha: options.commitSha,
  });

  const headers = {
    Authorization: `Bearer ${options.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (options.existingCommentId) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${options.existingCommentId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ body }),
      },
    );

    if (response.ok) {
      return options.existingCommentId;
    }
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${options.prNumber}/comments`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ body }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub comment API failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}
