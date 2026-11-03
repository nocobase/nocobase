import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { BackButton } from '../../client/components/back-button.js';
import {
  OfficeParameterEditor,
  OfficePeoplePicker,
} from '../../client/pages/workflows/office-parameters.js';
import type { OfficeWorkflowParameters } from '@nocobase/app-plugin-office-flows-example/client';
import { useState } from 'react';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import { PageBreadcrumbProvider } from '@nocobase/app-client';
import WorkflowParametersPage, {
  WorkflowParametersForm,
} from '../../client/pages/workflows/parameters.js';
import {
  useParameterBindingEditor,
  lifecycleLocales,
} from '@nocobase/app-plugin-lifecycle-example/client';
import { expenseLifecycle } from '@nocobase/app-plugin-lifecycle-example/server';
import { officeLocales } from '@nocobase/app-plugin-office-flows-example/client';
import {
  I18nProvider,
  NamespaceScope,
  useTranslation,
} from '@nocobase/i18n/client';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { describeLifecycle } from '@nocobase/lifecycle';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { CategoryManager } from '../../client/pages/workflows/categories.js';
import { WorkflowDetailPage } from '../../client/pages/workflows/detail-page.js';
import WorkflowsPage from '../../client/pages/workflows/index.js';
import DefinitionPage from '../../client/pages/workflows/definition.js';
import DefinitionsPage from '../../client/pages/workflows/definitions.js';
import ExecutionsPage from '../../client/pages/workflows/executions.js';
import ExecutionPage, {
  ExecutionDiagram,
} from '../../client/pages/workflows/execution.js';
import { workflowDate } from '../../client/pages/workflows/hooks.js';
import { DataState } from '../../client/pages/workflows/shared.js';
import type { WorkflowExecutionDetail } from '../../shared/workflows.js';

const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('#components/route-drawer', () => ({
  RouteDrawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: true, isPending: false }),
}));
const namespace = '@nocobase/app-template-examples';

async function view(
  children: ReactNode,
  locale = 'en-US',
  path = '/workflows/executions',
) {
  const runtime = await createTestI18nRuntime({
    locale,
    application: {
      namespace,
      resources: {
        'en-US': async () => ({ default: enUS }),
        'zh-CN': async () => ({ default: zhCN }),
      },
    },
    namespaces: {
      '@nocobase/app-plugin-lifecycle-example': {
        'en-US': lifecycleLocales['en-US'],
        'zh-CN': lifecycleLocales['zh-CN'],
      },
      '@nocobase/app-plugin-office-flows-example': {
        'en-US': officeLocales['en-US'],
        'zh-CN': officeLocales['zh-CN'],
      },
    },
  });
  return render(
    <I18nProvider runtime={runtime}>
      <NamespaceScope ns={namespace}>
        <MemoryRouter initialEntries={[path]}>
          <RouteTreeProvider routes={[]}>
            <PageBreadcrumbProvider>
              <Breadcrumbs />
              {children}
            </PageBreadcrumbProvider>
          </RouteTreeProvider>
        </MemoryRouter>
      </NamespaceScope>
    </I18nProvider>,
  );
}
function ParameterBindingHarness() {
  const binding = useParameterBindingEditor(
    describeLifecycle(expenseLifecycle),
    'zhao',
  );
  return (
    <>
      <button onClick={() => binding.onBinding('state', 'draft')}>
        Open parameters
      </button>
      {binding.editor}
    </>
  );
}
function Location() {
  return <output aria-label='Location'>{useLocation().search}</output>;
}
function LocaleCheck() {
  const { t } = useTranslation();
  return <span>{t('workflows.history')}</span>;
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 80, height: 20 }),
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
});
beforeEach(() => {
  api.request.mockReset();
});

const history = [
  { id: '1', transition: '$create', from: null, to: 'draft' },
  { id: '2', transition: 'submit', from: 'draft', to: 'awaitingManager' },
  { id: '3', transition: 'withdraw', from: 'awaitingManager', to: 'draft' },
  { id: '4', transition: 'submit', from: 'draft', to: 'awaitingManager' },
].map((entry, index) => ({
  ...entry,
  lifecycle: 'expenses',
  recordId: '1',
  actorId: 'lin',
  input: {},
  at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
  version: index,
  requestId: null,
}));
const detail: WorkflowExecutionDetail = {
  workflow: {
    id: 'lifecycle.expenses',
    name: 'expenses',
    source: 'lifecycle',
    states: 4,
    transitions: 4,
    executionCount: 1,
    lastExecutedAt: null,
  },
  description: describeLifecycle(expenseLifecycle),
  parameters: {},
  diagram: '',
  view: {
    record: { id: '1', status: 'awaitingManager' },
    state: 'awaitingManager',
    version: 3,
    available: [],
    history: { transitions: history, effectRuns: [] },
  },
};

describe('workflow management pages', () => {
  it.each(['en-US', 'zh-CN'])(
    'replays creation and loops without coloring unvisited branches in %s',
    async (locale) => {
      await view(<ExecutionDiagram detail={detail} />, locale);
      const draft = await screen.findByTestId('rf__node-draft');
      const review = screen.getByTestId('rf__node-awaitingManager');
      const approved = screen.getByTestId('rf__node-approved');
      expect(
        draft.querySelector('[data-execution-state="visited"]'),
      ).not.toBeNull();
      expect(
        review.querySelector('[data-execution-state="current"]'),
      ).not.toBeNull();
      expect(
        approved.querySelector('[data-execution-state="visited"]'),
      ).toBeNull();
      const copy = locale === 'zh-CN' ? zhCN.workflows : enUS.workflows;
      fireEvent.click(
        screen.getByRole('button', {
          name: copy.showStep.replace('{{step}}', '1'),
        }),
      );
      expect(
        draft.querySelector('[data-execution-state="current"]'),
      ).not.toBeNull();
      expect(
        review.querySelector('[data-execution-state="visited"]'),
      ).toBeNull();
      fireEvent.click(
        screen.getByRole('button', {
          name: copy.showStep.replace('{{step}}', '3'),
        }),
      );
      expect(
        draft.querySelector('[data-execution-state="current"]'),
      ).not.toBeNull();
      expect(
        review.querySelector('[data-execution-state="visited"]'),
      ).not.toBeNull();
      fireEvent.click(
        screen.getByRole('button', {
          name: copy.showStep.replace('{{step}}', '4'),
        }),
      );
      expect(
        review.querySelector('[data-execution-state="current"]'),
      ).not.toBeNull();
    },
  );

  it('uses one refresh action to reload data and return from history to latest progress', async () => {
    api.request.mockResolvedValue({ data: detail });
    await view(
      <Routes>
        <Route
          path='/workflows/executions/:workflowId/:recordId'
          element={<ExecutionPage />}
        />
      </Routes>,
      'en-US',
      '/workflows/executions/lifecycle.expenses/1',
    );
    const firstStep = await screen.findByRole('button', {
      name: 'Show progress at step 1',
    });
    await userEvent.click(firstStep);
    expect(firstStep).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.queryByRole('button', { name: enUS.workflows.latest }),
    ).not.toBeInTheDocument();
    const refresh = screen.getByRole('button', { name: 'Refresh' });
    let finish: ((value: unknown) => void) | undefined;
    api.request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await userEvent.click(refresh);
    expect(api.request).toHaveBeenCalledTimes(2);
    expect(refresh).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Show progress at step 1' }),
    ).toHaveAttribute('aria-pressed', 'false');
    finish?.({ data: detail });
    await waitFor(() => expect(refresh).toBeEnabled());
    expect(
      screen
        .getByTestId('rf__node-awaitingManager')
        .querySelector('[data-execution-state="current"]'),
    ).not.toBeNull();
  });

  it.each(['en-US', 'zh-CN'])(
    'shows sortable execution counts and opens filtered records in %s',
    async (locale) => {
      const workflows = [
        {
          ...detail.workflow,
          executionCount: 105,
          lastExecutedAt: '2026-10-16T06:30:00.000Z',
        },
        {
          id: 'office.dataRequests',
          name: 'dataRequests',
          source: 'office',
          states: 4,
          transitions: 5,
          executionCount: 0,
        },
      ];
      api.request.mockImplementation(async ({ path }) =>
        path.endsWith('definitions')
          ? { data: workflows }
          : { data: [], meta: { page: 1, pageSize: 20, total: 0 } },
      );
      await view(
        <Routes>
          <Route path='/workflows/definitions' element={<DefinitionsPage />} />
          <Route path='/workflows/executions' element={<ExecutionsPage />} />
        </Routes>,
        locale,
        '/workflows/definitions?page=5&workflowId=old',
      );
      const copy = locale === 'zh-CN' ? zhCN.workflows : enUS.workflows;
      const count = await screen.findByRole('link', { name: /\(105\)$/ });
      expect(count).toHaveTextContent('105');
      expect(count).toHaveAttribute(
        'href',
        '/workflows/executions?workflowId=lifecycle.expenses',
      );
      expect(
        screen.queryByRole('link', { name: /\(0\)$/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(copy.neverExecuted)).toBeInTheDocument();
      expect(count.closest('td')).toHaveTextContent(
        copy.lastExecutedAt.replace(
          '{{date}}',
          workflowDate('2026-10-16T06:30:00.000Z', locale),
        ),
      );
      expect(screen.getAllByRole('columnheader')).toHaveLength(2);
      await userEvent.click(
        screen.getByRole('button', { name: copy.executionActivity }),
      );
      expect(screen.getAllByRole('row')[1]).toHaveTextContent(
        copy.neverExecuted,
      );
      await userEvent.click(
        screen.getByRole('button', { name: copy.executionActivity }),
      );
      expect(screen.getAllByRole('row')[1]).toHaveTextContent('105');
      await userEvent.click(count);
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith({
          path: 'workflows/executions',
          query: {
            page: '1',
            pageSize: '20',
            workflowId: 'lifecycle.expenses',
          },
        }),
      );
      expect(
        await screen.findByText(
          (locale === 'en-US' ? enUS : zhCN).listFeedback.noResults,
        ),
      ).toBeInTheDocument();
    },
  );

  it('keeps pagination and workflow filtering in the URL and preserves them on detail links', async () => {
    const workflow = detail.workflow;
    api.request.mockImplementation(async ({ path, query }) =>
      path.endsWith('definitions')
        ? { data: [workflow] }
        : {
            data: [
              {
                workflowId: workflow.id,
                recordId: '42',
                title: 'Review',
                state: 'awaitingManager',
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            meta: { page: Number(query.page), pageSize: 20, total: 105 },
          },
    );
    await view(
      <>
        <ExecutionsPage />
        <Location />
      </>,
      'en-US',
      '/workflows/executions?workflowId=lifecycle.expenses&page=5',
    );
    expect(await screen.findByRole('link', { name: '#42' })).toHaveAttribute(
      'href',
      '/workflows/executions/lifecycle.expenses/42?workflowId=lifecycle.expenses&page=5',
    );
    expect(
      screen
        .getAllByRole('columnheader')
        .slice(0, 2)
        .map((cell) => cell.textContent),
    ).toEqual([enUS.workflows.record, enUS.workflows.workflow]);
    expect(screen.getAllByRole('row')[1].querySelector('td')).toHaveTextContent(
      '#42',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith({
        path: 'workflows/executions',
        query: {
          page: '6',
          pageSize: '20',
          workflowId: 'lifecycle.expenses',
        },
      }),
    );
    expect(screen.getByLabelText('Location')).toHaveTextContent('page=6');
    await userEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith({
        path: 'workflows/executions',
        query: { page: '1', pageSize: '20' },
      }),
    );
  });

  it.each(['en-US', 'zh-CN'])(
    'searches execution workflow names across pages in %s',
    async (locale) => {
      const copy = locale === 'zh-CN' ? zhCN.workflows : enUS.workflows;
      api.request.mockImplementation(async ({ path, query }) =>
        path.endsWith('definitions')
          ? {
              data: [
                detail.workflow,
                { ...detail.workflow, id: 'office.expenses', name: 'expenses' },
              ],
            }
          : {
              data: [],
              meta: { page: Number(query.page), pageSize: 20, total: 0 },
            },
      );
      await view(
        <>
          <ExecutionsPage />
          <Location />
        </>,
        locale,
        '/workflows/executions?workflowId=lifecycle.expenses&page=5&order=oldest',
      );
      const input = screen.getByRole('searchbox', { name: copy.filterByName });
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      await userEvent.type(input, copy.names.expenses);
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(screen.getByLabelText('Location')).toHaveTextContent('page=5');
      expect(screen.getByLabelText('Location')).not.toHaveTextContent('name=');
      fireEvent.compositionStart(input);
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
      fireEvent.compositionEnd(input);
      expect(screen.getByLabelText('Location')).not.toHaveTextContent('name=');
      await userEvent.keyboard('{Enter}');
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith({
          path: 'workflows/executions',
          query: {
            page: '1',
            pageSize: '20',
            order: 'oldest',
            q: copy.names.expenses,
          },
        }),
      );
      expect(screen.getByLabelText('Location')).not.toHaveTextContent(
        'workflowId=',
      );
      expect(
        new URLSearchParams(
          screen.getByLabelText('Location').textContent ?? '',
        ).get('name'),
      ).toBe(copy.names.expenses);
      await userEvent.clear(input);
      await userEvent.type(input, 'REVIEWER');
      await userEvent.keyboard('{Enter}');
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith({
          path: 'workflows/executions',
          query: {
            page: '1',
            pageSize: '20',
            order: 'oldest',
            q: 'REVIEWER',
          },
        }),
      );
      await userEvent.clear(input);
      await userEvent.type(input, 'nonexistent');
      await userEvent.keyboard('{Enter}');
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith({
          path: 'workflows/executions',
          query: {
            page: '1',
            pageSize: '20',
            order: 'oldest',
            q: 'nonexistent',
          },
        }),
      );
      expect(
        await screen.findByText(
          (locale === 'en-US' ? enUS : zhCN).listFeedback.noResults,
        ),
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: copy.clear }));
      expect(input).toHaveValue('');
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith({
          path: 'workflows/executions',
          query: { page: '1', pageSize: '20', order: 'oldest' },
        }),
      );
    },
  );

  it.each(['', '?workflowId=lifecycle.expenses'])(
    'shows loading then successful empty feedback while retaining pagination %s',
    async (query) => {
      let finish: ((value: unknown) => void) | undefined;
      api.request.mockImplementation(({ path }) =>
        path.endsWith('definitions')
          ? Promise.resolve({ data: [detail.workflow] })
          : new Promise((resolve) => {
              finish = resolve;
            }),
      );
      await view(<ExecutionsPage />, 'en-US', `/workflows/executions${query}`);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
      expect(
        screen.queryByText(enUS.listFeedback.empty),
      ).not.toBeInTheDocument();
      await waitFor(() => expect(finish).toBeDefined());
      finish?.({ data: [], meta: { page: 1, pageSize: 20, total: 0 } });
      const empty = await screen.findByText(
        query ? enUS.listFeedback.noResults : enUS.listFeedback.empty,
      );
      expect(empty.closest('[role=status]')).toBeInTheDocument();
      const table = screen.getByRole('table');
      expect(table).toContainElement(empty);
      expect(empty.closest('tbody')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    },
  );

  it('distinguishes missing records from retryable errors and hides server internals', async () => {
    const retry = vi.fn();
    const rendered = await view(
      <DataState loading={false} status={404} retry={retry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      enUS.workflows.notFound,
    );
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
    rendered.unmount();
    await view(<DataState loading={false} status={500} retry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it.each(['detail', 'parameters', 'draft', 'awaitingManager'])(
    'keeps the standalone detail layout when opening parameters from %s and saves through that workflow endpoint',
    async (entry) => {
      const group = {
        key: 'expenseThresholds',
        title: 'Expense thresholds',
        revision: 0,
        origin: 'default',
        schemaVersion: 1,
        values: { autoApproveLimit: 5000, financeLimit: 50000 },
        canUpdate: true,
        fields: {
          financeLimit: {
            type: 'number',
            title: 'Finance review limit',
            bindings: [{ state: 'awaitingManager' }],
          },
          autoApproveLimit: {
            type: 'number',
            title: 'Automatic approval limit',
            bindings: [{ state: 'draft' }],
          },
        },
        uses: [],
      };
      api.request.mockImplementation(({ path, method, json }) =>
        Promise.resolve({
          data:
            path === 'workflows/categories'
              ? []
              : path === 'workflows/definitions'
                ? []
                : method === 'PUT'
                  ? {
                      kind: 'lifecycle',
                      groups: [
                        {
                          ...group,
                          values: { ...group.values, ...json.values },
                        },
                      ],
                      revision: 1,
                    }
                  : path.endsWith('/parameters')
                    ? { kind: 'lifecycle', groups: [group] }
                    : {
                        ...detail,
                        workflow: {
                          ...detail.workflow,
                          id: 'lifecycle.expenses',
                          name: 'expenses',
                        },
                        description: describeLifecycle(expenseLifecycle),
                      },
        }),
      );
      await view(
        <Routes>
          <Route path='/workflows' element={<WorkflowsPage />}>
            <Route path='definitions' element={<DefinitionsPage />}>
              <Route path=':workflowId' element={<DefinitionPage />}>
                <Route path='parameters' element={<WorkflowParametersPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>,
        'en-US',
        `/workflows/definitions/lifecycle.expenses${entry === 'parameters' ? '/parameters' : ''}`,
      );
      if (entry === 'draft' || entry === 'awaitingManager') {
        fireEvent.click(await screen.findByTestId(`rf__node-${entry}`));
      }
      await screen.findByRole('heading', {
        name: (name) => name.startsWith(enUS.workflows.names.expenses),
        level: 1,
        hidden: true,
      });
      if (entry === 'parameters')
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
      else expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // Include the inert background: modal accessibility hiding must not mask a layout regression.
      expect(
        screen.queryByRole('tablist', { hidden: true }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('searchbox', { hidden: true }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', {
          name: enUS.workflows.title,
          hidden: true,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: (name) => name.startsWith(enUS.workflows.names.expenses),
          level: 1,
          hidden: true,
        }),
      ).toBeInTheDocument();
      const fieldTitle =
        entry === 'awaitingManager'
          ? 'Finance review limit'
          : 'Automatic approval limit';
      expect(
        screen.queryByRole('heading', { name: 'Expense thresholds' }),
      ).not.toBeInTheDocument();
      expect(
        await screen.findByRole('heading', { name: 'Draft', exact: true }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Awaiting manager', exact: true }),
      ).toBeInTheDocument();
      fireEvent.change(await screen.findByLabelText(fieldTitle), {
        target: { value: '7500' },
      });
      if (entry === 'parameters') {
        await userEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
        await userEvent.click(
          screen.getByRole('button', { name: 'Keep editing' }),
        );
      }
      expect(screen.getByLabelText(fieldTitle)).toHaveValue(7500);
      expect(
        screen.getAllByRole('button', { name: 'Save parameters' }),
      ).toHaveLength(1);
      await userEvent.click(
        screen.getByRole('button', { name: 'Save parameters' }),
      );
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith(
          expect.objectContaining({
            path: 'workflows/definitions/lifecycle.expenses/parameters',
            method: 'PUT',
            json: expect.objectContaining({
              values:
                entry === 'awaitingManager'
                  ? { financeLimit: 7500 }
                  : { autoApproveLimit: 7500 },
            }),
          }),
        ),
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    },
  );

  it('uses one save action for multiple groups and retains failed drafts for retry', async () => {
    const groups = ['first', 'second'].map((key) => ({
      key,
      title: key,
      revision: 0,
      origin: 'default',
      schemaVersion: 1,
      values: { [key]: 1 },
      canUpdate: true,
      fields: { [key]: { type: 'number', title: key } },
      uses: [],
    }));
    let fail = true;
    api.request.mockImplementation(({ method, json }) => {
      if (method !== 'PUT')
        return Promise.resolve({
          data: {
            kind: 'lifecycle',
            revision: 0,
            values: { first: 1, second: 1 },
            groups,
          },
        });
      if (fail) return Promise.reject(new Error('Save failed'));
      return Promise.resolve({
        data: {
          kind: 'lifecycle',
          groups,
          values: json.values,
          revision: 1,
        },
      });
    });
    await view(
      <Routes>
        <Route
          path='/workflows/definitions/:workflowId'
          element={<div>Detail</div>}
        />
        <Route
          path='/workflows/definitions/:workflowId/parameters'
          element={<WorkflowParametersPage />}
        />
      </Routes>,
      'en-US',
      '/workflows/definitions/lifecycle.expenses/parameters',
    );
    fireEvent.change(await screen.findByLabelText('first'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('second'), {
      target: { value: '3' },
    });
    expect(
      screen.getAllByRole('button', { name: 'Save parameters' }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: 'Save values' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Save parameters' }),
    );
    await screen.findByText('Save failed');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('second')).toHaveValue(3);
    fail = false;
    await userEvent.click(
      screen.getByRole('button', { name: 'Save parameters' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    const writes = api.request.mock.calls.filter(
      ([request]) => request.method === 'PUT',
    );
    expect(writes).toHaveLength(2);
    for (const [write] of writes)
      expect(write.json).toMatchObject({
        values: { first: 2, second: 3 },
        expectedRevision: 0,
      });
  });

  it('closes the office parameter dialog after the shared save action succeeds', async () => {
    const configuration = {
      kind: 'office',
      revision: 0,
      values: {
        holidays: [{ date: '2026-01-01', name: 'Holiday', kind: 'holiday' }],
      },
    };
    api.request.mockImplementation(({ method, json }) =>
      Promise.resolve({
        data:
          method === 'PUT'
            ? { ...configuration, values: json.values, revision: 1 }
            : configuration,
      }),
    );
    await view(
      <Routes>
        <Route
          path='/workflows/definitions/:workflowId'
          element={<div>Detail</div>}
        />
        <Route
          path='/workflows/definitions/:workflowId/parameters'
          element={<WorkflowParametersPage />}
        />
      </Routes>,
      'en-US',
      '/workflows/definitions/office.dataRequests/parameters',
    );
    fireEvent.change(await screen.findByLabelText('Date'), {
      target: { value: '2026-01-02' },
    });
    expect(
      screen.getAllByRole('button', { name: 'Save parameters' }),
    ).toHaveLength(1);
    await userEvent.click(
      screen.getByRole('button', { name: 'Save parameters' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        json: expect.objectContaining({
          kind: 'office',
          expectedRevision: 0,
          values: {
            holidays: [
              { date: '2026-01-02', name: 'Holiday', kind: 'holiday' },
            ],
          },
        }),
      }),
    );
  });

  it('reads fresh parameter values each time a configured node is reopened', async () => {
    const group = {
      key: 'expenseThresholds',
      title: 'Expense thresholds',
      revision: 0,
      origin: 'default',
      schemaVersion: 1,
      values: { autoApproveLimit: 5000 },
      canUpdate: true,
      fields: {
        autoApproveLimit: {
          type: 'number',
          title: 'Automatic approval limit',
          bindings: [{ state: 'draft' }],
        },
      },
      uses: [],
    };
    api.request.mockResolvedValue({ data: group });
    await view(<ParameterBindingHarness />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Open parameters' }),
    );
    expect(
      await screen.findByLabelText('Automatic approval limit'),
    ).toHaveValue(5000);
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    api.request.mockResolvedValue({
      data: {
        ...group,
        revision: 1,
        origin: 'database',
        values: { autoApproveLimit: 5002 },
      },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Open parameters' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Automatic approval limit')).toHaveValue(
        5002,
      ),
    );
  });

  it('loads the Chinese application copy', async () => {
    await view(<LocaleCheck />, 'zh-CN');
    expect(screen.getByText(zhCN.workflows.history)).toBeInTheDocument();
  });
});

it('retains loaded definitions while refreshing and exposes the busy state', async () => {
  api.request.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
    data: [
      {
        id: 'lifecycle.expenses',
        name: 'expenses',
        source: 'lifecycle',
        states: 4,
        transitions: 5,
        executionCount: 0,
      },
    ],
  });
  await view(<DefinitionsPage />);
  const link = await screen.findByRole('link', { name: 'Expense approval' });
  let finish: ((value: unknown) => void) | undefined;
  api.request.mockResolvedValue({ data: [] }).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(link).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  finish?.({ data: [] });
  await screen.findByText(enUS.listFeedback.empty);
});

it('keeps a failed category draft and saves its trimmed name and order', async () => {
  const saved = vi.fn();
  await view(<CategoryManager categories={[]} onSaved={saved} />);
  await userEvent.click(screen.getByRole('button', { name: 'New category' }));
  await userEvent.type(screen.getByLabelText('Category name'), ' Finance ');
  await userEvent.click(screen.getByRole('radio', { name: 'Blue' }));
  api.request.mockRejectedValueOnce(new Error('Offline'));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
  expect(screen.getByLabelText('Category name')).toHaveValue(' Finance ');
  api.request.mockResolvedValueOnce({
    data: { id: 'finance', title: 'Finance', sortOrder: 0 },
  });
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(api.request).toHaveBeenLastCalledWith({
    path: 'workflows/categories',
    method: 'POST',
    json: { title: 'Finance', sortOrder: 0, color: 'blue' },
  });
});

it('preserves the category filter in definition detail links', async () => {
  api.request.mockImplementation(async ({ path }) => ({
    data: path.endsWith('categories')
      ? [{ id: 'finance', title: 'Finance', sortOrder: 0 }]
      : [{ ...detail.workflow, categoryId: 'finance' }],
  }));
  await view(
    <DefinitionsPage />,
    'en-US',
    '/workflows/definitions?category=finance',
  );
  const link = await screen.findByRole('link', {
    name: enUS.workflows.names.expenses,
  });
  expect(link).toHaveAttribute(
    'href',
    `/workflows/definitions/${detail.workflow.id}?category=finance`,
  );
  expect(
    screen.queryByRole('link', { name: 'Order payment' }),
  ).not.toBeInTheDocument();
});

it('persists a drag reorder as one operation and leaves All fixed without an Uncategorized tab', async () => {
  const saved = vi.fn();
  const categories = [
    { id: 'finance', title: 'Finance', sortOrder: 0 },
    { id: 'office', title: 'Office', sortOrder: 1 },
  ];
  await view(<CategoryManager categories={categories} onSaved={saved} />);
  api.request.mockResolvedValueOnce({ data: null });
  expect(
    screen.queryByRole('button', { name: 'Uncategorized' }),
  ).not.toBeInTheDocument();
  const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };
  fireEvent.dragStart(screen.getByRole('button', { name: 'Finance' }), {
    dataTransfer,
  });
  fireEvent.dragOver(screen.getByRole('group', { name: 'Office' }), {
    dataTransfer,
  });
  fireEvent.drop(screen.getByRole('group', { name: 'Office' }), {
    dataTransfer,
  });
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(api.request).toHaveBeenCalledWith({
    path: 'workflows/categoryOrder',
    method: 'PUT',
    json: { ids: ['office', 'finance'] },
  });
  expect(
    screen.getByRole('button', { name: 'All categories' }),
  ).not.toHaveAttribute('draggable', 'true');
  await userEvent.click(
    screen.getByRole('button', { name: 'Category menu: Office' }),
  );
  expect(
    await screen.findByRole('menuitem', { name: 'Move up' }),
  ).not.toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('menuitem', { name: 'Move down' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

it('edits and deletes categories through each category menu', async () => {
  const saved = vi.fn();
  await view(
    <CategoryManager
      categories={[{ id: 'finance', title: 'Finance', sortOrder: 0 }]}
      onSaved={saved}
    />,
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Category menu: Finance' }),
  );
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
  expect(screen.getByLabelText('Category name')).toHaveValue('Finance');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await userEvent.click(
    screen.getByRole('button', { name: 'Category menu: Finance' }),
  );
  await userEvent.click(
    await screen.findByRole('menuitem', { name: 'Delete' }),
  );
  expect(
    screen.getByText(
      'Delete “Finance”? Its workflows will become uncategorized.',
    ),
  ).toBeInTheDocument();
  api.request.mockResolvedValueOnce({ data: null });
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirm deletion' }),
  );
  await waitFor(() => expect(saved).toHaveBeenCalledWith('finance'));
});

it.each(['en-US', 'zh-CN'])(
  'filters workflow names within the selected category in %s',
  async (locale) => {
    const copy = locale === 'zh-CN' ? zhCN.workflows : enUS.workflows;
    api.request.mockImplementation(async ({ path, query }) => ({
      data: path.endsWith('categories')
        ? [{ id: 'finance', title: 'Finance', sortOrder: 0 }]
        : query.q === 'no-match'
          ? []
          : query.q === copy.names.orders
            ? [
                {
                  ...detail.workflow,
                  id: 'orders',
                  name: 'orders',
                  categoryId: 'finance',
                },
              ]
            : query.q === 'EXPENSES'
              ? [{ ...detail.workflow, categoryId: 'finance' }]
              : [
                  { ...detail.workflow, categoryId: 'finance' },
                  {
                    ...detail.workflow,
                    id: 'orders',
                    name: 'orders',
                    categoryId: 'finance',
                  },
                ],
    }));
    await view(
      <DefinitionsPage />,
      locale,
      '/workflows/definitions?category=finance',
    );
    await screen.findByRole('link', { name: copy.names.expenses });
    const input = screen.getByRole('searchbox', { name: copy.filterByName });
    const refresh = screen.getByRole('button', { name: copy.refresh });
    expect(
      screen
        .getByRole('button', { name: 'Finance' })
        .compareDocumentPosition(refresh) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      refresh.compareDocumentPosition(screen.getByRole('table')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await userEvent.type(input, copy.names.orders);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(
      screen.getByRole('link', { name: copy.names.expenses }),
    ).toBeInTheDocument();
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.compositionEnd(input);
    expect(
      screen.getByRole('link', { name: copy.names.expenses }),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith({
        path: 'workflows/definitions',
        query: { q: copy.names.orders, category: 'finance' },
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: copy.names.expenses }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: copy.names.orders }),
    ).toHaveAttribute(
      'href',
      `/workflows/definitions/orders?${new URLSearchParams({ category: 'finance', name: copy.names.orders })}`,
    );
    await userEvent.clear(input);
    await userEvent.type(input, '  EXPENSES  ');
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('link', { name: copy.names.expenses });
    expect(
      screen.queryByRole('link', { name: copy.names.orders }),
    ).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'no-match');
    await userEvent.keyboard('{Enter}');
    await screen.findByText(
      (locale === 'en-US' ? enUS : zhCN).listFeedback.noResults,
    );
    await userEvent.clear(input);
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('link', { name: copy.names.expenses });
  },
);

it.each(['en-US', 'zh-CN'])(
  'shows standalone definition details and returns to the filtered list in %s',
  async (locale) => {
    api.request.mockImplementation(async ({ path }) => ({
      data:
        path === 'workflows/categories'
          ? []
          : path.endsWith('/parameters')
            ? { kind: 'lifecycle', revision: 0, groups: [], values: {} }
            : detail,
    }));
    const copy = locale === 'zh-CN' ? zhCN.workflows : enUS.workflows;
    await view(
      <Routes>
        <Route path='/workflows' element={<WorkflowsPage />}>
          <Route
            path='definitions'
            element={
              <div>
                Filtered list
                <Location />
              </div>
            }
          />
          <Route path='definitions/:workflowId' element={<DefinitionPage />} />
        </Route>
      </Routes>,
      locale,
      '/workflows/definitions/lifecycle.expenses?category=finance&name=expense',
    );
    expect(
      await screen.findByRole('heading', {
        name: (name) => name.startsWith(copy.names.expenses),
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: copy.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: copy.stateTransitions }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText(copy.noParameters)).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: copy.processDiagram }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole('heading', { level: 1 })
        .closest('header')
        ?.querySelector('p'),
    ).toHaveTextContent(copy.names.expenses);
    const executionsLink = screen.getByRole('link', {
      name: copy.executionCountLink.replace(
        '{{count}}',
        String(detail.workflow.executionCount),
      ),
    });
    expect(executionsLink.closest('header')).toBeInTheDocument();
    expect(executionsLink).toHaveAttribute(
      'href',
      `/workflows/executions?workflowId=${encodeURIComponent(detail.workflow.id)}`,
    );
    expect(
      screen.queryByRole('button', { name: copy.viewExecutions }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: copy.back }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: copy.definitions }));
    expect(await screen.findByRole('tablist')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toHaveTextContent(
      '?category=finance&name=expense',
    );
  },
);

it('omits list navigation on execution detail routes', async () => {
  await view(
    <Routes>
      <Route path='/workflows' element={<WorkflowsPage />}>
        <Route
          path='executions/:workflowId/:recordId'
          element={<div>Execution detail</div>}
        />
      </Route>
    </Routes>,
    'en-US',
    '/workflows/executions/lifecycle.expenses/1',
  );
  expect(screen.getByText('Execution detail')).toBeInTheDocument();
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: enUS.workflows.title }),
  ).not.toBeInTheDocument();
});

it('links execution breadcrumbs to the filtered list on direct entry', async () => {
  await view(
    <WorkflowDetailPage
      title='Example · #1'
      listTitle={enUS.workflows.executions}
      closeTo={{
        pathname: '/workflows/executions',
        search: '?workflowId=example&page=2',
      }}
    >
      <span>Workflow details</span>
    </WorkflowDetailPage>,
    'en-US',
    '/workflows/executions/example/1?workflowId=example&page=2',
  );
  expect(
    screen.getByRole('navigation', { name: 'Breadcrumb' }),
  ).toHaveTextContent('Example · #1');
  expect(
    screen.getByRole('link', { name: enUS.workflows.executions }),
  ).toHaveAttribute('href', '/workflows/executions?workflowId=example&page=2');
  expect(
    screen.queryByRole('link', { name: enUS.workflows.back }),
  ).not.toBeInTheDocument();
});

it('keeps inline drafts after failure and advances the revision for successive saves', async () => {
  const group = {
    key: 'threshold',
    title: 'Threshold',
    revision: 0,
    origin: 'default',
    schemaVersion: 1,
    values: { limit: 10 },
    canUpdate: true,
    fields: { limit: { type: 'number', title: 'Limit' } },
    uses: [],
  };
  let revision = 0;
  let fail = true;
  api.request.mockImplementation(async ({ method, json }) => {
    if (method === 'PUT' && fail) throw new Error('Offline');
    if (method === 'PUT') revision++;
    return {
      data: {
        kind: 'lifecycle',
        revision,
        values: json?.values ?? group.values,
        groups: [{ ...group, revision, values: json?.values ?? group.values }],
      },
    };
  });
  await view(
    <Routes>
      <Route
        path='/workflows/definitions/:workflowId'
        element={<WorkflowParametersForm inline />}
      />
    </Routes>,
    'en-US',
    '/workflows/definitions/lifecycle.expenses',
  );
  fireEvent.change(await screen.findByLabelText('Limit'), {
    target: { value: '20' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
  expect(screen.getByLabelText('Limit')).toHaveValue(20);
  fail = false;
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await screen.findByText('Parameters saved.');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Limit'), { target: { value: '30' } });
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'PUT',
        json: expect.objectContaining({
          expectedRevision: 1,
          values: { limit: 30 },
        }),
      }),
    ),
  );
  await screen.findByText('Parameters saved.');
});

it('saves office parameters inline and keeps the next save on the current revision', async () => {
  let revision = 0;
  const values = {
    holidays: [{ date: '2026-01-01', name: 'Holiday', kind: 'holiday' }],
  };
  api.request.mockImplementation(async ({ method, json }) => ({
    data: {
      kind: 'office',
      workflow: 'dataRequests',
      revision: method === 'PUT' ? ++revision : revision,
      values: json?.values ?? values,
    },
  }));
  await view(
    <Routes>
      <Route
        path='/workflows/definitions/:workflowId'
        element={<WorkflowParametersForm inline />}
      />
    </Routes>,
    'en-US',
    '/workflows/definitions/office.dataRequests',
  );
  fireEvent.change(await screen.findByLabelText('Date'), {
    target: { value: '2026-01-02' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await screen.findByText('Parameters saved.');
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: '2026-01-03' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'PUT',
        json: expect.objectContaining({ expectedRevision: 1 }),
      }),
    ),
  );
  await screen.findByText('Parameters saved.');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('reloads the complete office snapshot after a conflict before the next inline save', async () => {
  const configuration = {
    kind: 'office',
    workflow: 'dataRequests',
    revision: 0,
    values: {
      holidays: [{ date: '2026-01-01', name: 'Holiday', kind: 'holiday' }],
    },
  };
  let conflict = true;
  api.request.mockImplementation(async ({ method, json }) => {
    if (method === 'PUT' && conflict)
      throw Object.assign(new Error('Changed elsewhere'), {
        reason: 'CONFIGURATION_CONFLICT',
      });
    if (method === 'PUT')
      return { data: { ...configuration, revision: 3, values: json.values } };
    return { data: configuration };
  });
  await view(
    <Routes>
      <Route
        path='/workflows/definitions/:workflowId'
        element={<WorkflowParametersForm inline />}
      />
    </Routes>,
    'en-US',
    '/workflows/definitions/office.dataRequests',
  );
  fireEvent.change(await screen.findByLabelText('Date'), {
    target: { value: '2026-01-02' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await screen.findByText(enUS.workflows.parametersFailed);
  configuration.revision = 2;
  configuration.values.holidays[0].name = 'Updated elsewhere';
  await userEvent.click(
    screen.getByRole('button', {
      name: enUS.workflows.reloadParameterRevision,
    }),
  );
  await userEvent.click(
    screen.getByRole('button', {
      name: enUS.workflows.officeRules.reloadAction,
      exact: true,
    }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('Name')).toHaveValue('Updated elsewhere'),
  );
  expect(screen.getByLabelText('Date')).toHaveValue('2026-01-01');
  conflict = false;
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: '2026-01-03' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'PUT',
        json: {
          kind: 'office',
          expectedRevision: 2,
          values: {
            holidays: [
              {
                date: '2026-01-03',
                name: 'Updated elsewhere',
                kind: 'holiday',
              },
            ],
          },
        },
      }),
    ),
  );
  await screen.findByText('Parameters saved.');
});

it('changes and clears the category from workflow details', async () => {
  let categoryId: string | null = null;
  api.request.mockImplementation(async ({ path, method, json }) => {
    if (path === 'workflows/categories')
      return { data: [{ id: 'finance', title: 'Finance', sortOrder: 0 }] };
    if (method === 'PUT' && path.endsWith('/category')) {
      categoryId = json.categoryId;
      return { data: null };
    }
    if (path.endsWith('/parameters'))
      return {
        data: { kind: 'lifecycle', revision: 0, groups: [], values: {} },
      };
    return {
      data: { ...detail, workflow: { ...detail.workflow, categoryId } },
    };
  });
  await view(
    <Routes>
      <Route
        path='/workflows/definitions/:workflowId'
        element={<DefinitionPage />}
      />
    </Routes>,
    'en-US',
    `/workflows/definitions/${detail.workflow.id}`,
  );
  await userEvent.click(
    await screen.findByRole('button', {
      name: enUS.workflows.changeCategory.replace(
        '{{title}}',
        enUS.workflows.uncategorized,
      ),
    }),
  );
  await userEvent.click(
    await screen.findByRole('menuitemradio', { name: 'Finance' }),
  );
  const assigned = await screen.findByRole('button', {
    name: enUS.workflows.changeCategory.replace('{{title}}', 'Finance'),
  });
  expect(api.request).toHaveBeenCalledWith({
    path: `workflows/definitions/${detail.workflow.id}/category`,
    method: 'PUT',
    json: { categoryId: 'finance' },
  });
  await waitFor(() =>
    expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
  );
  await userEvent.click(assigned);
  await userEvent.click(
    await screen.findByRole('menuitemradio', {
      name: enUS.workflows.uncategorized,
    }),
  );
  await screen.findByRole('button', {
    name: enUS.workflows.changeCategory.replace(
      '{{title}}',
      enUS.workflows.uncategorized,
    ),
  });
  expect(api.request).toHaveBeenCalledWith({
    path: `workflows/definitions/${detail.workflow.id}/category`,
    method: 'PUT',
    json: { categoryId: null },
  });
  await waitFor(() =>
    expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
  );
});

function PeoplePickerFixture() {
  const [value, setValue] = useState(['huangtao']);
  return (
    <OfficePeoplePicker
      label='Clerks'
      value={value}
      update={setValue}
      busy={false}
    />
  );
}
it('searches people without expanding the full cast and preserves selected members', async () => {
  await view(<PeoplePickerFixture />);
  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  const search = screen.getByLabelText('Search people for Clerks');
  await userEvent.type(search, '徐');
  expect(screen.getByText('徐磊')).toBeInTheDocument();
  expect(screen.getByText('信息技术部 · 部门主管')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('checkbox', { name: /徐磊/ }));
  expect(search).toHaveFocus();
  await userEvent.clear(search);
  expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  await userEvent.click(screen.getByRole('checkbox', { name: /黄涛/ }));
  expect(search).toHaveFocus();
  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  await userEvent.type(search, 'missing person');
  expect(screen.getByRole('status')).toHaveTextContent(
    'No additional matching people',
  );
});
it('saves shared members and workflow rules with independent revisions', async () => {
  const configuration: OfficeWorkflowParameters = {
    workflow: 'teamTasks',
    revision: 2,
    values: {
      dispatchRules: {
        departmentNames: [],
        ownDepartmentOnly: true,
        assigneeRole: 'clerks',
        ccHeads: false,
        ccLeaders: false,
      },
    },
    organization: {
      revision: 5,
      legacyOverrides: false,
      departments: [
        { name: 'IT', clerks: ['huangtao'], heads: ['xulei'], leaders: [] },
      ],
    },
  };
  api.request.mockImplementation(async ({ json }) => ({
    data: {
      ...configuration,
      revision: 3,
      values: json.values,
      organization: {
        ...configuration.organization,
        revision: 6,
        departments: json.organization.departments,
      },
    },
  }));
  await view(
    <OfficeParameterEditor
      configuration={configuration}
      path='parameters'
      onBusyChange={() => {}}
      onDirtyChange={() => {}}
    />,
  );
  expect(
    screen.getByRole('checkbox', {
      name: 'Only allow the department of the current task',
    }),
  ).toBeChecked();
  expect(
    screen.getByText('Shared departments and role members').closest('details'),
  ).not.toHaveAttribute('open');
  await userEvent.click(
    screen.getByText('Shared departments and role members'),
  );
  const search = screen.getByLabelText('Search people for Clerks');
  await userEvent.type(search, '徐磊');
  const candidates = screen.getAllByRole('checkbox', { name: /徐磊/ });
  await userEvent.click(candidates[0]!);
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Copy department heads by default' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await screen.findByText('Parameters saved.');
  expect(api.request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      json: expect.objectContaining({
        expectedRevision: 2,
        organization: {
          expectedRevision: 5,
          departments: [
            {
              name: 'IT',
              clerks: ['huangtao', 'xulei'],
              heads: ['xulei'],
              leaders: [],
            },
          ],
        },
        values: {
          dispatchRules: {
            ...configuration.values.dispatchRules,
            ccHeads: true,
          },
        },
      }),
    }),
  );
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Copy leaders by default' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          expectedRevision: 3,
          organization: expect.objectContaining({ expectedRevision: 6 }),
        }),
      }),
    ),
  );
});

function officeDispatchConfiguration(): OfficeWorkflowParameters {
  return {
    workflow: 'teamTasks',
    revision: 0,
    values: {
      dispatchRules: {
        departmentNames: [],
        ownDepartmentOnly: true,
        assigneeRole: 'clerks',
        ccHeads: false,
        ccLeaders: false,
      },
    },
    organization: {
      revision: 0,
      legacyOverrides: false,
      departments: [
        { name: 'IT', clerks: ['huangtao'], heads: [], leaders: [] },
      ],
    },
  };
}
it('focuses the invalid shared department and identifies duplicate names and missing clerks', async () => {
  const configuration = officeDispatchConfiguration();
  configuration.organization!.departments.push({
    name: '',
    clerks: [],
    heads: [],
    leaders: [],
  });
  await view(
    <OfficeParameterEditor
      configuration={configuration}
      path='parameters'
      onBusyChange={() => {}}
      onDirtyChange={() => {}}
    />,
  );
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Copy department heads by default' }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  const name = screen.getAllByLabelText('Name')[1]!;
  expect(name).toHaveFocus();
  expect(name).toHaveAttribute('aria-invalid', 'true');
  await userEvent.type(name, 'IT');
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  expect(
    screen.getAllByText('Use a unique department name of 1–100 characters.'),
  ).toHaveLength(2);
  await userEvent.clear(name);
  await userEvent.type(name, 'HR');
  await userEvent.click(
    screen.getByRole('button', { name: 'Save parameters' }),
  );
  expect(screen.getAllByLabelText('Search people for Clerks')[1]).toHaveFocus();
  expect(
    screen.getByText('Select at least one clerk for this department.'),
  ).toBeInTheDocument();
  expect(api.request).not.toHaveBeenCalled();
});
it('disables shared and workflow controls when the parameter pane is read only', async () => {
  await view(
    <OfficeParameterEditor
      disabled
      configuration={officeDispatchConfiguration()}
      path='parameters'
      onBusyChange={() => {}}
      onDirtyChange={() => {}}
    />,
  );
  const copy = screen.getByRole('checkbox', {
    name: 'Copy department heads by default',
  });
  expect(copy).toHaveAttribute('aria-disabled', 'true');
  await userEvent.click(copy);
  expect(copy).not.toBeChecked();
  await userEvent.click(
    screen.getByText('Shared departments and role members'),
  );
  expect(screen.getByLabelText('Name')).toBeDisabled();
  expect(screen.getByLabelText('Search people for Clerks')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Save parameters' }),
  ).toBeDisabled();
  expect(api.request).not.toHaveBeenCalled();
});

it('carries definition search and activity ordering into detail and restores them on return', async () => {
  api.request.mockImplementation(async ({ path }) => ({
    data: path === 'workflows/categories' ? [] : [detail.workflow],
  }));
  await view(
    <Routes>
      <Route path='/workflows/definitions' element={<DefinitionsPage />}>
        <Route path=':workflowId' element={<BackButton />} />
      </Route>
    </Routes>,
    'en-US',
    '/workflows/definitions?name=expense&activityOrder=desc',
  );
  const workflow = await screen.findByRole('link', {
    name: enUS.workflows.names.expenses,
  });
  expect(workflow.getAttribute('href')).toContain(
    'name=expense&activityOrder=desc',
  );
  await userEvent.click(
    screen.getByRole('button', { name: enUS.workflows.executionActivity }),
  );
  expect(workflow.getAttribute('href')).toContain('activityOrder=asc');
  await userEvent.click(workflow);
  await userEvent.click(screen.getByRole('link', { name: 'Back' }));
  expect(
    (
      await screen.findByRole('link', { name: enUS.workflows.names.expenses })
    ).getAttribute('href'),
  ).toContain('name=expense&activityOrder=asc');
});

it('does not repeat a definition name when localization falls back to that name', async () => {
  api.request.mockImplementation(async ({ path }) => ({
    data:
      path === 'workflows/categories'
        ? []
        : [
            {
              ...detail.workflow,
              id: 'custom.workflow',
              name: 'Custom workflow',
            },
          ],
  }));
  await view(<DefinitionsPage />, 'en-US', '/workflows/definitions');
  expect(
    await screen.findByRole('link', { name: 'Custom workflow' }),
  ).toBeVisible();
  expect(screen.getAllByText('Custom workflow')).toHaveLength(1);
});
