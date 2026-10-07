import type { DatabaseConnection } from '@nocobase/db';

import type { Color } from '../../../shared/common.js';
import type { Label } from '../../../shared/labels.js';
import { oneOf, unique } from '../../kernel/db.js';

export const LABELS = 'pmLabels';

interface LabelRecord extends Label {
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

const labels = (conn: DatabaseConnection) =>
  conn.repository<LabelRecord>(LABELS);

const FIELDS = ['id', 'name', 'color'] as const;

export async function listLabels(conn: DatabaseConnection): Promise<Label[]> {
  return labels(conn).findMany({
    select: (select) => select.fields(...FIELDS),
    sort: (sort) => sort.field('name').asc(),
  });
}

export function findLabel(
  conn: DatabaseConnection,
  id: string,
): Promise<Label | undefined> {
  return labels(conn).findOne({
    filter: { id },
    select: (select) => select.fields(...FIELDS),
  });
}

/** The ids among `ids` that name a label. */
export async function existingLabelIds(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Set<string>> {
  const wanted = unique(ids);
  if (wanted.length === 0) return new Set();
  const rows = await labels(conn).findMany({
    filter: (f) => oneOf(f, 'id', wanted),
    select: (select) => select.fields('id'),
  });
  return new Set(rows.map((row) => row.id));
}

export async function insertLabel(
  conn: DatabaseConnection,
  label: Label,
): Promise<void> {
  const now = new Date();
  await labels(conn).createOne({
    values: { ...label, createdAt: now, updatedAt: now },
  });
}

export async function updateLabel(
  conn: DatabaseConnection,
  id: string,
  values: Partial<{ name: string; color: Color }>,
): Promise<void> {
  await labels(conn).updateOne({
    filter: { id },
    values: { ...values, updatedAt: new Date() },
  });
}

/** Deletes the label; its links to issues go with it (`pmIssueLabels` cascades). */
export async function deleteLabel(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await labels(conn).deleteOne({ filter: { id } });
}
