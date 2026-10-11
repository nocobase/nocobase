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

export const subjectControlId = (subject: SubjectPause['subject']): string =>
  JSON.stringify([subject.kind, subject.id]);

const PAUSE_LOOKUP_CHUNK = 50;

/**
 * The pauses of those of `subjects` that are paused, by control id. Looks them up in fixed-size chunks so no query
 * grows with the number of paused subjects or of subjects given.
 */
export async function pausesAmong(
  conn: DatabaseConnection,
  subjects: readonly SubjectPause['subject'][],
): Promise<Map<string, SubjectPause>> {
  const ids = [...new Set(subjects.map(subjectControlId))];
  const pauses = new Map<string, SubjectPause>();
  for (let start = 0; start < ids.length; start += PAUSE_LOOKUP_CHUNK) {
    const chunk = ids.slice(start, start + PAUSE_LOOKUP_CHUNK);
    const rows = await subjectControlsRepo(conn).findMany({
      filter: (f) =>
        f.and([
          f.or(chunk.map((id) => f.string('id').eq(id))),
          f.date('pausedAt').notEmpty(),
        ]),
    });
    for (const row of rows) pauses.set(row.id, toSubjectPause(row));
  }
  return pauses;
}

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
    filter: { id: subjectControlId(subject) },
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
  const id = subjectControlId(subject);
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
    filter: { id: subjectControlId(subject) },
    values: { pausedByUserId: byUserId, pausedAt: at },
  });
  return readSubjectPause(conn, subject);
}
