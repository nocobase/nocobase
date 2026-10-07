/**
 * `pmIssueChecklistItems`: each issue's copy of the checklist of a status it entered, one row per item.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { ChecklistItemDefinition } from '../../../shared/workflows.js';

export const CHECKLIST_ITEMS = 'pmIssueChecklistItems';

export interface ChecklistItemRecord {
  readonly id: string;
  readonly issueId: string;
  readonly statusKey: string;
  readonly itemKey: string;
  readonly label: string;
  readonly required: boolean | number;
  readonly position: number;
  /** A kind's key (`shared/kinds.ts`). */
  readonly checkedByType: string | null;
  readonly checkedById: string | null;
  readonly checkedAt: Date | string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

const items = (conn: DatabaseConnection) =>
  conn.repository<ChecklistItemRecord>(CHECKLIST_ITEMS);

/** The issue's items, of one status or of all, in the order they were added and then by position. */
export async function findItems(
  conn: DatabaseConnection,
  issueId: string,
  statusKey?: string,
): Promise<ChecklistItemRecord[]> {
  return items(conn).findMany({
    filter: statusKey === undefined ? { issueId } : { issueId, statusKey },
    sort: (sort) => [
      sort.field('createdAt').asc(),
      sort.field('position').asc(),
    ],
  });
}

/** Adds the items the issue's copy of `statusKey` lacks; returns how many. */
export async function addMissingItems(
  conn: DatabaseConnection,
  nextId: () => string,
  issueId: string,
  statusKey: string,
  definitions: readonly ChecklistItemDefinition[],
): Promise<number> {
  const have = new Set(
    (await findItems(conn, issueId, statusKey)).map((item) => item.itemKey),
  );
  const now = new Date();
  let added = 0;
  for (const [position, item] of definitions.entries()) {
    if (have.has(item.key)) continue;
    await items(conn).createOne({
      values: {
        id: nextId(),
        issueId,
        statusKey,
        itemKey: item.key,
        label: item.label,
        required: item.required,
        position,
        checkedByType: null,
        checkedById: null,
        checkedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });
    added += 1;
  }
  return added;
}

/** The labels of the required items of `statusKey` nobody checked yet. */
export async function uncheckedRequired(
  conn: DatabaseConnection,
  issueId: string,
  statusKey: string,
): Promise<string[]> {
  const rows = await items(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('issueId').eq(issueId),
        f.string('statusKey').eq(statusKey),
        f.boolean('required').isTrue(),
        f.date('checkedAt').empty(),
      ]),
    sort: (sort) => sort.field('position').asc(),
    select: (select) => select.fields('label'),
  });
  return rows.map((row) => row.label);
}

export async function setChecked(
  conn: DatabaseConnection,
  id: string,
  checkedBy: { readonly type: string; readonly id: string } | null,
): Promise<void> {
  await items(conn).updateOne({
    filter: { id },
    values: {
      checkedByType: checkedBy?.type ?? null,
      checkedById: checkedBy?.id ?? null,
      checkedAt: checkedBy ? new Date() : null,
      updatedAt: new Date(),
    },
  });
}
