/**
 * Notices planned in the transaction of the change that causes them. A rule reads the transaction's domain events and
 * says who should be told what; the planner removes the actor, lets the stronger notice of a slot win, and emits each
 * as `notice.planned`, which the provider words and sends once the transaction commits
 * (`providers/notifications.ts`). Other plugins add rules through `projectsNoticeRulesToken`.
 */
import type { DomainEvent } from '../../kernel/events.js';
import type { Tx } from '../../kernel/tx.js';

/**
 * Which per-issue dedupe slot a notice takes: within one transaction and issue, a person gets at most one notice of
 * the `comment` slot (a mention beats a comment) and of the `change` slot (a decision beats a status change).
 */
export type NoticeSlot = 'comment' | 'change' | 'assignment' | 'description';

export interface PlannedNotice {
  /** Idempotency: the same change planned twice is sent once. */
  readonly key: string;
  readonly kind: 'decision' | 'info';
  /** `commented`, `mentioned`, `status_changed`…, or a plugin's own type. */
  readonly type: string;
  readonly issue: {
    readonly id: string;
    readonly identifier: string;
    readonly title: string;
  };
  readonly userIds: readonly string[];
  readonly actor: {
    readonly type: string;
    readonly id: string | null;
    readonly name: string | null;
  };
  /** Notices with the same group (and recipient) merge into one inbox item. */
  readonly group?: string;
  readonly slot: NoticeSlot;
  /** What the title and body say, as values, so an inbox can word it in each reader's language. */
  readonly params: Readonly<Record<string, string>>;
  /** An app route; the issue by default. */
  readonly path?: string;
}

export interface NoticeRuleContext {
  readonly tx: Tx;
  readonly events: readonly DomainEvent[];
  /** The people following an issue, as of now in the transaction. */
  subscribers(issueId: string): Promise<readonly string[]>;
  /** A principal's display name. */
  nameOf(type: string, id: string | null): Promise<string | null>;
}

export type NoticeRule = (
  context: NoticeRuleContext,
) => Promise<readonly PlannedNotice[]>;

export interface NoticeRules {
  /** Adds a rule; returns what removes it. */
  add(rule: NoticeRule): () => void;
}
