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

export async function previewLabelState(
  conn: DatabaseConnection,
  pullRequestId: string,
): Promise<PreviewLabelState> {
  const row = await conn
    .repository('studioPreviewLabels')
    .findOne({ filter: { pullRequestId } });
  return {
    pullRequestId,
    managed: row?.managed === true,
    present: typeof row?.present === 'boolean' ? row.present : null,
    failed: row?.failed === true,
  };
}

export async function savePreviewLabelState(
  conn: DatabaseConnection,
  state: PreviewLabelState,
): Promise<void> {
  await conn.repository('studioPreviewLabels').upsertOne({
    filter: { pullRequestId: state.pullRequestId },
    create: { ...state },
    update: { ...state },
  });
}
