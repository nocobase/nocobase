/**
 * The status rule types this plugin brings (`shared/workflows.ts`, `BuiltInStatusRule`), written against the same
 * contract as the types other plugins contribute (`rule-types.ts`), so the workflows domain validates, describes and
 * runs every rule one way. Their stored form is unchanged: `subtasksDone` and `blockersDone` keep no settings.
 *
 * - `checklist`: entering the status gives the issue its own copy of the items (a copy it already has keeps its
 *   checks, and gains the items added since); leaving it for anything but a closed status waits until the required
 *   items are checked (400 `CHECKLIST_INCOMPLETE`).
 * - `notifyOwner`: the owner is told the issue entered the status (activity `owner_notified`, event
 *   `workflow.ownerNotified`, which the provider turns into an in-app notification), unless the owner moved it.
 * - `subtasksDone`: entering the status waits until every live sub-issue is finished (400 `SUBTASKS_OPEN`); a closed
 *   status never waits, so an issue can always be cancelled.
 * - `blockersDone`: entering the status waits until nothing holds the issue (400 `ISSUE_BLOCKED`).
 * - `startOption`: the New issue form offers the status as a way to start an issue (`IssueStarts`); entering it does
 *   nothing. Only on a status a new issue may be in: not done or closed.
 *
 * Their outcomes are not recorded as `stage_action_*` activity (`issue.status.ts`): each records what it did itself.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Issue } from '../../../shared/issues.js';
import type { Blocker } from '../../../shared/subtasks.js';
import {
  CHECKLIST_ITEMS_MAX,
  CHECKLIST_ITEM_KEY_PATTERN,
  CHECKLIST_LABEL_MAX,
  isLocalizedMessage,
  messageText,
  MESSAGE_KEY_MAX,
  MESSAGE_NAMESPACE_PATTERN,
  NOTIFY_MESSAGE_MAX,
  START_LABEL_MAX,
  type ChecklistItemDefinition,
  type RuleMessage,
  type WorkflowValidationIssue,
} from '../../../shared/workflows.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { IdSource } from '../../kernel/ids.js';
import type { RuleConfig } from '../../lifecycle/index.js';
import { addMissingItems, uncheckedRequired } from '../checklists/index.js';
import type { StatusRuleType } from './rule-types.js';
import './workflow.events.js';

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function checklistIssues(config: RuleConfig): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  for (const field of Object.keys(config))
    if (field !== 'items')
      issues.push({ path: field, message: 'Unknown field.' });
  const { items } = config;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > CHECKLIST_ITEMS_MAX
  )
    return [
      ...issues,
      { path: 'items', message: `1 to ${CHECKLIST_ITEMS_MAX} items.` },
    ];
  const keys = new Set<string>();
  items.forEach((item: unknown, index) => {
    const at = `items[${index}]`;
    if (!isObject(item)) {
      issues.push({
        path: at,
        message: 'An item is { key, label, required }.',
      });
      return;
    }
    for (const field of Object.keys(item))
      if (!['key', 'label', 'required'].includes(field))
        issues.push({ path: `${at}.${field}`, message: 'Unknown field.' });
    if (
      typeof item.key !== 'string' ||
      !CHECKLIST_ITEM_KEY_PATTERN.test(item.key)
    )
      issues.push({
        path: `${at}.key`,
        message:
          'A key is 1 to 64 lowercase letters, digits, hyphens or underscores.',
      });
    else if (keys.has(item.key))
      issues.push({
        path: `${at}.key`,
        message: `The key ${item.key} is used twice.`,
      });
    else keys.add(item.key);
    if (
      typeof item.label !== 'string' ||
      !item.label.trim() ||
      item.label.length > CHECKLIST_LABEL_MAX
    )
      issues.push({
        path: `${at}.label`,
        message: `A label is 1 to ${CHECKLIST_LABEL_MAX} characters.`,
      });
    if (typeof item.required !== 'boolean')
      issues.push({
        path: `${at}.required`,
        message: 'required is true or false.',
      });
  });
  return issues;
}

/** Problems with a rule's message at `path`: text of at most `max` characters, or `{ key, ns, defaultValue }`. */
function messageIssues(
  path: string,
  message: unknown,
  max: number,
): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  if (message === undefined) return issues;
  if (isLocalizedMessage(message)) {
    const fields = message as unknown as Readonly<Record<string, unknown>>;
    for (const field of Object.keys(fields))
      if (!['key', 'ns', 'defaultValue'].includes(field))
        issues.push({ path: `${path}.${field}`, message: 'Unknown field.' });
    if (!message.key.trim() || message.key.length > MESSAGE_KEY_MAX)
      issues.push({
        path: `${path}.key`,
        message: `A message key is 1 to ${MESSAGE_KEY_MAX} characters.`,
      });
    if (
      fields.ns !== undefined &&
      (typeof fields.ns !== 'string' ||
        !MESSAGE_NAMESPACE_PATTERN.test(fields.ns))
    )
      issues.push({ path: `${path}.ns`, message: 'Not a namespace.' });
    if (
      fields.defaultValue !== undefined &&
      (typeof fields.defaultValue !== 'string' ||
        fields.defaultValue.length > max)
    )
      issues.push({
        path: `${path}.defaultValue`,
        message: `A message is at most ${max} characters.`,
      });
  } else if (typeof message !== 'string' || message.length > max)
    issues.push({
      path,
      message: `A message is text of at most ${max} characters, or { key, ns, defaultValue }.`,
    });
  return issues;
}

function notifyIssues(config: RuleConfig): WorkflowValidationIssue[] {
  return [
    ...Object.keys(config)
      .filter((field) => field !== 'message')
      .map((field) => ({ path: field, message: 'Unknown field.' })),
    ...messageIssues('message', config.message, NOTIFY_MESSAGE_MAX),
  ];
}

function startOptionIssues(config: RuleConfig): WorkflowValidationIssue[] {
  return [
    ...Object.keys(config)
      .filter((field) => field !== 'label' && field !== 'hint')
      .map((field) => ({ path: field, message: 'Unknown field.' })),
    ...messageIssues('label', config.label, START_LABEL_MAX),
    ...messageIssues('hint', config.hint, NOTIFY_MESSAGE_MAX),
  ];
}

/** A valid rule's message as it is kept and sent: trimmed text, the key with what it has, or null for none. */
export function ruleMessage(message: unknown): RuleMessage | null {
  if (typeof message === 'string') return message.trim() || null;
  if (!isLocalizedMessage(message)) return null;
  return {
    key: message.key,
    ...(message.ns ? { ns: message.ns } : {}),
    ...(message.defaultValue?.trim()
      ? { defaultValue: message.defaultValue.trim() }
      : {}),
  };
}

function noSettings(config: RuleConfig): WorkflowValidationIssue[] {
  return Object.keys(config).map((field) => ({
    path: field,
    message: 'Unknown field.',
  }));
}

/** Sub-issues and blockers, as the rules that wait for them read them (`domains/subtasks`). */
export interface RelationChecks {
  /** Live sub-issues not finished by their own workflow, by number. */
  openChildren(
    conn: DatabaseConnection,
    issueId: string,
  ): Promise<readonly Pick<Issue, 'identifier'>[]>;
  blockers(conn: DatabaseConnection, issue: Issue): Promise<readonly Blocker[]>;
}

export function builtInStatusRuleTypes(deps: {
  readonly ids: IdSource;
  readonly activity: ActivityRecorder;
  readonly relations: () => RelationChecks;
}): readonly StatusRuleType[] {
  return [
    {
      type: 'checklist',
      validate: checklistIssues,
      describe: (config) => ({
        summary: `Gives the issue a checklist of ${Array.isArray(config.items) ? config.items.length : 0} item(s).`,
      }),
      async canLeave(check) {
        if (check.status.category === 'closed') return null;
        const missing = await uncheckedRequired(
          check.tx.conn,
          check.issue.id,
          check.from,
        );
        return missing.length === 0
          ? null
          : {
              code: 'CHECKLIST_INCOMPLETE',
              message: `Check the required items of ${check.from} first: ${missing.join('; ')}.`,
              details: { statusKey: check.from, items: missing },
            };
      },
      async entered(entry, config) {
        const items = (config.items ?? []) as ChecklistItemDefinition[];
        await addMissingItems(
          entry.tx.conn,
          () => deps.ids.next(),
          entry.issue.id,
          entry.status.key,
          items.map((item) => ({ ...item, label: item.label.trim() })),
        );
        return undefined;
      },
    },
    {
      type: 'notifyOwner',
      validate: notifyIssues,
      describe(config) {
        // Described in the words it falls back to, not translated: the summary is the plugin's own English.
        const message = messageText(
          config.message,
          (key, options) =>
            (options?.defaultValue as string | undefined) ?? key,
        );
        return {
          summary: message
            ? `Notifies the issue owner: "${message}".`
            : 'Notifies the issue owner.',
        };
      },
      async entered(entry, config) {
        const { issue, actor, status } = entry;
        if (actor.type === 'user' && actor.id === issue.ownerUserId)
          return { status: 'skipped', reason: 'ownerMovedIt' };
        const message = ruleMessage(config.message);
        await deps.activity.record(entry.tx.conn, {
          issueId: issue.id,
          actor,
          action: 'owner_notified',
          details: {
            statusKey: status.key,
            ownerUserId: issue.ownerUserId,
            message,
          },
        });
        entry.tx.emit({
          type: 'workflow.ownerNotified',
          issueId: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          ownerUserId: issue.ownerUserId,
          statusKey: status.key,
          statusName: status.name,
          message,
        });
        return undefined;
      },
    },
    {
      type: 'subtasksDone',
      validate: noSettings,
      describe: () => ({ summary: 'Waits until every sub-issue is finished.' }),
      async canEnter(check) {
        if (check.status.category === 'closed') return null;
        const open = await deps
          .relations()
          .openChildren(check.tx.conn, check.issue.id);
        return open.length === 0
          ? null
          : {
              code: 'SUBTASKS_OPEN',
              message: `Finish the sub-issues first: ${open
                .slice(0, 10)
                .map((child) => child.identifier)
                .join(', ')}.`,
              details: {
                count: open.length,
                issues: open.slice(0, 10).map((child) => child.identifier),
              },
            };
      },
    },
    {
      type: 'blockersDone',
      validate: noSettings,
      describe: () => ({ summary: 'Waits until nothing blocks the issue.' }),
      async canEnter(check) {
        const blockers = await deps
          .relations()
          .blockers(check.tx.conn, check.issue);
        return blockers.length === 0
          ? null
          : {
              code: 'ISSUE_BLOCKED',
              message: `The issue waits for ${blockers
                .map((blocker) => blocker.identifier)
                .join(', ')}.`,
              details: {
                blockers: blockers.map((blocker) => ({
                  identifier: blocker.identifier,
                  reason: blocker.reason,
                })),
              },
            };
      },
    },
    {
      type: 'startOption',
      categories: ['unstarted', 'started'],
      validate: startOptionIssues,
      describe(config) {
        const label = messageText(
          config.label,
          (key, options) =>
            (options?.defaultValue as string | undefined) ?? key,
        );
        return {
          summary: label
            ? `Offered as "${label}" when creating an issue.`
            : 'Offered when creating an issue.',
        };
      },
    },
  ];
}
