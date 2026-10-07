/**
 * What a workflow of this plugin may contain, on top of what any lifecycle keeps (`server/lifecycle`):
 *
 * - the built-in statuses are all there, marked built-in, with their fixed category; no other status is;
 * - a transition names registered kinds only (`kernel/kinds.ts`), each within what its kind allows: a kind may refuse
 *   to enter some categories of status, or to target "any status";
 * - a person can leave every status, so no issue gets stuck where nobody may move it;
 * - a status carries each kind of rule at most once;
 * - an event transition (`on`) is the system's alone, on a built-in event or one another plugin contributed
 *   (`event-types.ts`), leaving and entering only the categories of status the event allows; a transition on an event
 *   whose plugin is gone is kept while it is unchanged;
 * - a rule sits only on the categories of status its type allows.
 *
 * The rules a status or transition names must be registered (`workflow.registry.ts`), with valid settings.
 */
import { COLORS } from '../../../shared/common.js';
import {
  ANY_STATUS,
  BUILTIN_STATUSES,
  STATUS_CATEGORIES,
  STATUS_NAME_MAX,
  WORKFLOW_EVENTS,
  type WorkflowDefinition,
} from '../../../shared/workflows.js';
import type { StatusCategory } from '../../../shared/issues.js';
import {
  validateDefinition,
  type LifecycleDefinition,
  type LifecycleIssue,
  type LifecycleSchema,
} from '../../lifecycle/index.js';
import { invalid } from '../../kernel/errors.js';
import { SYSTEM_KIND } from '../../../shared/kinds.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { IssueRules } from '../issues/index.js';
import type { StatusRuleTypes } from './rule-types.js';
import type { WorkflowEventTypes } from './event-types.js';

/** What a workflow may hold, the actors being the registered kinds and the events the built-in and contributed ones. */
export function workflowSchema(
  kinds: KindRegistry,
  events?: WorkflowEventTypes,
): LifecycleSchema {
  return {
    categories: STATUS_CATEGORIES,
    actors: kinds.list().map((kind) => kind.key),
    colors: COLORS,
    events: [
      ...WORKFLOW_EVENTS,
      ...(events?.list().map((event) => event.key) ?? []),
    ],
    limits: { nameLength: STATUS_NAME_MAX },
  };
}

function builtInStatuses(definition: LifecycleDefinition): LifecycleIssue[] {
  const issues: LifecycleIssue[] = [];
  definition.states.forEach((state, index) => {
    const builtIn = BUILTIN_STATUSES.find((status) => status.key === state.key);
    if (builtIn && !state.builtIn)
      issues.push({
        path: `states[${index}].builtIn`,
        message: `${state.key} is a built-in status.`,
      });
    if (!builtIn && state.builtIn)
      issues.push({
        path: `states[${index}].builtIn`,
        message: `Only ${BUILTIN_STATUSES.map((status) => status.key).join(', ')} are built-in.`,
      });
    if (builtIn && state.category !== builtIn.category)
      issues.push({
        path: `states[${index}].category`,
        message: `The category of ${state.key} is fixed (${builtIn.category}).`,
      });
  });
  for (const status of BUILTIN_STATUSES)
    if (!definition.states.some((state) => state.key === status.key))
      issues.push({
        path: 'states',
        message: `The built-in status ${status.key} cannot be removed.`,
      });
  return issues;
}

/** Each transition within what its kinds allow. */
function kindLimits(kinds: KindRegistry) {
  return (definition: LifecycleDefinition): LifecycleIssue[] => {
    const categories = new Map(
      definition.states.map((state) => [state.key, state.category]),
    );
    return definition.transitions.flatMap((transition, index) =>
      transition.actors.flatMap((key) => {
        const kind = kinds.get(key);
        if (!kind) return [];
        const any = transition.to === ANY_STATUS;
        const category = categories.get(transition.to) as
          StatusCategory | undefined;
        const refused = any
          ? kind.mayTargetAny === false
          : category !== undefined && kind.mayEnter?.(category) === false;
        return refused
          ? [
              {
                path: `transitions[${index}].actors`,
                message: any
                  ? `${key} may not move an issue to any status.`
                  : `${key} may not move an issue into a ${category} status.`,
              },
            ]
          : [];
      }),
    );
  };
}

function peopleCanLeave(definition: LifecycleDefinition): LifecycleIssue[] {
  const byPeople = definition.transitions.filter((transition) =>
    transition.actors.includes('user'),
  );
  return definition.states.flatMap((state, index) =>
    byPeople.some(
      (transition) =>
        (transition.from === ANY_STATUS || transition.from === state.key) &&
        transition.to !== state.key,
    )
      ? []
      : [
          {
            path: `states[${index}]`,
            message: `Nobody may move an issue out of ${state.key}; let people leave it.`,
          },
        ],
  );
}

function eventTransitionsAreSystem(
  definition: LifecycleDefinition,
): LifecycleIssue[] {
  return definition.transitions.flatMap((transition, index) =>
    transition.on !== undefined &&
    (transition.actors.length !== 1 || transition.actors[0] !== SYSTEM_KIND)
      ? [
          {
            path: `transitions[${index}].actors`,
            message: `Only ${SYSTEM_KIND} takes a transition on ${transition.on}.`,
          },
        ]
      : [],
  );
}

function oneRulePerType(definition: LifecycleDefinition): LifecycleIssue[] {
  return definition.states.flatMap((state, index) => {
    const seen = new Set<string>();
    return (state.rules ?? []).flatMap((rule, position) => {
      if (!seen.has(rule.type)) {
        seen.add(rule.type);
        return [];
      }
      return [
        {
          path: `states[${index}].rules[${position}]`,
          message: `${state.key} has a ${rule.type} rule already.`,
        },
      ];
    });
  });
}

/** Each rule on a status of a category its type allows; a rule whose type is gone is not checked. */
function rulePlacement(types: StatusRuleTypes | undefined) {
  return (definition: LifecycleDefinition): LifecycleIssue[] =>
    definition.states.flatMap((state, index) =>
      (state.rules ?? []).flatMap((rule, position) => {
        const categories = types?.get(rule.type)?.categories;
        return categories &&
          !categories.includes(state.category as StatusCategory)
          ? [
              {
                path: `states[${index}].rules[${position}].type`,
                message: `A ${rule.type} rule cannot be on a ${state.category} status.`,
              },
            ]
          : [];
      }),
    );
}

/** Each transition on a contributed event between statuses of the categories it allows; a gone event is not checked. */
function eventPlacement(events: WorkflowEventTypes | undefined) {
  return (definition: LifecycleDefinition): LifecycleIssue[] => {
    const categories = new Map(
      definition.states.map((state) => [state.key, state.category]),
    );
    return definition.transitions.flatMap((transition, index) => {
      const event = transition.on ? events?.get(transition.on) : undefined;
      if (!event) return [];
      return (['from', 'to'] as const).flatMap((end) => {
        const allowed = event[end];
        const category = categories.get(transition[end]) as
          StatusCategory | undefined;
        return allowed && category && !allowed.includes(category)
          ? [
              {
                path: `transitions[${index}].${end}`,
                message: `A transition on ${event.key} cannot ${end === 'from' ? 'leave' : 'enter'} a ${category} status.`,
              },
            ]
          : [];
      });
    });
  };
}

/**
 * The definition, valid for this plugin, or 400 `INVALID_WORKFLOW` with every problem in `details.issues`. `base` is
 * the definition being replaced: its statuses keep their category.
 */
export function checkDefinition(
  input: unknown,
  base: WorkflowDefinition | null,
  registry: IssueRules,
  kinds: KindRegistry,
  ruleTypes?: StatusRuleTypes,
  events?: WorkflowEventTypes,
): WorkflowDefinition {
  const result = validateDefinition(input, workflowSchema(kinds, events), {
    base,
    registry,
    rules: [
      builtInStatuses,
      kindLimits(kinds),
      peopleCanLeave,
      oneRulePerType,
      eventTransitionsAreSystem,
      rulePlacement(ruleTypes),
      eventPlacement(events),
    ],
  });
  if (!result.ok)
    throw invalid('INVALID_WORKFLOW', 'The workflow is not valid.', {
      issues: result.issues,
    });
  return result.definition as WorkflowDefinition;
}
