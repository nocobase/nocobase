/**
 * Validation of a lifecycle definition. Returns every problem with its path (`states[3].key`), so an editor can show
 * each one where it belongs. The shape and the rules that hold for any lifecycle are checked here; an application adds
 * its own (`rules`) and runs with `base`, the definition being replaced, so an existing state keeps its category.
 *
 * The rules a definition names (state rules, "who may" rules, approvers) must be in `registry`, and their settings
 * pass the rule's own `validate`; without a registry a definition names none. A state rule the registry lacks is kept
 * when `base` has the same rule, settings and all, on the same state: its plugin may be gone, and the definition can
 * still be edited around it. Likewise an event transition on an event the schema lacks is kept when `base` has the same
 * transition (same ends, same event).
 */
import {
  ANY_STATE,
  DEFAULT_LIMITS,
  STATE_KEY_PATTERN,
  type LifecycleDefinition,
  type LifecycleSchema,
  type LifecycleState,
  type LifecycleApproval,
  type LifecycleRuleRef,
  type LifecycleTransition,
} from './definition.js';
import type { LifecycleRegistry, RuleConfig } from './registry.js';

export interface LifecycleIssue {
  readonly path: string;
  readonly message: string;
}

/** An application rule over a definition whose shape is already valid. */
export type LifecycleRule = (
  definition: LifecycleDefinition,
) => readonly LifecycleIssue[];

export interface ValidateOptions {
  readonly base?: LifecycleDefinition | null;
  readonly rules?: readonly LifecycleRule[];
  /** Where the rules a definition names are registered; any registry, whatever its subject. */
  readonly registry?: LifecycleRegistry<never, never>;
}

export type ValidationResult =
  | { readonly ok: true; readonly definition: LifecycleDefinition }
  | { readonly ok: false; readonly issues: readonly LifecycleIssue[] };

type Json = Readonly<Record<string, unknown>>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function unknownFields(
  value: Json,
  allowed: readonly string[],
  path: string,
  issues: LifecycleIssue[],
): void {
  for (const field of Object.keys(value))
    if (!allowed.includes(field))
      issues.push({ path: `${path}.${field}`, message: 'Unknown field.' });
}

/** `{ type, config? }`, or null after reporting why not. */
function ruleRefOf(
  value: unknown,
  path: string,
  issues: LifecycleIssue[],
): LifecycleRuleRef | null {
  if (!isObject(value)) {
    issues.push({ path, message: 'A rule is { type, config }.' });
    return null;
  }
  const before = issues.length;
  unknownFields(value, ['type', 'config'], path, issues);
  if (typeof value.type !== 'string' || !value.type)
    issues.push({ path: `${path}.type`, message: 'Name a rule.' });
  if (value.config !== undefined && !isObject(value.config))
    issues.push({ path: `${path}.config`, message: 'Settings are an object.' });
  if (issues.length > before) return null;
  return {
    type: value.type as string,
    ...(value.config === undefined ? {} : { config: value.config as Json }),
  };
}

function stateRulesOf(
  value: unknown,
  path: string,
  limit: number,
  issues: LifecycleIssue[],
): LifecycleRuleRef[] | null {
  if (!Array.isArray(value) || value.length > limit) {
    issues.push({ path, message: `At most ${limit} rules.` });
    return null;
  }
  const rules = value.map((rule, index) =>
    ruleRefOf(rule, `${path}[${index}]`, issues),
  );
  return rules.every((rule) => rule !== null) ? rules : null;
}

function approvalOf(
  value: unknown,
  path: string,
  issues: LifecycleIssue[],
): LifecycleApproval | null {
  const approvers = isObject(value) ? value.approvers : undefined;
  if (isObject(value)) unknownFields(value, ['approvers'], path, issues);
  if (
    !Array.isArray(approvers) ||
    approvers.length === 0 ||
    approvers.some((name) => typeof name !== 'string' || !name) ||
    new Set(approvers).size !== approvers.length
  ) {
    issues.push({
      path: `${path}.approvers`,
      message: 'Name at least one approver, each once.',
    });
    return null;
  }
  return { approvers: [...(approvers as string[])] };
}

function stateOf(
  value: unknown,
  path: string,
  schema: LifecycleSchema,
  issues: LifecycleIssue[],
): LifecycleState | null {
  if (!isObject(value)) {
    issues.push({ path, message: 'A state must be an object.' });
    return null;
  }
  const before = issues.length;
  unknownFields(
    value,
    ['key', 'name', 'category', 'color', 'builtIn', 'rules'],
    path,
    issues,
  );
  const { key, name, category, color, builtIn } = value;
  const nameLength = schema.limits?.nameLength ?? DEFAULT_LIMITS.nameLength;
  if (typeof key !== 'string' || !STATE_KEY_PATTERN.test(key))
    issues.push({
      path: `${path}.key`,
      message:
        'A key is 2 to 32 lowercase letters, digits or underscores, starting with a letter.',
    });
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > nameLength
  )
    issues.push({
      path: `${path}.name`,
      message: `A name is 1 to ${nameLength} characters.`,
    });
  if (typeof category !== 'string' || !schema.categories.includes(category))
    issues.push({
      path: `${path}.category`,
      message: `The category is one of ${schema.categories.join(', ')}.`,
    });
  if (
    schema.colors &&
    (typeof color !== 'string' || !schema.colors.includes(color))
  )
    issues.push({
      path: `${path}.color`,
      message: `The color is one of ${schema.colors.join(', ')}.`,
    });
  if (builtIn !== undefined && typeof builtIn !== 'boolean')
    issues.push({ path: `${path}.builtIn`, message: 'Must be a boolean.' });
  const rules =
    value.rules === undefined
      ? []
      : stateRulesOf(
          value.rules,
          `${path}.rules`,
          schema.limits?.rulesPerState ?? DEFAULT_LIMITS.rulesPerState,
          issues,
        );
  if (issues.length > before) return null;
  return {
    key: key as string,
    name: (name as string).trim(),
    category: category as string,
    ...(typeof color === 'string' ? { color } : {}),
    ...(builtIn === true ? { builtIn: true } : {}),
    ...(rules && rules.length > 0 ? { rules } : {}),
  };
}

/** Whether `base` has an event transition on `on` from `from` to `to`. */
function keptEvent(
  base: LifecycleDefinition | null | undefined,
  from: unknown,
  to: unknown,
  on: string,
): boolean {
  return Boolean(
    base?.transitions.some(
      (transition) =>
        transition.on === on &&
        transition.from === from &&
        transition.to === to,
    ),
  );
}

function transitionOf(
  value: unknown,
  path: string,
  schema: LifecycleSchema,
  issues: LifecycleIssue[],
  base: LifecycleDefinition | null | undefined,
): LifecycleTransition | null {
  if (!isObject(value)) {
    issues.push({ path, message: 'A transition must be an object.' });
    return null;
  }
  const before = issues.length;
  unknownFields(
    value,
    ['from', 'to', 'actors', 'who', 'approval', 'on'],
    path,
    issues,
  );
  const { from, to, actors, on } = value;
  for (const [end, state] of [
    ['from', from],
    ['to', to],
  ] as const)
    if (typeof state !== 'string' || !state)
      issues.push({ path: `${path}.${end}`, message: 'A state key or *.' });
  if (
    !Array.isArray(actors) ||
    actors.length === 0 ||
    actors.some(
      (actor) => typeof actor !== 'string' || !schema.actors.includes(actor),
    ) ||
    new Set(actors).size !== actors.length
  )
    issues.push({
      path: `${path}.actors`,
      message: `At least one of ${schema.actors.join(', ')}, each once.`,
    });
  const who =
    value.who === undefined
      ? null
      : ruleRefOf(value.who, `${path}.who`, issues);
  const approval =
    value.approval === undefined
      ? null
      : approvalOf(value.approval, `${path}.approval`, issues);
  if (on !== undefined) {
    if (
      typeof on !== 'string' ||
      (!(schema.events ?? []).includes(on) && !keptEvent(base, from, to, on))
    )
      issues.push({
        path: `${path}.on`,
        message: schema.events?.length
          ? `The event is one of ${schema.events.join(', ')}.`
          : 'This lifecycle has no events.',
      });
    for (const [end, state] of [
      ['from', from],
      ['to', to],
    ] as const)
      if (state === ANY_STATE)
        issues.push({
          path: `${path}.${end}`,
          message: 'An event transition names its states.',
        });
    if (value.who !== undefined)
      issues.push({
        path: `${path}.who`,
        message: 'An event transition has no "who may" rule.',
      });
    if (value.approval !== undefined)
      issues.push({
        path: `${path}.approval`,
        message: 'An event transition needs no approval.',
      });
  }
  if (issues.length > before) return null;
  return {
    from: from as string,
    to: to as string,
    actors: [...(actors as string[])],
    ...(who ? { who } : {}),
    ...(approval ? { approval } : {}),
    ...(typeof on === 'string' ? { on } : {}),
  };
}

/**
 * The rules every lifecycle keeps: unique keys, known ends, one entry per pair (and one target per state and event),
 * stable categories.
 */
function commonRules(
  definition: LifecycleDefinition,
  base: LifecycleDefinition | null | undefined,
): LifecycleIssue[] {
  const issues: LifecycleIssue[] = [];
  const keys = new Set<string>();
  definition.states.forEach((state, index) => {
    if (keys.has(state.key))
      issues.push({
        path: `states[${index}].key`,
        message: `The key ${state.key} is used twice.`,
      });
    keys.add(state.key);
    const previous = base?.states.find((item) => item.key === state.key);
    if (previous && previous.category !== state.category)
      issues.push({
        path: `states[${index}].category`,
        message: `The category of ${state.key} cannot change (it is ${previous.category}).`,
      });
  });
  const pairs = new Set<string>();
  definition.transitions.forEach((transition, index) => {
    for (const end of ['from', 'to'] as const)
      if (transition[end] !== ANY_STATE && !keys.has(transition[end]))
        issues.push({
          path: `transitions[${index}].${end}`,
          message: `There is no state ${transition[end]}.`,
        });
    if (transition.from === transition.to && transition.from !== ANY_STATE)
      issues.push({
        path: `transitions[${index}]`,
        message: 'A transition leads to another state.',
      });
    const pair =
      transition.on === undefined
        ? `${transition.from}→${transition.to}`
        : `${transition.from}@${transition.on}`;
    if (pairs.has(pair))
      issues.push({
        path: `transitions[${index}]`,
        message:
          transition.on === undefined
            ? `${transition.from} → ${transition.to} is listed twice.`
            : `${transition.from} has two transitions on ${transition.on}.`,
      });
    pairs.add(pair);
  });
  return issues;
}

/** `base` + a path relative to it: `a.b` + `items[0]` → `a.b.items[0]`. */
const joinPath = (base: string, relative: string) =>
  !relative
    ? base
    : relative.startsWith('[')
      ? `${base}${relative}`
      : `${base}.${relative}`;

function settingsIssues(
  rule: { validate?(config: RuleConfig): readonly LifecycleIssue[] },
  ref: LifecycleRuleRef,
  path: string,
): LifecycleIssue[] {
  return (rule.validate?.(ref.config ?? {}) ?? []).map((issue) => ({
    path: joinPath(`${path}.config`, issue.path),
    message: issue.message,
  }));
}

/** A value as JSON with sorted keys, to compare settings. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isObject(value))
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value ?? null);
}

/** Whether `base` has the same rule on the state `key`. */
function keptFrom(
  base: LifecycleDefinition | null | undefined,
  key: string,
  ref: LifecycleRuleRef,
): boolean {
  const same = canonical({ type: ref.type, config: ref.config ?? {} });
  return Boolean(
    base?.states
      .find((state) => state.key === key)
      ?.rules?.some(
        (old) =>
          canonical({ type: old.type, config: old.config ?? {} }) === same,
      ),
  );
}

/** Every rule a definition names is registered, with settings it accepts. */
function registeredRules(
  definition: LifecycleDefinition,
  registry: LifecycleRegistry<never, never> | undefined,
  base: LifecycleDefinition | null | undefined,
): LifecycleIssue[] {
  const issues: LifecycleIssue[] = [];
  definition.states.forEach((state, index) =>
    state.rules?.forEach((ref, position) => {
      const path = `states[${index}].rules[${position}]`;
      const rule = registry?.findStateRule(ref.type);
      if (!rule) {
        if (keptFrom(base, state.key, ref)) return;
        issues.push({
          path: `${path}.type`,
          message: `There is no rule ${ref.type}.`,
        });
      } else issues.push(...settingsIssues(rule, ref, path));
    }),
  );
  definition.transitions.forEach((transition, index) => {
    const path = `transitions[${index}]`;
    if (transition.who) {
      const rule = registry?.findWhoRule(transition.who.type);
      if (!rule)
        issues.push({
          path: `${path}.who.type`,
          message: `There is no rule ${transition.who.type}.`,
        });
      else issues.push(...settingsIssues(rule, transition.who, `${path}.who`));
    }
    transition.approval?.approvers.forEach((name, position) => {
      if (!registry?.findApprover(name))
        issues.push({
          path: `${path}.approval.approvers[${position}]`,
          message: `There is no approver ${name}.`,
        });
    });
  });
  return issues;
}

export function validateDefinition(
  input: unknown,
  schema: LifecycleSchema,
  options: ValidateOptions = {},
): ValidationResult {
  const issues: LifecycleIssue[] = [];
  const limits = { ...DEFAULT_LIMITS, ...schema.limits };
  if (!isObject(input))
    return {
      ok: false,
      issues: [{ path: '', message: 'A definition must be an object.' }],
    };
  unknownFields(input, ['states', 'transitions'], '', issues);
  const { states, transitions } = input;
  if (
    !Array.isArray(states) ||
    states.length === 0 ||
    states.length > limits.states
  )
    issues.push({
      path: 'states',
      message: `1 to ${limits.states} states.`,
    });
  if (!Array.isArray(transitions) || transitions.length > limits.transitions)
    issues.push({
      path: 'transitions',
      message: `At most ${limits.transitions} transitions.`,
    });
  if (issues.length > 0) return { ok: false, issues };

  const parsedStates = (states as unknown[]).map((state, index) =>
    stateOf(state, `states[${index}]`, schema, issues),
  );
  const parsedTransitions = (transitions as unknown[]).map(
    (transition, index) =>
      transitionOf(
        transition,
        `transitions[${index}]`,
        schema,
        issues,
        options.base,
      ),
  );
  if (issues.length > 0) return { ok: false, issues };

  const definition: LifecycleDefinition = {
    states: parsedStates as LifecycleState[],
    transitions: parsedTransitions as LifecycleTransition[],
  };
  issues.push(...commonRules(definition, options.base));
  issues.push(...registeredRules(definition, options.registry, options.base));
  if (issues.length === 0)
    for (const rule of options.rules ?? []) issues.push(...rule(definition));
  return issues.length > 0 ? { ok: false, issues } : { ok: true, definition };
}
