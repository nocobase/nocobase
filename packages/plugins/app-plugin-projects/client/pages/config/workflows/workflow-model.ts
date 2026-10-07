/**
 * The workflow editor's model: pure changes to a draft definition, and how the transition matrix reads it. The server
 * checks every rule again (`server/domains/workflows/workflow.rules.ts`); these keep the editor from offering what it
 * will refuse, such as removing a built-in status.
 */
import type { Color } from '../../../../shared/common.js';
import type { StatusCategory } from '../../../../shared/issues.js';
import {
  ANY_STATUS,
  STATUS_CATEGORIES,
  STATUS_KEY_PATTERN,
  APPROVER_ROLES,
  type ApproverRole,
  type TransitionActor,
  type Workflow,
  type WorkflowDefinition,
  type WorkflowEvent,
  type ContributedStatusRule,
  type WorkflowStatus,
  type WorkflowStatusRule,
  type WorkflowTransition,
  type WorkflowValidationIssue,
} from '../../../../shared/workflows.js';
import { orderKinds } from '../../../lib/kind-order.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** The workflows tab. */
export const WORKFLOWS_PATH = '/config/workflows';

/** A workflow's page, relative to the workflows tab. */
export function workflowPath(id: string): string {
  return encodeURIComponent(id);
}

/** A workflow a template created keeps its translated name, by the title the server sends with it, until renamed. */
export function workflowName(
  t: Translate,
  workflow: Pick<Workflow, 'name'> & {
    readonly title?: { readonly key: string; readonly ns: string };
  },
): string {
  return workflow.title
    ? t(workflow.title.key, {
        ns: workflow.title.ns,
        defaultValue: workflow.name,
      })
    : workflow.name;
}

export interface WorkflowDraft {
  readonly name: string;
  readonly definition: WorkflowDefinition;
}

export function sameDraft(a: WorkflowDraft, b: WorkflowDraft): boolean {
  return (
    a.name === b.name &&
    JSON.stringify(a.definition) === JSON.stringify(b.definition)
  );
}

// Statuses

/** The statuses of each category, in definition order. */
export function statusesByCategory(
  definition: WorkflowDefinition,
): { category: StatusCategory; statuses: WorkflowStatus[] }[] {
  return STATUS_CATEGORIES.map((category) => ({
    category,
    statuses: definition.states.filter((state) => state.category === category),
  }));
}

export function updateStatus(
  definition: WorkflowDefinition,
  key: string,
  patch: Partial<Pick<WorkflowStatus, 'name' | 'color'>>,
): WorkflowDefinition {
  return {
    ...definition,
    states: definition.states.map((state) =>
      state.key === key ? { ...state, ...patch } : state,
    ),
  };
}

/** Swaps the status with its neighbour of the same category; the order of other categories is kept. */
export function moveStatus(
  definition: WorkflowDefinition,
  key: string,
  direction: -1 | 1,
): WorkflowDefinition {
  const states = [...definition.states];
  const index = states.findIndex((state) => state.key === key);
  if (index < 0) return definition;
  const category = states[index].category;
  let other = index + direction;
  while (
    other >= 0 &&
    other < states.length &&
    states[other].category !== category
  )
    other += direction;
  if (other < 0 || other >= states.length) return definition;
  [states[index], states[other]] = [states[other], states[index]];
  return { ...definition, states };
}

/** A key for a new status: its name in lower case with underscores, or `status` when that leaves nothing usable. */
export function keyFor(name: string, taken: ReadonlySet<string>): string {
  const slug = name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^[^a-z]+|_+$/gu, '')
    .slice(0, 24);
  const base = STATUS_KEY_PATTERN.test(slug) ? slug : 'status';
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1)
    if (!taken.has(`${base}_${n}`)) return `${base}_${n}`;
}

/** Adds a status at the end of its category. */
export function addStatus(
  definition: WorkflowDefinition,
  input: { name: string; category: StatusCategory; color: Color },
): WorkflowDefinition {
  const status: WorkflowStatus = {
    key: keyFor(
      input.name,
      new Set(definition.states.map((state) => state.key)),
    ),
    name: input.name.trim(),
    category: input.category,
    color: input.color,
  };
  const rank = STATUS_CATEGORIES.indexOf(input.category);
  let last = -1;
  definition.states.forEach((state, index) => {
    if (STATUS_CATEGORIES.indexOf(state.category) <= rank) last = index;
  });
  const states = [...definition.states];
  states.splice(last + 1, 0, status);
  return { ...definition, states };
}

/** Removes a status the workflow added, with every transition into or out of it. */
export function removeStatus(
  definition: WorkflowDefinition,
  key: string,
): WorkflowDefinition {
  return {
    states: definition.states.filter(
      (state) => state.key !== key || state.builtIn,
    ),
    transitions: definition.transitions.filter(
      (transition) => transition.from !== key && transition.to !== key,
    ),
  };
}

// Rules on entering a status

/** The status's rule of `type`, if any. */
export function contributedRuleOf(
  status: WorkflowStatus,
  type: string,
): ContributedStatusRule | undefined {
  return status.rules?.find((rule) => rule.type === type);
}

/** Makes `rule` the status's rule of its type, or with `null` removes the rule of `type`. */
export function setRule(
  definition: WorkflowDefinition,
  key: string,
  type: string,
  rule: WorkflowStatusRule | null,
): WorkflowDefinition {
  return {
    ...definition,
    states: definition.states.map((state) => {
      if (state.key !== key) return state;
      const others = (state.rules ?? []).filter((item) => item.type !== type);
      const index = (state.rules ?? []).findIndex((item) => item.type === type);
      const rules = [...others];
      if (rule) rules.splice(index < 0 ? rules.length : index, 0, rule);
      const { rules: _dropped, ...rest } = state;
      return rules.length > 0 ? { ...rest, rules } : rest;
    }),
  };
}

// Transitions

const inOrder = (actors: Iterable<TransitionActor>) => orderKinds(actors);

/**
 * The transitions people and the matrix deal with: those without an event. An event transition (`on`) is the system
 * moving an issue when something happens, edited as a status rule (`setAutoMove`), never shown as "the system may".
 */
export function manualTransitions(
  definition: WorkflowDefinition,
): WorkflowTransition[] {
  return definition.transitions.filter((transition) => !transition.on);
}

/** Who the definition names for exactly `from → to` (`*` included). */
export function actorsAt(
  definition: WorkflowDefinition,
  from: string,
  to: string,
): TransitionActor[] {
  return inOrder(
    manualTransitions(definition)
      .filter((transition) => transition.from === from && transition.to === to)
      .flatMap((transition) => transition.actors),
  );
}

/**
 * Who may also move `from → to` through a wider entry (`*`), and is not named for the pair itself: the matrix shows
 * them faded, as allowed but not set in this cell.
 */
export function impliedActorsAt(
  definition: WorkflowDefinition,
  from: string,
  to: string,
): TransitionActor[] {
  const explicit = new Set(actorsAt(definition, from, to));
  const covers = (pattern: string, key: string) =>
    pattern === ANY_STATUS || pattern === key;
  return inOrder(
    manualTransitions(definition)
      .filter(
        (transition) =>
          !(transition.from === from && transition.to === to) &&
          covers(transition.from, from) &&
          covers(transition.to, to),
      )
      .flatMap((transition) => transition.actors)
      .filter((actor) => !explicit.has(actor)),
  );
}

/** Makes `actors` exactly who is named for `from → to`; no one removes the entry, with its approval. */
export function setActorsAt(
  definition: WorkflowDefinition,
  from: string,
  to: string,
  actors: readonly TransitionActor[],
): WorkflowDefinition {
  const isPair = (transition: WorkflowTransition) =>
    !transition.on && transition.from === from && transition.to === to;
  const others = definition.transitions.filter(
    (transition) => !isPair(transition),
  );
  const index = definition.transitions.findIndex(isPair);
  if (actors.length === 0) return { ...definition, transitions: others };
  const approval = approvalAt(definition, from, to);
  const entry: WorkflowTransition = {
    from,
    to,
    actors: inOrder(actors),
    ...(approval.length > 0 ? { approval: { approvers: approval } } : {}),
  };
  const transitions = [...others];
  transitions.splice(index < 0 ? transitions.length : index, 0, entry);
  return { ...definition, transitions };
}

/** Who must approve a move set for exactly `from → to`; none when it needs no approval. */
export function approvalAt(
  definition: WorkflowDefinition,
  from: string,
  to: string,
): ApproverRole[] {
  const approvers = new Set(
    manualTransitions(definition)
      .filter((transition) => transition.from === from && transition.to === to)
      .flatMap((transition) => transition.approval?.approvers ?? []),
  );
  return APPROVER_ROLES.filter((role) => approvers.has(role));
}

/**
 * Makes `approvers` who must approve `from → to`; none removes the approval. A cell nobody is named for yet gets people
 * named, since an approval applies to a move someone may make.
 */
export function setApprovalAt(
  definition: WorkflowDefinition,
  from: string,
  to: string,
  approvers: readonly ApproverRole[],
): WorkflowDefinition {
  const ordered = APPROVER_ROLES.filter((role) => approvers.includes(role));
  const named = actorsAt(definition, from, to);
  const base =
    named.length > 0 || ordered.length === 0
      ? definition
      : setActorsAt(definition, from, to, ['user']);
  return {
    ...base,
    transitions: base.transitions.map((transition) => {
      if (transition.on || transition.from !== from || transition.to !== to)
        return transition;
      const { approval: _dropped, ...rest } = transition;
      return ordered.length > 0
        ? { ...rest, approval: { approvers: ordered } }
        : rest;
    }),
  };
}

/** Whether people may move an issue between any two statuses (`* → *` names them). */
export function peopleAnywhere(definition: WorkflowDefinition): boolean {
  return actorsAt(definition, ANY_STATUS, ANY_STATUS).includes('user');
}

export function setPeopleAnywhere(
  definition: WorkflowDefinition,
  on: boolean,
): WorkflowDefinition {
  const current = actorsAt(definition, ANY_STATUS, ANY_STATUS);
  return setActorsAt(
    definition,
    ANY_STATUS,
    ANY_STATUS,
    on ? [...current, 'user'] : current.filter((actor) => actor !== 'user'),
  );
}

// Validation issues from the server

/** The server's issues split by where the editor shows them: per status key, in the matrix, or for the whole. */
export function placeIssues(
  definition: WorkflowDefinition,
  issues: readonly WorkflowValidationIssue[],
): {
  byStatus: Map<string, string[]>;
  transitions: string[];
  general: string[];
} {
  const byStatus = new Map<string, string[]>();
  const transitions: string[] = [];
  const general: string[] = [];
  for (const issue of issues) {
    const state = /^states\[(\d+)\]/u.exec(issue.path);
    const key = state ? definition.states[Number(state[1])]?.key : undefined;
    if (key) byStatus.set(key, [...(byStatus.get(key) ?? []), issue.message]);
    else if (issue.path.startsWith('transitions'))
      transitions.push(issue.message);
    else general.push(issue.message);
  }
  return { byStatus, transitions, general };
}

/** `details.issues` of a 400 `INVALID_WORKFLOW`. */
export function validationIssuesOf(
  metadata: Readonly<Record<string, unknown>> | undefined,
): WorkflowValidationIssue[] {
  const issues = metadata?.issues;
  return Array.isArray(issues)
    ? issues.filter(
        (issue): issue is WorkflowValidationIssue =>
          typeof (issue as WorkflowValidationIssue | null)?.path === 'string' &&
          typeof (issue as WorkflowValidationIssue).message === 'string',
      )
    : [];
}

// The read-only picture (the old workflow page's three cards: flow, matrix, rules)

const CATEGORY_RANK: Readonly<Record<StatusCategory, number>> = {
  unstarted: 0,
  started: 1,
  done: 2,
  closed: 3,
};

/** Every status in flow order: by category (unstarted, started, done, closed), each in the definition's order. */
export function flowOrder(
  definition: Pick<WorkflowDefinition, 'states'>,
): WorkflowStatus[] {
  return definition.states
    .map((status, index) => ({ status, index }))
    .sort(
      (a, b) =>
        CATEGORY_RANK[a.status.category] - CATEGORY_RANK[b.status.category] ||
        a.index - b.index,
    )
    .map((entry) => entry.status);
}

export interface MatrixCell {
  readonly actors: readonly TransitionActor[];
  /** Approver roles when a matching entry requires an approval, else null. */
  readonly approval: readonly ApproverRole[] | null;
}

/** Who may move an issue from `from` to `to`: every matching entry together (`*` matches any status). */
export function transitionCell(
  transitions: readonly WorkflowTransition[],
  from: string,
  to: string,
): MatrixCell {
  const covers = (pattern: string, key: string) =>
    pattern === ANY_STATUS || pattern === key;
  const actors = new Set<TransitionActor>();
  const approvers = new Set<ApproverRole>();
  let approval = false;
  for (const transition of transitions) {
    if (transition.on) continue;
    if (!covers(transition.from, from) || !covers(transition.to, to)) continue;
    for (const actor of transition.actors) actors.add(actor);
    if (transition.approval) {
      approval = true;
      for (const role of transition.approval.approvers) approvers.add(role);
    }
  }
  return {
    actors: inOrder(actors),
    approval: approval
      ? APPROVER_ROLES.filter((role) => approvers.has(role))
      : null,
  };
}

export interface TransitionMatrix {
  readonly keys: readonly string[];
  readonly rows: readonly {
    readonly from: string;
    readonly cells: readonly (MatrixCell & { readonly to: string })[];
  }[];
}

/** Rows are "from", columns "to", in flow order; the diagonal (no move) is left empty. */
export function transitionMatrix(
  definition: WorkflowDefinition,
): TransitionMatrix {
  const keys = flowOrder(definition).map((status) => status.key);
  return {
    keys,
    rows: keys.map((from) => ({
      from,
      cells: keys.map((to) =>
        from === to
          ? { to, actors: [], approval: null }
          : { to, ...transitionCell(definition.transitions, from, to) },
      ),
    })),
  };
}

export type WorkflowRuleLine =
  | {
      readonly kind: 'autoMove';
      readonly from: string;
      readonly to: string;
      readonly event: WorkflowEvent;
    }
  | {
      readonly kind: 'transition';
      readonly from: string;
      readonly to: string;
      readonly actors: readonly TransitionActor[];
      readonly approval: readonly ApproverRole[] | null;
    }
  | {
      readonly kind: 'status';
      readonly status: string;
      readonly rule: WorkflowStatusRule;
    };

/**
 * The definition as sentences: each declared transition (approvals first), then what entering each status does, in
 * flow order.
 */
export function workflowRules(
  definition: WorkflowDefinition,
): WorkflowRuleLine[] {
  const transitions: WorkflowRuleLine[] = manualTransitions(definition)
    .map((transition, index) => ({ transition, index }))
    .sort(
      (a, b) =>
        Number(Boolean(b.transition.approval)) -
          Number(Boolean(a.transition.approval)) || a.index - b.index,
    )
    .map(({ transition }) => ({
      kind: 'transition',
      from: transition.from,
      to: transition.to,
      actors: inOrder(transition.actors),
      approval: transition.approval ? [...transition.approval.approvers] : null,
    }));
  const statuses: WorkflowRuleLine[] = flowOrder(definition).flatMap((status) =>
    (status.rules ?? []).map((rule) => ({
      kind: 'status' as const,
      status: status.key,
      rule,
    })),
  );
  const autoMoves: WorkflowRuleLine[] = definition.transitions.flatMap(
    (transition) =>
      transition.on
        ? [
            {
              kind: 'autoMove' as const,
              from: transition.from,
              to: transition.to,
              event: transition.on,
            },
          ]
        : [],
  );
  return [...transitions, ...autoMoves, ...statuses];
}

// Moves the system makes when something happens

/** Where the system moves an issue in `from` when `event` happens, or null when it does not. */
export function autoMoveAt(
  definition: WorkflowDefinition,
  from: string,
  event: WorkflowEvent,
): string | null {
  return (
    definition.transitions.find(
      (transition) => transition.on === event && transition.from === from,
    )?.to ?? null
  );
}

/** Makes the system move an issue in `from` to `to` when `event` happens; `null` stops it. */
export function setAutoMove(
  definition: WorkflowDefinition,
  from: string,
  event: WorkflowEvent,
  to: string | null,
): WorkflowDefinition {
  const isEntry = (transition: WorkflowTransition) =>
    transition.on === event && transition.from === from;
  const index = definition.transitions.findIndex(isEntry);
  const transitions = definition.transitions.filter(
    (transition) => !isEntry(transition),
  );
  if (to !== null && to !== from)
    transitions.splice(index < 0 ? transitions.length : index, 0, {
      from,
      to,
      actors: ['system'],
      on: event,
    });
  return { ...definition, transitions };
}

// The diagram: explicit transitions as edges, wildcard entries as sentences, what a status reaches

/** One edge of the diagram: every entry for exactly `from → to` (two concrete, different statuses) merged. */
export interface WorkflowEdge {
  readonly from: string;
  readonly to: string;
  readonly actors: readonly TransitionActor[];
  /** Approver roles when an entry for the pair requires an approval, else null. */
  readonly approval: readonly ApproverRole[] | null;
}

/** The transitions the diagram draws: those naming two concrete statuses, merged per pair, in definition order. */
export function explicitEdges(definition: WorkflowDefinition): WorkflowEdge[] {
  const known = new Set(definition.states.map((state) => state.key));
  const pairs = new Map<string, { from: string; to: string }>();
  for (const transition of manualTransitions(definition))
    if (
      transition.from !== ANY_STATUS &&
      transition.to !== ANY_STATUS &&
      transition.from !== transition.to &&
      known.has(transition.from) &&
      known.has(transition.to)
    )
      pairs.set(`${transition.from}>${transition.to}`, {
        from: transition.from,
        to: transition.to,
      });
  return [...pairs.values()].map(({ from, to }) => {
    const approval = approvalAt(definition, from, to);
    const required = manualTransitions(definition).some(
      (transition) =>
        transition.from === from &&
        transition.to === to &&
        transition.approval !== undefined,
    );
    return {
      from,
      to,
      actors: actorsAt(definition, from, to),
      approval: required ? approval : null,
    };
  });
}

/** The entries with `*` on either end, per actor in actor order: the diagram states them instead of drawing them. */
export function wildcardMoves(definition: WorkflowDefinition): {
  readonly actor: TransitionActor;
  readonly moves: readonly {
    readonly from: string;
    readonly to: string;
    readonly approval: readonly ApproverRole[] | null;
  }[];
}[] {
  const wild = manualTransitions(definition).filter(
    (transition) =>
      transition.from === ANY_STATUS || transition.to === ANY_STATUS,
  );
  return inOrder(wild.flatMap((transition) => transition.actors))
    .map((actor) => ({
      actor,
      moves: wild
        .filter((transition) => transition.actors.includes(actor))
        .map((transition) => ({
          from: transition.from,
          to: transition.to,
          approval: transition.approval
            ? [...transition.approval.approvers]
            : null,
        })),
    }))
    .filter((entry) => entry.moves.length > 0);
}

/** Every status an issue in `key` may move to, with who may (wildcards included), in flow order. */
export function reachableFrom(
  definition: WorkflowDefinition,
  key: string,
): (MatrixCell & { readonly to: string })[] {
  return flowOrder(definition)
    .filter((status) => status.key !== key)
    .map((status) => ({
      to: status.key,
      ...transitionCell(definition.transitions, key, status.key),
    }))
    .filter((cell) => cell.actors.length > 0);
}

/** The event transitions the diagram draws dashed: between two known, different statuses. */
export function eventEdges(definition: WorkflowDefinition): {
  readonly from: string;
  readonly to: string;
  readonly event: WorkflowEvent;
}[] {
  const known = new Set(definition.states.map((state) => state.key));
  return definition.transitions.flatMap((transition) =>
    transition.on &&
    transition.from !== transition.to &&
    known.has(transition.from) &&
    known.has(transition.to)
      ? [{ from: transition.from, to: transition.to, event: transition.on }]
      : [],
  );
}

/** Category → token classes for a status node, so the flow follows light and dark themes. */
export const CATEGORY_NODE_CLASS: Readonly<Record<StatusCategory, string>> = {
  unstarted: 'border-border bg-muted text-foreground',
  started: 'border-chart-3/60 bg-chart-3/15 text-foreground',
  done: 'border-chart-2/60 bg-chart-2/15 text-foreground',
  closed: 'border-dashed border-border bg-background text-muted-foreground',
};
