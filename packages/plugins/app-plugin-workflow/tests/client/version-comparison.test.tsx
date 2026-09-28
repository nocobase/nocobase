/** @vitest-environment jsdom */
import { MemoryRouter, Route, Routes } from 'react-router';
import { WorkflowDetailPage } from '../../client/workflow-management/pages.js';
import { workflowApi } from '../../client/workflow-management/data.js';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { I18nProvider } from '@nocobase/i18n/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowComparisonDialog } from '../../client/workflow-management/version-comparison.js';
import type { WorkflowCanvasProps } from '../../client/workflow-management/types.js';
import clientLocales from '../../client/locales/index.js';
import { createWorkflowI18nRuntime } from '../i18n.js';
import { openMenu } from './menu.js';
import { node, version } from './version-fixtures.js';
vi.mock('../../client/workflow-management/workflow-canvas.js', () => ({
  WorkflowCanvas: (props: WorkflowCanvasProps) => (
    <button
      onClick={() => props.onSelectNode?.('task')}
      data-selected={props.selectedNodeKey}
    >
      Canvas node
    </button>
  ),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const old = version();
const latest = version({
  id: 'new',
  hash: 'new-hash',
  version: null,
  nodes: [
    node('task', { config: { limit: 3 } }),
    node('extra', { upstreamKey: 'task' }),
  ],
});
describe('version comparison interaction', () => {
  it('shows candidate definitions, selects corresponding nodes, swaps sides, and allows identical versions', async () => {
    const runtime = await createWorkflowI18nRuntime(clientLocales);
    render(
      <I18nProvider runtime={runtime}>
        <WorkflowComparisonDialog
          workflow={latest}
          revisions={[latest, old]}
          onClose={() => {}}
        />
      </I18nProvider>,
    );
    expect(
      screen.getByRole('combobox', { name: 'Target version' }).textContent,
    ).toContain('Unpublished');
    fireEvent.click(screen.getAllByText('Canvas node')[0]);
    expect(
      screen
        .getAllByText('Canvas node')
        .map((item) => item.getAttribute('data-selected')),
    ).toEqual(['task', 'task']);
    expect(screen.getAllByText('/config/limit')).toHaveLength(2);
    const details = screen.getByRole('region', { name: 'Change details' });
    expect(within(details).getByText('3')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Added extra/ }));
    expect(within(details).getAllByRole('table')).toHaveLength(1);
    expect(within(details).getAllByRole('columnheader')).toHaveLength(2);
    expect(
      screen.getByText('This node does not exist in this version'),
    ).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Swap versions' }));
    expect(screen.getByRole('button', { name: /Removed extra/ })).toBeDefined();
    fireEvent.click(screen.getByRole('combobox', { name: 'Baseline version' }));
    const option = await screen.findByRole('option', { name: 'v1 · old-hash' });
    fireEvent.mouseMove(option);
    fireEvent.mouseDown(option);
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      'No definition changes',
    );
  });
  it('renders the Chinese comparison labels', async () => {
    const runtime = await createWorkflowI18nRuntime(clientLocales, 'zh-CN');
    render(
      <I18nProvider runtime={runtime}>
        <WorkflowComparisonDialog
          workflow={latest}
          revisions={[latest, old]}
          onClose={() => {}}
        />
      </I18nProvider>,
    );
    expect(
      screen.getByRole('heading', { name: '版本对比 · Flow' }),
    ).toBeDefined();
    expect(screen.getByRole('combobox', { name: '基准版本' })).toBeDefined();
    expect(screen.getByRole('button', { name: '交换版本' })).toBeDefined();
  });
});

describe('version comparison entry', () => {
  it('opens from the workflow detail without changing the active version', async () => {
    const runtime = await createWorkflowI18nRuntime(clientLocales);
    vi.spyOn(workflowApi, 'workflow').mockResolvedValue(latest);
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([latest, old]);
    const enable = vi.spyOn(workflowApi, 'enable');
    render(
      <I18nProvider runtime={runtime}>
        <MemoryRouter initialEntries={['/workflows/new']}>
          <Routes>
            <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
    await openMenu('Version');
    expect(
      screen.queryByRole('button', { name: 'Compare versions' }),
    ).toBeNull();
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Compare with v1' }),
    );
    expect(await screen.findByRole('dialog')).toBeDefined();
    expect(
      screen.getByRole('combobox', { name: 'Baseline version' }).textContent,
    ).toContain('Unpublished');
    expect(
      screen.getByRole('combobox', { name: 'Target version' }).textContent,
    ).toContain('v1');
    expect(enable).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('omits comparison for the displayed revision', async () => {
    const runtime = await createWorkflowI18nRuntime(clientLocales);
    vi.spyOn(workflowApi, 'workflow').mockResolvedValue(old);
    vi.spyOn(workflowApi, 'revisions').mockResolvedValue([old]);
    render(
      <I18nProvider runtime={runtime}>
        <MemoryRouter initialEntries={['/workflows/old']}>
          <Routes>
            <Route path='/workflows/:id' element={<WorkflowDetailPage />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
    await openMenu('Version');
    expect(await screen.findByRole('menuitem', { name: 'v1' })).toBeDefined();
    expect(screen.queryByRole('menuitem', { name: /Compare with/ })).toBeNull();
  });
});
