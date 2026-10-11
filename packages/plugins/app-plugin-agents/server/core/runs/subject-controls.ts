import type { DatabaseConnection, Repository } from '@nocobase/db';

import type { SubjectPause } from '../../../shared/runs.js';

export interface SubjectControlRecord {
  readonly id: string;
  readonly subjectKind: string;
  readonly subjectId: string;
  readonly pausedByUserId: string | null;
  readonly pausedAt: string | null;
  readonly lockAt: string;
}

export function subjectControlsRepo(
  conn: DatabaseConnection,
): Repository<SubjectControlRecord> {
  return conn.repository<SubjectControlRecord>('agSubjectControls');
}

const idOf = (subject: SubjectPause['subject']): string =>
  JSON.stringify([subject.kind, subject.id]);

export function toSubjectPause(row: SubjectControlRecord): SubjectPause {
  return {
    subject: { kind: row.subjectKind, id: row.subjectId },
    paused: row.pausedAt !== null,
    pausedBy: row.pausedByUserId,
    pausedAt:
      row.pausedAt === null ? null : new Date(row.pausedAt).toISOString(),
  };
}

export async function readSubjectPause(
  conn: DatabaseConnection,
  subject: SubjectPause['subject'],
): Promise<SubjectPause> {
  const row = await subjectControlsRepo(conn).findOne({
    filter: { id: idOf(subject) },
  });
  return row
    ? toSubjectPause(row)
    : { subject, paused: false, pausedBy: null, pausedAt: null };
}

/** Serialize claims and pause changes, including subjects with no runs yet. Keep the row after resume. */
export async function lockSubject(
  conn: DatabaseConnection,
  subject: SubjectPause['subject'],
  now: string,
): Promise<SubjectPause> {
  const id = idOf(subject);
  await subjectControlsRepo(conn).upsertOne({
    filter: { id },
    create: {
      id,
      subjectKind: subject.kind,
      subjectId: subject.id,
      pausedByUserId: null,
      pausedAt: null,
      lockAt: now,
    },
    update: { lockAt: now },
  });
  return readSubjectPause(conn, subject);
}

export async function writeSubjectPause(
  conn: DatabaseConnection,
  subject: SubjectPause['subject'],
  byUserId: string | null,
  at: string | null,
): Promise<SubjectPause> {
  await subjectControlsRepo(conn).updateMany({
    filter: { id: idOf(subject) },
    values: { pausedByUserId: byUserId, pausedAt: at },
  });
  return readSubjectPause(conn, subject);
}
