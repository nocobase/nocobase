// @vitest-environment node
import { describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

/** Every leaf of a resource, as `key → text`. */
function leaves(
  resource: Readonly<Record<string, unknown>>,
  prefix = '',
): [string, string][] {
  return Object.entries(resource).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') return [[path, value] as [string, string]];
    return value && typeof value === 'object'
      ? leaves(value as Record<string, unknown>, path)
      : [];
  });
}

const en = new Map(leaves(enUS));
const zh = new Map(leaves(zhCN));

describe('workflow definitions are called workflow templates', () => {
  it('names the settings tab, list, breadcrumb, settings item and project field so', () => {
    expect(en.get('workflows.title')).toBe('Workflow templates');
    expect(zh.get('workflows.title')).toBe('流程模板');
    expect(zh.get('workflows.breadcrumb')).toBe('流程模板');
    expect(en.get('workflows.breadcrumb')).toBe('Workflow template');
    expect(zh.get('workflows.backToList')).toBe('返回流程模板');
    expect(zh.get('projects.workflow')).toBe('流程模板');
    expect(en.get('projects.workflow')).toBe('Workflow template');
    expect(zh.get('nav.workflows')).toBe('流程模板');
    expect(zh.get('access.settings.pm.workflows')).toBe('流程模板');
    expect(en.get('access.settings.pm.workflows')).toBe('Workflow templates');
    expect(zh.get('roles.capabilities.workflows.update')).toBe('编辑流程模板');
    expect(en.get('workflows.empty')).toBe('No workflow templates');
    expect(zh.get('workflows.loadFailed')).toBe('无法加载流程模板');
    expect(zh.get('workflows.saved')).toBe('已保存流程模板 {{name}}。');
  });

  it('never says 工作流 for them in Chinese', () => {
    expect([...zh].filter(([, text]) => text.includes('工作流'))).toEqual([]);
    expect(
      [...zh].filter(([, text]) => text.includes('流程模板')).length,
    ).toBeGreaterThan(30);
  });

  it('has the new keys in both languages', () => {
    const keys = [
      'workflows.builtInStatuses',
      'workflows.emptyReadOnly',
      'workflows.rules.unavailable',
      'workflows.rules.unavailableHint',
      'workflows.rules.unavailableShort',
      'workflows.rules.removeUnavailable',
      'workflows.wakeConfirm.title',
      'workflows.wakeConfirm.description',
      'workflows.wakeConfirm.entering',
      'workflows.wakeConfirm.confirm',
      'activity.actions.stageActionApplied',
      'activity.actions.stageActionSkipped',
      'activity.actions.stageActionSuppressed',
      'activity.actions.stageActionBlocked',
      'activity.actions.workBlocked',
      'activity.actions.workDormant',
      'activity.actions.workWithdrawn',
    ];
    expect(keys.filter((key) => !en.get(key) || !zh.get(key))).toEqual([]);
  });
});
