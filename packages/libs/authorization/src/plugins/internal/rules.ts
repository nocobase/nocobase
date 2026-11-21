import type {
  AccessConstraint,
  AccessConstraintResolver,
  ResolveAccessConstraintsInput,
  RuleAction,
} from '../../core/constraints.js';
import { parseRecordSelection } from '../../core/selection.js';
import { resolveAuthorizationSubjects } from '../../core/subjects.js';
import type { AuthorizationTitle } from '../../core/titles.js';
import type { AuthorizationSubject, ResourceRef } from '../../core/types.js';

export interface StoredRule {
  key: string;
  resource: ResourceRef;
  actions: readonly RuleAction[];
  title?: AuthorizationTitle;
  subjects?: readonly AuthorizationSubject[];
}

export interface RuleStore<TRule, TTransaction> {
  create(rule: TRule): Promise<TRule>;
  update(key: string, rule: TRule): Promise<TRule>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<TRule | undefined>;
  list(): Promise<readonly TRule[]>;
  withTransaction(transaction: TTransaction): RuleStore<TRule, TTransaction>;
}

export interface RuleApi<TRule, TTransaction> {
  create(rule: TRule): Promise<TRule>;
  update(key: string, rule: TRule): Promise<TRule>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<TRule | undefined>;
  list(): Promise<readonly TRule[]>;
  withTransaction(transaction: TTransaction): RuleApi<TRule, TTransaction>;
}

export interface RuleKind {
  /** The plugin id and constraint resolver id. */
  id: string;
  effect: AccessConstraint['effect'];
  /** Rules that name subjects apply only to identities holding one. */
  bySubject: boolean;
  allowAll: boolean;
  /** Set when a resource may hold one rule only; builds the error a second one raises. */
  onePerResource?: (rule: StoredRule, existing: StoredRule) => Error;
}

/** Rejects a malformed rule before it reaches a store. */
export function validateRule(rule: StoredRule, kind: RuleKind): void {
  if (!rule.key) throw new TypeError('A rule needs a key');
  if (!rule.resource.type || !rule.resource.id)
    throw new TypeError(`Rule ${rule.key} needs a resource`);
  const seen = new Set<string>();
  for (const action of rule.actions) {
    if (!action.action)
      throw new TypeError(`Rule ${rule.key} has an unnamed action`);
    const id = JSON.stringify([action.action, action.scopeKey ?? null]);
    if (seen.has(id))
      throw new TypeError(`Rule ${rule.key} repeats ${action.action}`);
    seen.add(id);
    const selection = parseRecordSelection(action.selection);
    if (selection.type === 'all' && !kind.allowAll)
      throw new TypeError(`A ${kind.id} rule cannot select all records`);
  }
}

export class RuleService<TRule extends StoredRule, TTransaction>
  implements
    RuleApi<TRule, TTransaction>,
    AccessConstraintResolver<TTransaction>
{
  readonly id: string;

  constructor(
    private readonly kind: RuleKind,
    private readonly store: RuleStore<TRule, TTransaction>,
  ) {
    this.id = kind.id;
  }

  withTransaction(transaction: TTransaction): RuleService<TRule, TTransaction> {
    return new RuleService(this.kind, this.store.withTransaction(transaction));
  }

  async create(rule: TRule): Promise<TRule> {
    validateRule(rule, this.kind);
    await this.assertResourceFree(rule, undefined);
    return this.store.create(rule);
  }

  async update(key: string, rule: TRule): Promise<TRule> {
    validateRule(rule, this.kind);
    await this.assertResourceFree(rule, key);
    return this.store.update(key, rule);
  }

  private async assertResourceFree(
    rule: TRule,
    replacing: string | undefined,
  ): Promise<void> {
    const conflict = this.kind.onePerResource;
    if (!conflict) return;
    const existing = (await this.store.list()).find(
      (entry) =>
        entry.key !== replacing &&
        entry.resource.type === rule.resource.type &&
        entry.resource.id === rule.resource.id,
    );
    if (existing) throw conflict(rule, existing);
  }

  delete(key: string): Promise<void> {
    return this.store.delete(key);
  }

  get(key: string): Promise<TRule | undefined> {
    return this.store.get(key);
  }

  list(): Promise<readonly TRule[]> {
    return this.store.list();
  }

  /** Reads the rules once per identity context. */
  for(): AccessConstraintResolver {
    let rules: Promise<readonly TRule[]> | undefined;
    return {
      id: this.id,
      resolve: async (input) =>
        this.constraints(input, await (rules ??= this.store.list())),
    };
  }

  async resolve(
    input: ResolveAccessConstraintsInput,
  ): Promise<readonly AccessConstraint[]> {
    return this.constraints(input, await this.store.list());
  }

  private constraints(
    input: ResolveAccessConstraintsInput,
    rules: readonly TRule[],
  ): readonly AccessConstraint[] {
    const held = this.kind.bySubject
      ? new Set(
          resolveAuthorizationSubjects(input).map((subject) =>
            JSON.stringify([subject.type, subject.id]),
          ),
        )
      : undefined;
    return rules.flatMap((rule) => {
      if (
        rule.resource.type !== input.resource.type ||
        (rule.resource.id !== '*' && rule.resource.id !== input.resource.id) ||
        (held &&
          !(rule.subjects ?? []).some((subject) =>
            held.has(JSON.stringify([subject.type, subject.id])),
          ))
      )
        return [];
      const configured = rule.actions.find(
        (action) =>
          action.action === input.action && action.scopeKey === input.scopeKey,
      );
      if (!configured) return [];
      return [
        {
          source: {
            plugin: this.id,
            id: rule.key,
            ...(rule.title === undefined ? {} : { title: rule.title }),
          },
          effect: this.kind.effect,
          selection: configured.selection,
        },
      ];
    });
  }
}

/** Appends one action; the caller has validated its data scope. */
export function appendRuleAction(
  actions: readonly RuleAction[],
  action: RuleAction,
): readonly RuleAction[] {
  if (
    actions.some(
      (entry) =>
        entry.action === action.action && entry.scopeKey === action.scopeKey,
    )
  )
    throw new TypeError(
      `Duplicate rule action: ${action.action}.${action.scopeKey ?? ''}`,
    );
  return [
    ...actions,
    { ...action, selection: parseRecordSelection(action.selection) },
  ];
}
