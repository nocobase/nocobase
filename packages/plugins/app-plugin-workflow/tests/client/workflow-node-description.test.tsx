/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { I18nProvider } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowRunResultDialog } from '../../client/workflow-management/inspector.js';
import { workflowApi } from '../../client/workflow-management/data.js';
import {
  NodeDescriptionDialog,
  WorkflowDetailPage,
  WorkflowRunDetailPage,
} from '../../client/workflow-management/pages.js';
import type { WorkflowNodeRunRecord } from '../../client/workflow-management/types.js';
import type { WorkflowNestedDefinition } from '../../client/types.js';
import clientLocales from '../../client/locales/index.js';
import { createWorkflowI18nRuntime } from '../i18n.js';
import { openMenu } from './menu.js';

const i18n = await createWorkflowI18nRuntime(clientLocales);

function renderWithI18n(element: ReactElement): ReturnType<typeof render> {
  return render(<I18nProvider runtime={i18n}>{element}</I18nProvider>);
}

const canvasDefinitions = vi.hoisted(() => [] as WorkflowNestedDefinition[]);

vi.mock('../../client/workflow-management/workflow-canvas.js', async () => {
  const { createElement } = await import('react');
  return {
    WorkflowCanvas: ({
      definition,
      onSelectNode,
      onViewNodeRun,
      nodeRuns = [],
    }: {
      definition: WorkflowNestedDefinition;
      onSelectNode?: (nodeKey: string | null) => void;
      onViewNodeRun?: (run: WorkflowNodeRunRecord) => void;
      nodeRuns?: readonly WorkflowNodeRunRecord[];
    }) => {
      canvasDefinitions.push(definition);
      return createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            onSelectNode?.('notify');
            const latest = nodeRuns
              .filter((run) => run.nodeKey === 'notify')
              .at(-1);
            if (latest) onViewNodeRun?.(latest);
          },
        },
        'Notify owner node',
      );
    },
  };
});

const nodeRun = {
  id: 'node-run-1',
  workflowRunId: 'run-1',
  nodeId: 'node-1',
  nodeKey: 'notify',
  status: 1,
  startedAt: '2026-09-02T08:00:00.000Z',
  finishedAt: '2026-09-02T08:00:01.000Z',
  branchKey: null,
};

function workflow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'workflow-1',
    key: 'notification',
    title: 'Notification workflow',
    description: null,
    enabled: false,
    current: null,
    hasParameters: false,
    executed: 0,
    version: '1.0.0',
    hash: 'workflow-hash',
    inputSchema: {},
    parametersSchema: {},
    parameterValues: {},
    nodes: [
      {
        id: 'node-1',
        key: 'notify',
        title: 'Notify owner',
        description: 'Send the final result to the record owner.',
        type: 'run',
        config: {},
        upstreamKey: null,
        downstreamKey: null,
        branchKey: null,
      },
    ],
    ...overrides,
  };
}

function CurrentLocation() {
  const location = useLocation();
  return (
    <output aria-label='Current location'>
      {location.pathname}
      {location.search}
    </output>
  );
}

describe('workflow node descriptions', () => {
  afterEach(() => {
    cleanup();
    canvasDefinitions.length = 0;
    vi.restoreAllMocks();
  });

  it.each([false, true])(
    'opens node information in execution detail (executed: %s)',
    async (executed) => {
      vi.spyOn(workflowApi, 'run').mockResolvedValue({
        id: 'run-1',
        workflowId: 'workflow-1',
        workflowKey: 'notification',
        eventKey: 'event-1',
        status: 1,
        nodeRuns: executed ? [nodeRun] : [],
      });
      vi.spyOn(workflowApi, 'workflow').mockResolvedValue(workflow());
      const payload = vi.spyOn(workflowApi, 'payload').mockResolvedValue({
        id: nodeRun.id,
        truncated: false,
        result: { delivered: true },
        error: null,
        log: null,
      });
      const attempts = vi
        .spyOn(workflowApi, 'nodeRuns')
        .mockResolvedValue([nodeRun]);
      renderWithI18n(
        <MemoryRouter initialEntries={['/workflow-runs/run-1']}>
          <Routes>
            <Route
              path='/workflow-runs/:id'
              element={<WorkflowRunDetailPage />}
            />
          </Routes>
        </MemoryRouter>,
      );
      fireEvent.click(await screen.findByText('Notify owner node'));
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(
        screen.getByRole('heading', { name: 'Notify owner' }),
      ).toBeDefined();
      expect(
        screen.getByText('Send the final result to the record owner.'),
      ).toBeDefined();
      const disclosure = screen.getByText('Description').closest('details');
      expect(disclosure?.open).toBe(false);
      fireEvent.click(screen.getByText('Description'));
      expect(disclosure?.open).toBe(true);
      if (executed) {
        await waitFor(() =>
          expect(payload).toHaveBeenCalledWith('run-1', 'node-run-1'),
        );
        expect(await screen.findByText(/"delivered": true/)).toBeDefined();
      } else {
        expect(payload).not.toHaveBeenCalled();
        expect(attempts).not.toHaveBeenCalled();
        expect(screen.getByText('Not executed')).toBeDefined();
        expect(screen.getByRole('status').textContent).toBe(
          'This node was not executed in this run, so no result is available.',
        );
        expect(screen.queryByRole('heading', { name: 'Result' })).toBeNull();
        expect(
          within(screen.getByRole('dialog')).queryByText(/Duration/),
        ).toBeNull();
      }
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    },
  );

  it('renders the unexecuted state in Chinese without a description', async () => {
    const runtime = await createWorkflowI18nRuntime(clientLocales, 'zh-CN');
    render(
      <I18nProvider runtime={runtime}>
        <WorkflowRunResultDialog
          runId='run-1'
          nodeRun={null}
          nodeTitle='Notify owner'
          onClose={() => {}}
        />
      </I18nProvider>,
    );
    expect(screen.getByText('未执行')).toBeDefined();
    expect(screen.getByRole('status').textContent).toBe(
      '本次执行未运行此节点，因此没有执行结果。',
    );
    const disclosure = screen.getByText('描述').closest('details');
    expect(disclosure?.open).toBe(false);
    fireEvent.click(screen.getByText('描述'));
    expect(disclosure?.open).toBe(true);
    expect(screen.getByText('暂无节点描述。')).toBeDefined();
    fireEvent.click(screen.getByText('描述'));
    expect(disclosure?.open).toBe(false);
  });

  it('keeps the canvas definition stable when the description dialog closes', async () => {
    vi.spyOn(workflowApi, 'workflow').mockResolvedValue(
      workflow({ enabled: true, current: true }),
    );
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([
      workflow({ enabled: true, current: true }),
    ]);

    renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/workflow-1']}>
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByText('Notify owner node'));
    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    expect(canvasDefinitions.length).toBeGreaterThan(1);
    expect(new Set(canvasDefinitions).size).toBe(1);
  });

  it('expands the canvas, exits with Escape, and restores scrolling on unmount', async () => {
    vi.spyOn(workflowApi, 'workflow').mockResolvedValue(workflow());
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([workflow()]);
    const { unmount } = renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/workflow-1']}>
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const button = await screen.findByRole('button', {
      name: 'Enter fullscreen',
    });
    const card = button.closest('section');
    const previousOverflow = document.body.style.overflow;
    fireEvent.click(button);
    expect(card?.classList.contains('workflow-canvas-fullscreen')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(card?.classList.contains('workflow-canvas-fullscreen')).toBe(false);
    expect(document.body.style.overflow).toBe(previousOverflow);
    fireEvent.click(button);
    unmount();
    expect(document.body.style.overflow).toBe(previousOverflow);
  });

  it('enables a historical version with the same switch as the current version', async () => {
    vi.spyOn(workflowApi, 'workflow').mockResolvedValue(
      workflow({ current: false }),
    );
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([
      workflow({ current: false }),
      workflow({
        id: 'workflow-2',
        version: '2.0.0',
        current: true,
        enabled: true,
      }),
    ]);
    const enable = vi
      .spyOn(workflowApi, 'enable')
      .mockResolvedValue(workflow({ enabled: true, current: true }));
    renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/workflow-1']}>
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(
      await screen.findByRole('switch', {
        name: 'Enable Notification workflow',
      }),
    );
    await waitFor(() => expect(enable).toHaveBeenCalledWith('workflow-1'));
    expect(
      screen.queryByRole('button', { name: 'Enable this version' }),
    ).toBeNull();
  });

  it('reloads the current workflow after changing its enabled status', async () => {
    const getWorkflow = vi
      .spyOn(workflowApi, 'workflow')
      .mockResolvedValueOnce(workflow())
      .mockResolvedValueOnce(workflow({ enabled: true, current: true }));
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([workflow()]);
    vi.spyOn(workflowApi, 'enable').mockResolvedValue(
      workflow({ enabled: true, current: true }),
    );

    renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/workflow-1']}>
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole('switch', {
        name: 'Enable Notification workflow',
      }),
    );

    await waitFor(() => expect(getWorkflow).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole('switch', {
        name: 'Disable Notification workflow',
      }),
    ).toBeDefined();
  });

  it('opens the returned workflow id after its first enable', async () => {
    vi.spyOn(workflowApi, 'workflow').mockImplementation(async (id) =>
      workflow({
        id: id === 'workflow-hash' ? null : id,
        enabled: id !== 'workflow-hash',
        current: id !== 'workflow-hash' ? true : null,
      }),
    );
    vi.spyOn(workflowApi, 'revisions').mockImplementation(async (id) => [
      workflow({
        id: id === 'workflow-hash' ? null : id,
        enabled: id !== 'workflow-hash',
        current: id !== 'workflow-hash' ? true : null,
      }),
    ]);
    vi.spyOn(workflowApi, 'enable').mockResolvedValue(
      workflow({ id: 'workflow-42', enabled: true, current: true }),
    );

    renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/workflow-hash']}>
        <CurrentLocation />
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole('switch', {
        name: 'Enable Notification workflow',
      }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Current location').textContent).toBe(
        '/settings/workflow/workflows/workflow-42',
      ),
    );
  });

  it('opens the execution canvas after a manual run', async () => {
    vi.spyOn(workflowApi, 'workflow').mockResolvedValue(
      workflow({ enabled: true, current: true }),
    );
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([
      workflow({ enabled: true, current: true }),
    ]);
    vi.spyOn(workflowApi, 'execute').mockResolvedValue({
      id: 'run-42',
      workflowId: 'workflow-1',
      workflowKey: 'notification',
      eventKey: 'manual-event',
      status: null,
      createdAt: '2026-09-02T08:00:00.000Z',
    });

    renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/workflow-1']}>
        <CurrentLocation />
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await openMenu('More actions');
    fireEvent.click(await screen.findByText('Run manually'));

    await waitFor(() =>
      expect(screen.getByLabelText('Current location').textContent).toBe(
        '/settings/workflow/runs/run-42',
      ),
    );
  });

  it.each([
    '/settings/workflow/runs?status=failed',
    '/settings/workflow/workflows/workflow-1',
  ])(
    'returns from execution detail to its history entry %s',
    async (origin) => {
      vi.spyOn(workflowApi, 'run').mockResolvedValue({
        id: 'run-42',
        workflowId: 'workflow-1',
        workflowKey: 'notification',
        workflowTitle: 'Notification workflow',
        eventKey: 'event-42',
        status: 1,
        createdAt: '2026-09-02T08:00:00.000Z',
      });
      vi.spyOn(workflowApi, 'workflow').mockResolvedValue(
        workflow({ enabled: true, current: true }),
      );

      renderWithI18n(
        <MemoryRouter
          initialEntries={[origin, '/workflow-runs/run-42']}
          initialIndex={1}
        >
          <CurrentLocation />
          <Routes>
            <Route
              path='/workflow-runs/:id'
              element={<WorkflowRunDetailPage />}
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(
        (
          await screen.findByRole('link', { name: 'Notification workflow' })
        ).getAttribute('href'),
      ).toBe('/settings/workflow/workflows/workflow-1');
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      await waitFor(() =>
        expect(screen.getByLabelText('Current location').textContent).toBe(
          origin,
        ),
      );
    },
  );

  it('offers the candidate revision in the version picker without enabling it', async () => {
    const running = workflow({
      id: 'workflow-1',
      enabled: true,
      current: true,
      version: 'version-1',
      pendingArtifact: { hash: 'candidate-hash', title: 'Notification v2' },
    });
    const candidate = workflow({
      id: null,
      enabled: false,
      current: null,
      version: null,
      hash: 'candidate-hash',
    });
    vi.spyOn(workflowApi, 'workflow').mockImplementation(async (id) =>
      id === 'candidate-hash' ? candidate : running,
    );
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([candidate, running]);
    const enable = vi
      .spyOn(workflowApi, 'enable')
      .mockResolvedValue(workflow({ id: 'workflow-42' }));

    renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/workflow-1']}>
        <CurrentLocation />
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await openMenu('Version');
    await waitFor(() =>
      expect(
        screen
          .getAllByRole('menuitem')
          .filter(
            (item) =>
              !item.classList.contains('workflow-version-compare-action'),
          )
          .map((option) => option.textContent),
      ).toEqual(['Unpublished', '>version-1']),
    );

    fireEvent.click(
      screen.getByRole('link', { name: 'New version available' }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Current location').textContent).toBe(
        '/settings/workflow/workflows/candidate-hash',
      ),
    );
    expect(enable).not.toHaveBeenCalled();
  });

  it('enables the candidate revision from its own page', async () => {
    const running = workflow({
      id: 'workflow-1',
      enabled: true,
      current: true,
    });
    const candidate = workflow({
      id: null,
      enabled: false,
      current: null,
      version: null,
      hash: 'candidate-hash',
    });
    vi.spyOn(workflowApi, 'workflow').mockResolvedValue(candidate);
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([candidate, running]);
    const enable = vi
      .spyOn(workflowApi, 'enable')
      .mockResolvedValue(workflow({ id: 'workflow-42' }));

    renderWithI18n(
      <MemoryRouter initialEntries={['/workflows/candidate-hash']}>
        <CurrentLocation />
        <Routes>
          <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Unpublished')).toBeDefined();
    expect(screen.queryByText('Not the running version')).toBeNull();
    expect(
      await screen.findByRole('switch', {
        name: 'Enable Notification workflow',
      }),
    ).toBeDefined();

    fireEvent.click(
      await screen.findByRole('switch', {
        name: 'Enable Notification workflow',
      }),
    );

    expect(enable).toHaveBeenCalledWith('candidate-hash');
    await waitFor(() =>
      expect(screen.getByLabelText('Current location').textContent).toBe(
        '/settings/workflow/workflows/workflow-42',
      ),
    );
  });

  it('shows the selected canvas node description in a dialog', () => {
    renderWithI18n(
      <NodeDescriptionDialog
        title='Notify owner'
        description='Send the final result to the record owner.'
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Notify owner' })).toBeDefined();
    expect(
      screen.getByText('Send the final result to the record owner.'),
    ).toBeDefined();
  });

  it('keeps the execution node description collapsed until requested', () => {
    vi.spyOn(workflowApi, 'nodeRuns').mockReturnValue(new Promise(() => {}));
    vi.spyOn(workflowApi, 'payload').mockReturnValue(new Promise(() => {}));

    renderWithI18n(
      <WorkflowRunResultDialog
        runId='run-1'
        nodeRun={nodeRun}
        nodeTitle='Notify owner'
        nodeDescription='Send the final result to the record owner.'
        onClose={() => {}}
      />,
    );

    const disclosure = screen
      .getByText('Description')
      .closest<HTMLDetailsElement>('details');
    expect(disclosure?.open).toBe(false);

    fireEvent.click(screen.getByText('Description'));
    expect(disclosure?.open).toBe(true);
    expect(
      screen.getByText('Send the final result to the record owner.'),
    ).toBeDefined();
  });
});
