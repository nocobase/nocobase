/**
 * Drafts from AI (`shared/intake-ai.ts`) as plan rows, and back. Pure: no database.
 *
 * - `normalizeDrafts` checks what an organiser handed back and tidies it as the old NocoProject did: drafts are
 *   numbered again from 1, untitled ones dropped, a parent must come earlier, a stage stays only on a sub-issue (or on
 *   every draft of a breakdown, which is flat), and at most `PLAN_ROWS_MAX` are kept.
 * - `draftsOfPlan` reads a draft (a pending intake plan) as the drafts a revision starts from.
 * - `rowsOfDrafts` makes the `issue.create` rows. A revised draft keeps what AI never sees of the draft it came from
 *   (`from`): its project, executor, owner, dates and status. A breakdown's top-level drafts become sub-issues of its
 *   issue, in its project.
 * - `changesOf` says which rows a revision added or changed, and which drafts it removed.
 */
import { PRIORITIES, type Priority } from '../../../../shared/common.js';
import {
  INTAKE_AI_DESCRIPTION_MAX,
  INTAKE_AI_TITLE_MAX,
  type IntakeAiChanges,
  type IntakeAiDraft,
  type IntakeRowChange,
} from '../../../../shared/intake-ai.js';
import type { Label } from '../../../../shared/labels.js';
import {
  PLAN_ROWS_MAX,
  type IssueCreateParams,
  type PlanRow,
  type PlanRowInput,
} from '../../../../shared/plans.js';
import { invalid } from '../../../kernel/errors.js';

/** A draft after `normalizeDrafts`: numbered 1…n, with every optional field settled. */
export interface CleanDraft {
  readonly position: number;
  readonly parentPosition: number | null;
  readonly from: number | null;
  readonly title: string;
  readonly description: string | null;
  readonly priority: Priority | null;
  readonly labels: readonly string[];
  readonly stage: number | null;
}

const isInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value);

function fail(index: number, message: string): never {
  throw invalid('INVALID_DRAFTS', `drafts[${index}]: ${message}`);
}

/** One raw draft, checked field by field; the errors name the draft, so an organiser can correct its file. */
function readDraft(value: unknown, index: number): IntakeAiDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail(index, 'must be an object.');
  const draft = value as Record<string, unknown>;
  if (!isInt(draft.position)) fail(index, 'position must be an integer.');
  const parent = draft.parentPosition ?? null;
  if (parent !== null && !isInt(parent))
    fail(index, 'parentPosition must be an integer or null.');
  const from = draft.from ?? null;
  if (from !== null && !isInt(from))
    fail(index, 'from must be an integer or null.');
  if (typeof draft.title !== 'string') fail(index, 'title must be a string.');
  const description = draft.description ?? null;
  if (description !== null && typeof description !== 'string')
    fail(index, 'description must be a string or null.');
  const priority = draft.priority ?? null;
  if (
    priority !== null &&
    !(PRIORITIES as readonly unknown[]).includes(priority)
  )
    fail(index, `priority must be one of ${PRIORITIES.join(', ')} or null.`);
  const labels = draft.labels ?? null;
  if (
    labels !== null &&
    (!Array.isArray(labels) ||
      labels.some((label) => typeof label !== 'string'))
  )
    fail(index, 'labels must be an array of names or null.');
  const stage = draft.stage ?? null;
  if (stage !== null && (!isInt(stage) || stage < 0 || stage > 1000))
    fail(index, 'stage must be an integer from 0 to 1000, or null.');
  return {
    position: draft.position,
    parentPosition: parent,
    from: from,
    title: draft.title,
    description: description,
    priority: priority as Priority | null,
    labels: labels as string[] | null,
    stage: stage,
  };
}

/**
 * The drafts an organiser handed back, checked and tidied; `dropped` counts those past `PLAN_ROWS_MAX`. `flat` keeps
 * every draft at the top (a breakdown's sub-issues), where a stage still orders them.
 */
export function normalizeDrafts(
  value: unknown,
  options: { readonly flat: boolean },
): { readonly drafts: CleanDraft[]; readonly dropped: number } {
  if (!Array.isArray(value) || value.length === 0)
    throw invalid('INVALID_DRAFTS', 'drafts must be a non-empty array.');
  const raw = value.map(readDraft);
  const renumbered = new Map<number, number>();
  const drafts: CleanDraft[] = [];
  let dropped = 0;
  for (const item of raw) {
    const title = item.title
      .replace(/\s+/gu, ' ')
      .trim()
      .slice(0, INTAKE_AI_TITLE_MAX);
    if (!title) continue;
    if (drafts.length >= PLAN_ROWS_MAX) {
      dropped += 1;
      continue;
    }
    const position = drafts.length + 1;
    if (!renumbered.has(item.position)) renumbered.set(item.position, position);
    const mapped =
      options.flat || item.parentPosition === null
        ? null
        : (renumbered.get(item.parentPosition) ?? null);
    const parentPosition = mapped !== null && mapped < position ? mapped : null;
    const labels = [
      ...new Set(
        (item.labels ?? []).map((label) => label.trim()).filter(Boolean),
      ),
    ];
    const description = item.description?.trim() ?? '';
    drafts.push({
      position,
      parentPosition,
      from: item.from ?? null,
      title,
      description: description
        ? description.slice(0, INTAKE_AI_DESCRIPTION_MAX)
        : null,
      priority:
        item.priority && item.priority !== 'none' ? item.priority : null,
      labels,
      stage:
        typeof item.stage === 'number' &&
        (parentPosition !== null || options.flat)
          ? item.stage
          : null,
    });
  }
  if (drafts.length === 0)
    throw invalid('INVALID_DRAFTS', 'Every draft needs a title.');
  return { drafts, dropped };
}

const asRecord = (value: unknown): Readonly<Record<string, unknown>> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const refOf = (value: unknown): string | null => {
  const ref = asRecord(value).ref;
  return typeof ref === 'string' ? ref : null;
};

/** A draft of the plan being revised: what AI sees of it, and the row it is. */
export interface BaseDraft {
  readonly draft: CleanDraft;
  readonly row: PlanRow;
  readonly params: Readonly<Record<string, unknown>>;
}

/**
 * The open intake plan's rows as drafts, in order (`position` is the row's place, from 1). Only `issue.create` rows
 * can be revised; any other row refuses the revision.
 */
export function draftsOfPlan(
  rows: readonly PlanRow[],
  labels: readonly Label[],
): BaseDraft[] {
  const names = new Map(labels.map((label) => [label.id, label.name]));
  const positions = new Map<string, number>();
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row, index) => {
      if (row.op !== 'issue.create')
        throw invalid(
          'INVALID_INTAKE',
          'Only a draft of new issues can be revised.',
        );
      const position = index + 1;
      if (row.ref) positions.set(row.ref, position);
      const params = asRecord(row.params);
      const parentRef = refOf(params.parentIssueId);
      const labelIds = Array.isArray(params.labelIds) ? params.labelIds : [];
      return {
        row,
        params,
        draft: {
          position,
          parentPosition: parentRef ? (positions.get(parentRef) ?? null) : null,
          from: null,
          title: typeof params.title === 'string' ? params.title : '',
          description:
            typeof params.description === 'string' && params.description
              ? params.description
              : null,
          priority:
            typeof params.priority === 'string' && params.priority !== 'none'
              ? (params.priority as Priority)
              : null,
          labels: labelIds
            .map((id) => names.get(String(id)))
            .filter((name): name is string => Boolean(name)),
          stage: typeof params.stage === 'number' ? params.stage : null,
        },
      };
    });
}

/** What a revised draft keeps of the draft it came from: what AI never sees. */
const CARRIED = [
  'projectId',
  'executor',
  'ownerUserId',
  'startDate',
  'dueDate',
  'statusKey',
  'start',
] as const;

export const refOfPosition = (position: number): string => `r${position}`;

export function rowsOfDrafts(
  drafts: readonly CleanDraft[],
  options: {
    readonly labels: readonly Label[];
    /** The project of drafts that carry none. */
    readonly projectId: string | null;
    /** A breakdown: top-level drafts become sub-issues of this issue. */
    readonly parentIssueId?: string | null;
    /** A revision: the drafts it started from, by position. */
    readonly base?: readonly BaseDraft[];
  },
): { readonly rows: PlanRowInput[]; readonly unknownLabels: string[] } {
  const byName = new Map(
    options.labels.map((label) => [label.name.toLowerCase(), label.id]),
  );
  const base = new Map(
    (options.base ?? []).map((entry) => [entry.draft.position, entry]),
  );
  const unknown = new Set<string>();
  const rows = drafts.map((draft): PlanRowInput => {
    const labelIds: string[] = [];
    for (const name of draft.labels) {
      const id = byName.get(name.toLowerCase());
      if (id) {
        if (!labelIds.includes(id)) labelIds.push(id);
      } else unknown.add(name);
    }
    const carried: Record<string, unknown> = {};
    const source = draft.from === null ? undefined : base.get(draft.from);
    if (source)
      for (const key of CARRIED)
        if (source.params[key] !== undefined) carried[key] = source.params[key];
    const parent =
      draft.parentPosition !== null
        ? { ref: refOfPosition(draft.parentPosition) }
        : (options.parentIssueId ?? undefined);
    const projectId = carried.projectId ?? options.projectId ?? undefined;
    const params = {
      ...carried,
      title: draft.title,
      ...(draft.description ? { description: draft.description } : {}),
      ...(projectId ? { projectId } : {}),
      ...(parent === undefined ? {} : { parentIssueId: parent }),
      ...(draft.priority ? { priority: draft.priority } : {}),
      ...(labelIds.length > 0 ? { labelIds } : {}),
      ...(draft.stage !== null && parent !== undefined
        ? { stage: draft.stage }
        : {}),
    } as IssueCreateParams;
    return {
      op: 'issue.create',
      ref: refOfPosition(draft.position),
      params,
    };
  });
  return { rows, unknownLabels: [...unknown] };
}

/** The fields AI writes, apart from the parent, are the same. */
function sameFields(a: CleanDraft, b: CleanDraft): boolean {
  const labels = (draft: CleanDraft) =>
    [...draft.labels]
      .map((label) => label.toLowerCase())
      .sort()
      .join('\n');
  return (
    a.title === b.title &&
    (a.description ?? '') === (b.description ?? '') &&
    a.priority === b.priority &&
    labels(a) === labels(b) &&
    a.stage === b.stage
  );
}

/** Which of the revised drafts are new or changed (by their row's ref), and which drafts were removed. */
export function changesOf(
  before: readonly BaseDraft[],
  after: readonly CleanDraft[],
): IntakeAiChanges {
  const old = new Map(
    before.map((entry) => [entry.draft.position, entry.draft]),
  );
  const fromOf = new Map(after.map((draft) => [draft.position, draft.from]));
  const used = new Set<number>();
  const rows: Record<string, IntakeRowChange> = {};
  for (const draft of after) {
    const source = draft.from === null ? undefined : old.get(draft.from);
    if (!source || used.has(source.position)) {
      rows[refOfPosition(draft.position)] = 'added';
      continue;
    }
    used.add(source.position);
    const parentFrom =
      draft.parentPosition === null
        ? null
        : (fromOf.get(draft.parentPosition) ?? -1);
    if (!sameFields(source, draft) || parentFrom !== source.parentPosition)
      rows[refOfPosition(draft.position)] = 'changed';
  }
  return {
    rows,
    removed: before
      .filter((entry) => !used.has(entry.draft.position))
      .map((entry) => entry.draft.title),
  };
}

/**
 * The files of the revised plan's source: each goes with the first revised draft taken from the draft it went with,
 * the others to the plan's first issue.
 */
export function remapFileRefs(
  fileRefs: Readonly<Record<string, string>> | undefined,
  before: readonly BaseDraft[],
  after: readonly CleanDraft[],
): Record<string, string> | undefined {
  if (!fileRefs) return undefined;
  const positionOfRef = new Map(
    before.flatMap((entry) =>
      entry.row.ref ? [[entry.row.ref, entry.draft.position] as const] : [],
    ),
  );
  const next: Record<string, string> = {};
  for (const [fileId, ref] of Object.entries(fileRefs)) {
    const position = positionOfRef.get(ref);
    const target = after.find((draft) => draft.from === position);
    if (position !== undefined && target)
      next[fileId] = refOfPosition(target.position);
  }
  return Object.keys(next).length > 0 ? next : undefined;
}
