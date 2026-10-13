import {
  useParameterBindingEditor,
  lifecycleLocales,
} from '@nocobase/app-plugin-lifecycle-example/client';
import {
  expenseLifecycle,
  reviewerDemoLifecycle,
} from '@nocobase/app-plugin-lifecycle-example/server';
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
import { MemoryRouter, useLocation } from 'react-router';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import DefinitionsPage from '../../client/pages/workflows/definitions.js';
import ExecutionsPage from '../../client/pages/workflows/executions.js';
import { ExecutionDiagram } from '../../client/pages/workflows/execution.js';
import { DataState } from '../../client/pages/workflows/shared.js';
import type { WorkflowExecutionDetail } from '../../shared/workflows.js';

const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
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
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
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
      <button onClick={() => binding.onBinding('state', 'awaitingManager')}>
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
  { id: '2', transition: 'submit', from: 'draft', to: 'review' },
  { id: '3', transition: 'withdraw', from: 'review', to: 'draft' },
  { id: '4', transition: 'submit', from: 'draft', to: 'review' },
].map((entry, index) => ({
  ...entry,
  lifecycle: 'reviewerDemo',
  recordId: '1',
  actorId: 'lin',
  input: {},
  at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
  version: index,
  requestId: null,
}));
const detail: WorkflowExecutionDetail = {
  workflow: {
    id: 'lifecycle.reviewerDemo',
    name: 'reviewerDemo',
    source: 'lifecycle',
    states: 4,
    transitions: 4,
  },
  description: describeLifecycle(reviewerDemoLifecycle),
  parameters: {},
  diagram: '',
  view: {
    record: { id: '1', status: 'review' },
    state: 'review',
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
      const review = screen.getByTestId('rf__node-review');
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
      fireEvent.click(screen.getByRole('button', { name: copy.latest }));
      expect(
        review.querySelector('[data-execution-state="current"]'),
      ).not.toBeNull();
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
                state: 'review',
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
      '/workflows/executions?workflowId=lifecycle.reviewerDemo&page=5',
    );
    expect(await screen.findByRole('link', { name: '#42' })).toHaveAttribute(
      'href',
      '/workflows/executions/lifecycle.reviewerDemo/42?workflowId=lifecycle.reviewerDemo&page=5',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith({
        path: 'workflows/executions',
        query: {
          page: '6',
          pageSize: '20',
          workflowId: 'lifecycle.reviewerDemo',
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
        autoApproveLimit: { type: 'number', title: 'Automatic approval limit' },
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
  api.request.mockResolvedValueOnce({
    data: [
      {
        id: 'lifecycle.expenses',
        name: 'expenses',
        source: 'lifecycle',
        states: 4,
        transitions: 5,
      },
    ],
  });
  await view(<DefinitionsPage />);
  const link = await screen.findByRole('link', { name: 'Expense approval' });
  let finish: ((value: unknown) => void) | undefined;
  api.request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(link).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  expect(screen.getByRole('status')).toBeInTheDocument();
  finish?.({ data: [] });
  await screen.findByText('No workflow definitions.');
});
