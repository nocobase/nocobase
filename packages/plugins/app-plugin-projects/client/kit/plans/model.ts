/**
 * Plans as pure data, for the card and the editor: the state a plan is in (an open plan past its expiry reads as
 * expired), what may be done with it, the rows with the person's unsaved edits applied, the tree the `issue.create`
 * rows form, moving a row in or out of that tree, which rows ask for a second confirmation, and the `PATCH` body of
 * the edits.
 */
import {
  PLAN_OPEN_STATUSES,
  type EditPlanRequest,
  type IssueCreateParams,
  type Plan,
  type PlanObjectRef,
  type PlanRiskFlag,
  type PlanRow,
  type PlanStatus,
} from '../../../shared/plans.js';

/** An unsaved change to one row. */
export interface RowEdit {
  /** Replaces the row's params. */
  readonly params?: Readonly<Record<string, unknown>>;
  readonly remove?: boolean;
}

/** By row id. */
export type PlanEdits = ReadonlyMap<string, RowEdit>;

export interface RowView {
  readonly row: PlanRow;
  /** The params with the edit applied. */
  readonly params: Readonly<Record<string, unknown>>;
  readonly removed: boolean;
  readonly edited: boolean;
  /** How deep an `issue.create` row sits under the rows it was created under; 0 otherwise. */
  readonly depth: number;
}

export function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** The ref an issue or project target names, if it names an earlier row. */
export function refOf(value: unknown): string | null {
  const record = asRecord(value);
  return typeof record.ref === 'string' ? record.ref : null;
}

/** A plan's own page. */
export function planHref(planId: string): string {
  return `/issues/plans/${encodeURIComponent(planId)}`;
}

/** The state to show: an open plan past its expiry is expired, whatever the server last wrote. */
export function effectiveStatus(
  plan: Plan,
  now: number = Date.now(),
): PlanStatus {
  if (
    PLAN_OPEN_STATUSES.includes(plan.status) &&
    Date.parse(plan.expiresAt) <= now
  )
    return 'expired';
  return plan.status;
}

export interface PlanAbilities {
  /** Edit rows (open plans). */
  readonly edit: boolean;
  readonly execute: boolean;
  /** Rehearse a failed or stale plan again. */
  readonly retry: boolean;
  readonly void: boolean;
  /** Within the undo window, for the person who executed it. */
  readonly undo: boolean;
}

export function abilitiesOf(
  plan: Plan,
  viewerId: string | null,
  now: number = Date.now(),
): PlanAbilities {
  const status = effectiveStatus(plan, now);
  const open = PLAN_OPEN_STATUSES.includes(status);
  return {
    edit: open,
    execute: status === 'pending',
    retry: status === 'failed' || status === 'stale',
    void: open,
    undo:
      status === 'executed' &&
      plan.undoableUntil !== null &&
      Date.parse(plan.undoableUntil) > now &&
      (viewerId === null || plan.executedById === viewerId),
  };
}

/** Whole hours (at least 1) until `iso`, or 0 once it has passed. */
export function hoursLeft(
  iso: string | null,
  now: number = Date.now(),
): number {
  if (!iso) return 0;
  const ms = Date.parse(iso) - now;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(1, Math.round(ms / 3_600_000));
}

export function rowViews(
  rows: readonly PlanRow[],
  edits: PlanEdits = new Map(),
): RowView[] {
  const depthByRef = new Map<string, number>();
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => {
      const edit = edits.get(row.id);
      const params = asRecord(edit?.params ?? row.params);
      let depth = 0;
      if (row.op === 'issue.create') {
        const parent = refOf(params.parentIssueId);
        depth = parent === null ? 0 : (depthByRef.get(parent) ?? -1) + 1;
        if (row.ref) depthByRef.set(row.ref, depth);
      }
      return {
        row,
        params,
        removed: edit?.remove === true,
        edited: edit !== undefined,
        depth,
      };
    });
}

/** The refs that rows still in the plan point at: their rows cannot be removed. */
export function referencedRefs(views: readonly RowView[]): ReadonlySet<string> {
  const used = new Set<string>();
  const add = (value: unknown) => {
    for (const item of Array.isArray(value) ? value : [value]) {
      const ref = refOf(item);
      if (ref) used.add(ref);
    }
  };
  for (const view of views) {
    if (view.removed) continue;
    const { params } = view;
    add(params.parentIssueId);
    add(params.projectId);
    add(params.blockedBy);
    add(params.issue);
    add(params.dependsOn);
    add(asRecord(params.set).parentIssueId);
    add(asRecord(params.set).projectId);
  }
  return used;
}

export function canRemove(
  view: RowView,
  referenced: ReadonlySet<string>,
): boolean {
  return !view.row.ref || !referenced.has(view.row.ref);
}

/** The `issue.create` row before `index` with the same parent: indenting makes it the parent. */
function previousSibling(
  views: readonly RowView[],
  index: number,
): RowView | null {
  const view = views[index];
  if (!view || view.row.op !== 'issue.create') return null;
  const parent = refOf(view.params.parentIssueId);
  for (let at = index - 1; at >= 0; at -= 1) {
    const candidate = views[at];
    if (!candidate || candidate.removed || candidate.row.op !== 'issue.create')
      continue;
    if (candidate.row.ref && candidate.row.ref === parent) return null;
    if (refOf(candidate.params.parentIssueId) === parent && candidate.row.ref)
      return candidate;
  }
  return null;
}

export function canIndent(views: readonly RowView[], index: number): boolean {
  return previousSibling(views, index) !== null;
}

export function canOutdent(views: readonly RowView[], index: number): boolean {
  const view = views[index];
  return (
    view?.row.op === 'issue.create' && refOf(view.params.parentIssueId) !== null
  );
}

/** The params of row `index` made a sub-issue of the row above it at the same level; null when it cannot be. */
export function indentParams(
  views: readonly RowView[],
  index: number,
): Readonly<Record<string, unknown>> | null {
  const sibling = previousSibling(views, index);
  const view = views[index];
  if (!sibling?.row.ref || !view) return null;
  return { ...view.params, parentIssueId: { ref: sibling.row.ref } };
}

/** The params of row `index` lifted one level, to its parent's parent; null when it is at the top. */
export function outdentParams(
  views: readonly RowView[],
  index: number,
): Readonly<Record<string, unknown>> | null {
  const view = views[index];
  if (!view || !canOutdent(views, index)) return null;
  const parentRef = refOf(view.params.parentIssueId);
  const parent = views.find((candidate) => candidate.row.ref === parentRef);
  const grandparent = parent?.params.parentIssueId ?? null;
  const next: Record<string, unknown> = { ...view.params };
  // A stage orders the sub-issues of one parent; it does not follow the row to another level.
  delete next.stage;
  if (grandparent === null || grandparent === undefined)
    delete next.parentIssueId;
  else next.parentIssueId = grandparent;
  return next;
}

/** The `PATCH /plans/:id` body for the edits, or null when there are none. */
export function editRequest(
  plan: Pick<Plan, 'revision'>,
  edits: PlanEdits,
): EditPlanRequest | null {
  if (edits.size === 0) return null;
  return {
    revision: plan.revision,
    rows: [...edits.entries()].map(([rowId, edit]) =>
      edit.remove
        ? { id: rowId, remove: true }
        : { id: rowId, ...(edit.params ? { params: edit.params } : {}) },
    ),
  };
}

/** The rows still in the plan that carry a risk flag; executing asks again for them. */
export function riskyRows(views: readonly RowView[]): RowView[] {
  return views.filter(
    (view) => !view.removed && (view.row.check?.flags.length ?? 0) > 0,
  );
}

export function flagsOf(view: RowView): readonly PlanRiskFlag[] {
  return view.row.check?.flags ?? [];
}

/** The rows still in the plan, counted; `issue.create` ones separately for "Create N issues". */
export function counts(views: readonly RowView[]): {
  readonly rows: number;
  readonly issues: number;
} {
  const kept = views.filter((view) => !view.removed);
  return {
    rows: kept.length,
    issues: kept.filter((view) => view.row.op === 'issue.create').length,
  };
}

/** The title an `issue.create` row's params give, for references to it. */
export function createdTitle(
  params: Readonly<Record<string, unknown>>,
): string {
  const create = params as Partial<IssueCreateParams> & { name?: unknown };
  return typeof create.title === 'string'
    ? create.title
    : typeof create.name === 'string'
      ? create.name
      : '';
}

/** Refs other rows use, apart from sub-issues pointing at their parent (those follow a removed parent up). */
export function blockingRefs(views: readonly RowView[]): ReadonlySet<string> {
  const used = new Set<string>();
  const add = (value: unknown) => {
    for (const item of Array.isArray(value) ? value : [value]) {
      const ref = refOf(item);
      if (ref) used.add(ref);
    }
  };
  for (const view of views) {
    if (view.removed) continue;
    const { params } = view;
    add(params.projectId);
    add(params.blockedBy);
    add(params.issue);
    add(params.dependsOn);
    add(asRecord(params.set).parentIssueId);
    add(asRecord(params.set).projectId);
  }
  return used;
}

/** The edits that remove `view`: its sub-issues move up to its own parent. */
export function removalEdits(
  views: readonly RowView[],
  view: RowView,
): ReadonlyMap<string, RowEdit> {
  const changes = new Map<string, RowEdit>([[view.row.id, { remove: true }]]);
  for (const child of views)
    if (
      view.row.ref &&
      child.row.op === 'issue.create' &&
      refOf(child.params.parentIssueId) === view.row.ref
    ) {
      const params: Record<string, unknown> = { ...child.params };
      if (view.params.parentIssueId === undefined) {
        delete params.parentIssueId;
        delete params.stage;
      } else params.parentIssueId = view.params.parentIssueId;
      changes.set(child.row.id, { params });
    }
  return changes;
}

/** The edits with `changes` merged in, row by row. */
export function mergeEdits(
  current: PlanEdits,
  changes: ReadonlyMap<string, RowEdit>,
): PlanEdits {
  const next = new Map(current);
  for (const [id, change] of changes)
    next.set(id, { ...current.get(id), ...change });
  return next;
}

/** The edits with `rowId` kept in the plan again (its params edits stay). */
export function restoreEdits(current: PlanEdits, rowId: string): PlanEdits {
  const next = new Map(current);
  const { remove: _removed, ...rest } = current.get(rowId) ?? {};
  if (rest.params) next.set(rowId, rest);
  else next.delete(rowId);
  return next;
}

/** `params` with `values` set; a value of `undefined` drops its key. */
export function patchParams(
  params: Readonly<Record<string, unknown>>,
  values: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const next: Record<string, unknown> = { ...params, ...values };
  for (const [key, value] of Object.entries(values))
    if (value === undefined) delete next[key];
  return next;
}

/** A project target as one select value: `ref:<ref>` for a project an earlier row creates, else the id. */
export function encodeProjectTarget(value: unknown): string | null {
  const ref = refOf(value);
  if (ref) return `ref:${ref}`;
  return typeof value === 'string' && value ? value : null;
}

/** The project target a select value (`encodeProjectTarget`) stands for. */
export function decodeProjectTarget(value: string | null): unknown {
  if (value === null) return null;
  return value.startsWith('ref:') ? { ref: value.slice(4) } : value;
}

/** What a plan's clock says: hours left to undo it (executed), or until it expires (pending, failed, stale). */
export interface PlanCountdown {
  readonly kind: 'undo' | 'expires';
  readonly hours: number;
}

const EXPIRING: ReadonlySet<PlanStatus> = new Set([
  'pending',
  'failed',
  'stale',
]);

/** The countdown to show beside a plan, or null for none. */
export function planCountdown(
  plan: Plan,
  viewerId: string | null,
  now: number = Date.now(),
): PlanCountdown | null {
  const status = effectiveStatus(plan, now);
  if (status === 'executed') {
    const hours = abilitiesOf(plan, viewerId, now).undo
      ? hoursLeft(plan.undoableUntil, now)
      : 0;
    return hours > 0 ? { kind: 'undo', hours } : null;
  }
  if (!EXPIRING.has(status)) return null;
  const hours = hoursLeft(plan.expiresAt, now);
  return hours > 0 ? { kind: 'expires', hours } : null;
}

/** Where the browser shows an issue or project a row created or acted on. */
export function planObjectHref(
  ref: PlanObjectRef | null | undefined,
): string | null {
  if (!ref?.id) return null;
  if (ref.type === 'issue') return `/issues/${encodeURIComponent(ref.id)}`;
  if (ref.type === 'project') return `/projects/${encodeURIComponent(ref.id)}`;
  return null;
}

/** How an object reads: `PM-12 Title`, or its title; null when it carries neither. */
export function planObjectLabel(
  ref: PlanObjectRef | null | undefined,
): string | null {
  if (!ref) return null;
  const title = ref.title ?? '';
  if (ref.identifier)
    return title ? `${ref.identifier} ${title}` : ref.identifier;
  return title || null;
}

/** The status-closed plans (voided, expired, undone), whose rows a card folds by default. */
export function isClosedPlan(status: PlanStatus): boolean {
  return status === 'voided' || status === 'expired' || status === 'undone';
}
