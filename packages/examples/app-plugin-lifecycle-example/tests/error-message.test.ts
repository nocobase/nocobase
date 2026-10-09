// What a page tells the person when a request fails, in the page's language:
// the refusals `@nocobase/lifecycle/react` throws and the plugin's own routes'
// standard error bodies are read the same way.
import { LifecycleRequestError } from '@nocobase/lifecycle/react';
import { describe, expect, it } from 'vitest';

import { errorMessage, type Translate } from '../client/lib/api.js';
import zhCN from '../client/locales/zh-CN.js';

/** Looks a dotted key up in the Chinese resource, as the page's `t()` would. */
const chinese: Translate = (key, fallback) => {
  let value: unknown = zhCN;
  for (const part of key.split('.'))
    value =
      typeof value === 'object' && value !== null
        ? (value as Record<string, unknown>)[part]
        : undefined;
  return typeof value === 'string' ? value : fallback;
};

describe('errorMessage', () => {
  it('translates the blockers of a refusal the lifecycle client threw', () => {
    const refused = new LifecycleRequestError(
      'Only the current approver can decide on this report.',
      'GUARD_REJECTED',
      [
        {
          source: 'guard',
          kind: 'permission',
          code: 'approverOnly',
          message: 'Only the current approver can decide on this report.',
        },
      ],
      [],
    );
    expect(errorMessage(refused, chinese)).toBe('只有当前审批人可以处理');
  });

  it('translates its input problems by field', () => {
    const refused = new LifecycleRequestError(
      'Give a reason.',
      'INVALID_INPUT',
      [],
      [{ field: 'reason', message: 'Give a reason.' }],
    );
    expect(errorMessage(refused, chinese)).toBe('请填写原因');
  });

  it('translates its reason, and keeps the English message for one the page does not know', () => {
    expect(
      errorMessage(
        new LifecycleRequestError(
          'A report under review cannot be edited; withdraw it first.',
          'EXPENSE_LOCKED',
          [],
          [],
        ),
        chinese,
      ),
    ).toBe('审批中的报销单不能修改，请先撤回');
    expect(
      errorMessage(
        new LifecycleRequestError(
          'Add at least one expense line.',
          'INVALID_STATE',
          [],
          [],
        ),
        chinese,
      ),
    ).toBe('Add at least one expense line.');
  });

  it('reads the standard error body of a plugin route the same way', () => {
    const cause = Object.assign(new Error('Request failed'), {
      payload: {
        error: {
          reason: 'GUARD_REJECTED',
          message: 'Closed more than 7 days ago; file a new ticket instead.',
          metadata: {
            blockers: [
              {
                source: 'guard',
                kind: 'precondition',
                code: 'reopenExpired',
                message:
                  'Closed more than 7 days ago; file a new ticket instead.',
              },
            ],
            problems: [],
          },
        },
      },
    });
    expect(errorMessage(cause, chinese)).toBe(
      '关闭时间太久，不能再重新打开，请提交新工单',
    );
  });

  it('falls back to the error’s own message', () => {
    expect(errorMessage(new Error('Network down'), chinese)).toBe(
      'Network down',
    );
    expect(errorMessage('timeout')).toBe('timeout');
  });
});
