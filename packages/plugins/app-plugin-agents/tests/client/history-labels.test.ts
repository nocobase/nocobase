/** Every field and value an agent's history can hold has wording in each locale, so none shows as a raw key. */
import { describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import {
  AGENT_ACCESS,
  AGENT_CHANGE_ACTIONS,
  AGENT_HISTORY_FIELDS,
  AGENT_TYPES,
  CONFIRM_CHANGES,
  RETIRED_AGENT_HISTORY_FIELDS,
} from '../../shared/agents.js';

const keys = [
  ...[...AGENT_HISTORY_FIELDS, ...RETIRED_AGENT_HISTORY_FIELDS, 'variable'].map(
    (field) => `history.fields.${field}`,
  ),
  ...AGENT_CHANGE_ACTIONS.map((action) => `history.actions.${action}`),
  ...['added', 'changed', 'removed'].map((c) => `history.variable.${c}`),
  ...AGENT_TYPES.map((type) => `agentTypes.${type}`),
  ...AGENT_ACCESS.map((access) => `agents.access.${access}`),
  ...CONFIRM_CHANGES.map((confirm) => `capabilities.confirm.${confirm}`),
];

function lookup(resource: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      resource,
    );
}

describe('agent history wording', () => {
  for (const [locale, resource] of [
    ['en-US', enUS],
    ['zh-CN', zhCN],
  ] as const)
    it(`labels every recorded field and value in ${locale}`, () => {
      const missing = keys.filter(
        (key) => typeof lookup(resource, key) !== 'string',
      );
      expect(missing).toEqual([]);
    });
});
