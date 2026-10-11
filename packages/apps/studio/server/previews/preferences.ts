/** Studio owns preview preferences; the projects plugin's issue schema stays unchanged. */
import type { DatabaseConnection } from '@nocobase/db';

export async function previewNotRequired(
  conn: DatabaseConnection,
  issueId: string,
): Promise<boolean> {
  const row = await conn
    .repository('studioIssuePreviewPreferences')
    .findOne({ filter: { issueId } });
  return row?.notRequired === true;
}

export async function setPreviewNotRequired(
  conn: DatabaseConnection,
  issueId: string,
  notRequired: boolean,
): Promise<void> {
  await conn.repository('studioIssuePreviewPreferences').upsertOne({
    filter: { issueId },
    create: { issueId, notRequired },
    update: { notRequired },
  });
}

export interface PreviewLabelState {
  readonly pullRequestId: string;
  readonly managed: boolean;
  readonly present: boolean | null;
  readonly failed: boolean;
}

/** The observation and its validator belong to the same GitHub response. */
export interface PreviewLabelSnapshot extends PreviewLabelState {
  readonly etag: string | null;
}

export async function previewLabelState(
  conn: DatabaseConnection,
  pullRequestId: string,
): Promise<PreviewLabelState> {
  const { etag: _etag, ...state } = await previewLabelSnapshot(
    conn,
    pullRequestId,
  );
  return state;
}

export async function previewLabelSnapshot(
  conn: DatabaseConnection,
  pullRequestId: string,
): Promise<PreviewLabelSnapshot> {
  const row = await conn
    .repository('studioPreviewLabels')
    .findOne({ filter: { pullRequestId } });
  return {
    pullRequestId,
    managed: row?.managed === true,
    present: typeof row?.present === 'boolean' ? row.present : null,
    failed: row?.failed === true,
    etag: typeof row?.etag === 'string' ? row.etag : null,
  };
}

export async function savePreviewLabelSnapshot(
  conn: DatabaseConnection,
  state: PreviewLabelSnapshot,
): Promise<void> {
  await conn.repository('studioPreviewLabels').upsertOne({
    filter: { pullRequestId: state.pullRequestId },
    create: { ...state },
    // Ownership lasts for this PR. A stale observation from another instance must never release it, including
    // while an earlier ADD is still in flight or its outcome is unknown after a timeout.
    update: {
      ...(state.managed ? { managed: true } : {}),
      present: state.present,
      failed: state.failed,
      etag: state.etag,
    },
  });
}
