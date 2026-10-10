/** @vitest-environment jsdom */

import { I18nProvider, NamespaceScope } from '@nocobase/i18n/client';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import clientLocales from '../../client/locales/index.js';
import workflowPlugin from '../../client/plugin.js';
import { WorkflowInspector } from '../../client/workflow-management/inspector.js';
import { createWorkflowI18nRuntime } from '../i18n.js';

describe('workflow plugin Client i18n', () => {
  afterEach(cleanup);

  it('declares lazy English and Chinese resources', () => {
    expect(workflowPlugin().locales).toMatchObject({
      'en-US': expect.any(Function),
      'zh-CN': expect.any(Function),
    });
  });

  it.each([
    ['en-US', 'Workflow overview', 'Select a node to inspect it.'],
    ['zh-CN', '工作流概览', '选择一个节点以查看详情。'],
  ] as const)(
    'renders a public component in %s with its explicit plugin namespace',
    async (locale, title, description) => {
      const runtime = await createWorkflowI18nRuntime(clientLocales, locale);

      render(
        <I18nProvider runtime={runtime}>
          <NamespaceScope ns='@nocobase/app-plugin-dag-flow-test-app'>
            <WorkflowInspector nodeKey={null} attempts={[]} />
          </NamespaceScope>
        </I18nProvider>,
      );

      expect(screen.getByRole('heading', { name: title })).toBeDefined();
      expect(screen.getByText(description)).toBeDefined();
    },
  );
  it('translates attempt statuses when the language changes without remounting', async () => {
    const runtime = await createWorkflowI18nRuntime(clientLocales, 'en-US');
    render(
      <I18nProvider runtime={runtime}>
        <WorkflowInspector
          nodeKey='task'
          attempts={[
            {
              id: 'attempt-1',
              workflowRunId: 'run-1',
              nodeId: 'node-1',
              branchKey: null,
              nodeKey: 'task',
              status: 1,
              startedAt: '2026-09-19T00:00:00Z',
              finishedAt: '2026-09-19T00:00:01Z',
            },
          ]}
        />
      </I18nProvider>,
    );
    expect(screen.getByRole('option', { name: '1 · Succeeded' })).toBeDefined();
    await act(async () => {
      await runtime.changeLanguage('zh-CN');
    });
    expect(screen.getByRole('option', { name: '1 · 成功' })).toBeDefined();
  });
});
