// @vitest-environment node
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import en from '../../client/locales/en-US.js';
import zh from '../../client/locales/zh-CN.js';
import { progressSentence } from '../../client/issues/detail/progress-text.js';
import type { IssueProgress } from '../../shared/project-manager.js';

describe('run wording after agent configuration removal', () => {
  it('keeps model, effort and historical activity wording in both Studio locales', () => {
    for (const locale of [en, zh]) {
      expect(locale.runTranscript.usedModel).toContain('{{model}}');
      expect(locale.runTranscript.defaultModel).toBeTruthy();
      expect(locale.runTranscript.afterSubtasks).toBeTruthy();
      for (const effort of [
        'off',
        'minimal',
        'low',
        'medium',
        'high',
        'xhigh',
        'max',
        'ultra',
      ] as const)
        expect(locale.runTranscript.efforts[effort]).toBeTruthy();
    }
    expect(zh.runTranscript.usedModel).toBe('使用模型：{{model}}');
    const sources = [
      'agents/issue-runs.tsx',
      'issues/detail/activity-row.tsx',
      'issues/detail/labels.ts',
      'projects/detail/labels.ts',
    ];
    const deleted = [
      'modelEntries.used',
      'agents.defaultModel',
      'agentForm.efforts.',
      'activity.afterSubtasks',
      'projects.workflow',
      'start.title',
      'start.later',
      'start.start',
    ];
    for (const file of sources) {
      const source = fs.readFileSync(
        new URL(`../../client/${file}`, import.meta.url),
        'utf8',
      );
      for (const key of deleted) expect(source).not.toContain(key);
    }
  });

  it('renders each waiting reason in both languages', () => {
    for (const locale of [en, zh]) {
      for (const reason of [
        'noOwner',
        'notConfigured',
        'noRunner',
        'ownerHasNoRunner',
        'notAllowed',
      ] as const) {
        const progress = {
          state: 'queued',
          agent: { id: 'manager', name: 'Manager' },
          waiting: { reason, owner: { id: 'a', name: 'Alice' } },
        } as IssueProgress;
        const t = (key: string, options?: Record<string, unknown>) => {
          const text = key
            .split('.')
            .reduce<unknown>(
              (value, part) => (value as Record<string, unknown>)[part],
              locale,
            );
          expect(typeof text).toBe('string');
          return String(text).replace(
            /\{\{(\w+)\}\}/gu,
            (_match, name: string) => String(options?.[name] ?? ''),
          );
        };
        const sentence = progressSentence(t, progress);
        expect(sentence).not.toContain('issueProgress.');
        if (reason === 'ownerHasNoRunner' || reason === 'notAllowed')
          expect(sentence).toContain('Alice');
      }
    }
  });
});
