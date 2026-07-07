/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { get } from 'lodash';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultWorkflowFilter } from '../../../common/defaultWorkflowFilter';

// --- Mock the FlowContext so `useFlowContext()` returns our controlled ctx ---
const holder = vi.hoisted(() => ({ ctx: null as any }));
const providerHolder = vi.hoisted(() => ({
  collections: null as any,
  workflowTabsClassName: null as string | null,
  collectionFilterProps: null as any,
}));
vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useFlowContext: () => holder.ctx };
});

// --- Mock plugin's locale so translation is identity (no i18next runtime) ---
vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
  useWorkflowTranslation: () => ({ t: (key: string) => key }),
  tExpr: (key: string) => key,
}));

// --- Mock the client-v2 layout primitives with lightweight test doubles ---
vi.mock('@nocobase/client-v2', () => ({
  DEFAULT_PAGE_SIZE: 20,
  getRouteRuntimeVersion: () => 'modern',
  FormSubmitActionModel: {
    registerFlow: vi.fn(),
  },
  Plugin: class Plugin {},
  SortableCategoryTabs: () => null,
  CollectionFilter: (props: any) => {
    providerHolder.collectionFilterProps = props;
    return null;
  },
  UpdateRecordActionModel: {
    registerFlow: vi.fn(),
  },
  ExtendCollectionsProvider: ({ children, collections }: any) => {
    providerHolder.collections = collections;
    return <>{children}</>;
  },
  DrawerFormLayout: ({ children, onSubmit }: any) => (
    <div>
      {children}
      <button type="button" data-testid="layout-submit" onClick={() => onSubmit()}>
        layout-submit
      </button>
    </div>
  ),
  DialogFormLayout: ({ children, onSubmit }: any) => (
    <div>
      {children}
      <button type="button" data-testid="layout-submit" onClick={() => onSubmit()}>
        layout-submit
      </button>
    </div>
  ),
  Table: ({ dataSource = [], columns = [], tableLayout }: any) => (
    <table style={{ tableLayout }}>
      <tbody>
        {dataSource.map((record: any) => (
          <tr key={record.id}>
            {columns.map((col: any, index: number) => {
              const cellProps = col.onCell?.(record) ?? {};
              return (
                <td key={index} style={{ width: col.width, ...cellProps.style }}>
                  {typeof col.render === 'function'
                    ? col.render(col.dataIndex ? get(record, col.dataIndex) : undefined, record)
                    : col.dataIndex
                      ? get(record, col.dataIndex)
                      : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock('../WorkflowCategoryTabs', () => ({
  ALL_CATEGORY_KEY: 'all',
  WorkflowCategoryTabs: ({ className }: any) => {
    providerHolder.workflowTabsClassName = className ?? null;
    return <div data-testid="workflow-category-tabs" />;
  },
}));

import { WorkflowFormDrawer } from '../WorkflowFormDrawer';
import WorkflowPane from '../WorkflowPane';

const mockPlugin = {
  triggers: { getEntities: () => [['collection', { title: 'Collection event' }]] },
  getTriggerOptions: (type?: string) => (type === 'collection' ? { title: 'Collection event' } : undefined),
  getWorkflowNotices: vi.fn(() => []),
  loadWorkflowListNotices: vi.fn(() => Promise.resolve({})),
};

function makeCtx(resourceMap: Record<string, any>) {
  return {
    api: { resource: (name: string) => resourceMap[name] },
    viewer: { drawer: vi.fn(), dialog: vi.fn() },
    app: { name: 'main', pm: { get: () => mockPlugin } },
  };
}

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
}

describe('WorkflowPane (request layer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlugin.getWorkflowNotices.mockReturnValue([]);
    mockPlugin.loadWorkflowListNotices.mockResolvedValue({});
    providerHolder.collections = null;
    providerHolder.workflowTabsClassName = null;
    providerHolder.collectionFilterProps = null;
  });

  it('fires resource.create on submit in create mode', async () => {
    const workflows = { create: vi.fn().mockResolvedValue({}), update: vi.fn() };
    holder.ctx = makeCtx({ workflows });

    renderWithApp(
      <WorkflowFormDrawer
        mode="create"
        type="collection"
        plugin={mockPlugin as any}
        categoryOptions={[]}
        onSubmitted={() => undefined}
      />,
    );

    const title = screen.getAllByRole('textbox')[0];
    fireEvent.change(title, { target: { value: 'My workflow' } });
    fireEvent.click(screen.getByTestId('layout-submit'));

    await waitFor(() => {
      expect(workflows.create).toHaveBeenCalledTimes(1);
    });
    expect(workflows.create).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ title: 'My workflow', type: 'collection' }),
      }),
    );
  });

  it('fires resource.update with the correct filterByTk on submit in edit mode', async () => {
    const workflows = { create: vi.fn(), update: vi.fn().mockResolvedValue({}) };
    holder.ctx = makeCtx({ workflows });

    renderWithApp(
      <WorkflowFormDrawer
        mode="edit"
        plugin={mockPlugin as any}
        record={{ id: 7, title: 'Existing', type: 'collection', sync: false, categories: [], options: {} }}
        categoryOptions={[]}
        onSubmitted={() => undefined}
      />,
    );

    fireEvent.click(screen.getByTestId('layout-submit'));

    await waitFor(() => {
      expect(workflows.update).toHaveBeenCalledTimes(1);
    });
    // Pin filterByTk to the record id so a regression never silently no-ops.
    expect(workflows.update).toHaveBeenCalledWith(
      expect.objectContaining({ filterByTk: 7, values: expect.objectContaining({ title: 'Existing' }) }),
    );
  });

  it('fires resource.destroy on row-level delete', async () => {
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              id: 9,
              title: 'Row',
              type: 'collection',
              sync: false,
              enabled: false,
              categories: [],
              stats: { executed: 0 },
            },
          ],
          meta: { count: 1 },
        },
      }),
      destroy: vi.fn().mockResolvedValue({}),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    renderWithApp(<WorkflowPane />);

    await screen.findByText('Row');

    const rowDelete = screen.getAllByText('Delete').find((el) => el.tagName === 'A');
    expect(rowDelete).toBeTruthy();
    fireEvent.click(rowDelete as HTMLElement);

    const okButton = await screen.findByText('OK');
    fireEvent.click(okButton.closest('button') as HTMLButtonElement);

    await waitFor(() => {
      expect(workflows.destroy).toHaveBeenCalledWith({ filterByTk: 9 });
    });
  });

  it('edit drawer survives a v1-style (title-less) trigger registration', async () => {
    // Regression: a downstream plugin registers via the v1 signature `registerTrigger(type, TriggerClass)`, so the v2
    // registry holds an entry whose `title` is undefined. The trigger-options sort must not crash on
    // `undefined.localeCompare`.
    class LegacyTrigger {}
    const pluginWithLegacy = {
      triggers: {
        getEntities: () => [
          ['collection', { title: 'Collection event' }],
          ['custom-action', LegacyTrigger],
        ],
      },
      getTriggerOptions: (type?: string) =>
        type === 'collection' ? { title: 'Collection event' } : type === 'custom-action' ? LegacyTrigger : undefined,
    };
    const workflows = { create: vi.fn(), update: vi.fn().mockResolvedValue({}) };
    holder.ctx = makeCtx({ workflows });

    renderWithApp(
      <WorkflowFormDrawer
        mode="edit"
        plugin={pluginWithLegacy as any}
        record={{ id: 11, title: 'Legacy', type: 'custom-action', sync: false, categories: [], options: {} }}
        categoryOptions={[]}
        onSubmitted={() => undefined}
      />,
    );

    fireEvent.click(screen.getByTestId('layout-submit'));

    await waitFor(() => {
      expect(workflows.update).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 11 }));
    });
  });

  it('renders the trigger configuration label and bordered group around preset loader content', async () => {
    const workflows = { create: vi.fn().mockResolvedValue({}), update: vi.fn() };
    holder.ctx = makeCtx({ workflows });

    const pluginWithPreset = {
      triggers: { getEntities: () => [['collection', { title: 'Collection event' }]] },
      getTriggerOptions: (type?: string) =>
        type === 'collection'
          ? {
              title: 'Collection event',
              PresetFieldsetLoader: async () => ({
                default: () => <div>preset-field</div>,
              }),
            }
          : undefined,
    };

    renderWithApp(
      <WorkflowFormDrawer
        mode="create"
        type="collection"
        plugin={pluginWithPreset as any}
        categoryOptions={[]}
        onSubmitted={() => undefined}
      />,
    );

    const label = await screen.findByText('Trigger configuration:');
    expect(label).toBeInTheDocument();
    expect(label).toHaveStyle({ fontWeight: '600' });
    expect(await screen.findByText('preset-field')).toBeInTheDocument();
  });

  it('injects the client-only workflows collection as hidden so it does not leak into visible collection pickers', async () => {
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [],
          meta: { count: 0 },
        },
      }),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    renderWithApp(<WorkflowPane />);

    await waitFor(() => {
      expect(providerHolder.collections).toBeTruthy();
    });

    expect(providerHolder.collections).toHaveLength(1);
    expect(providerHolder.collections[0]).toMatchObject({
      name: 'workflows',
      hidden: true,
    });
  });

  it('passes a dedicated tabs container class to WorkflowCategoryTabs so the page can match the legacy top strip layout', async () => {
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [],
          meta: { count: 0 },
        },
      }),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    renderWithApp(<WorkflowPane />);

    await waitFor(() => {
      expect(screen.getByTestId('workflow-category-tabs')).toBeInTheDocument();
    });

    expect(providerHolder.workflowTabsClassName).toBeTruthy();
  });

  it('passes the shared default filter to CollectionFilter so reset restores name + trigger type rows', async () => {
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [],
          meta: { count: 0 },
        },
      }),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    renderWithApp(<WorkflowPane />);

    await waitFor(() => {
      expect(providerHolder.collectionFilterProps).toBeTruthy();
    });

    expect(providerHolder.collectionFilterProps.defaultValue).toEqual(defaultWorkflowFilter);
  });

  it('keeps the workflow list request lightweight while list notices load separately', async () => {
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [],
          meta: { count: 0 },
        },
      }),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    renderWithApp(<WorkflowPane />);

    await waitFor(() => {
      expect(workflows.list).toHaveBeenCalledTimes(1);
    });

    expect(workflows.list).toHaveBeenCalledWith(
      expect.objectContaining({
        appends: ['categories', 'stats'],
        except: ['config'],
      }),
    );
    expect(workflows.list.mock.calls[0][0].appends).not.toContain('nodes');
  });

  it('renders synchronous workflow row notices returned by the workflow plugin', async () => {
    const title = 'a1 长标题长标题长标题长标题长标题长标题长标题长标题长标题长标题长标题长标题';
    mockPlugin.getWorkflowNotices.mockReturnValue([
      {
        key: 'legacy-ui',
        message: 'Approval interface needs reconfiguration',
        description:
          'This workflow contains approval interfaces created in an earlier version. Reconfigure the approval interfaces before using this workflow.',
      },
    ]);
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              id: 9,
              title,
              type: 'approval',
              sync: false,
              enabled: false,
              categories: [],
              stats: { executed: 0 },
            },
          ],
          meta: { count: 1 },
        },
      }),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    const { container } = renderWithApp(<WorkflowPane />);

    const titleElement = await screen.findByText(title);
    expect(container.querySelector('table')).toHaveStyle({ tableLayout: 'fixed' });
    expect(titleElement.closest('td')).toHaveStyle({
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      width: '520px',
    });
    expect(await screen.findByText('Approval interface needs reconfiguration')).toBeInTheDocument();
    expect(mockPlugin.getWorkflowNotices).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: 'workflow-list-row',
        workflow: expect.objectContaining({ id: 9 }),
      }),
    );
  });

  it('renders asynchronously loaded workflow list notices for the current page', async () => {
    mockPlugin.loadWorkflowListNotices.mockResolvedValue({
      9: [
        {
          key: 'legacy-ui',
          message: 'Approval interface needs reconfiguration',
          description:
            'This workflow contains approval interfaces created in an earlier version. Reconfigure the approval interfaces before using this workflow.',
          type: 'warning',
        },
      ],
    });
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              id: 9,
              title: 'Row',
              type: 'approval',
              sync: false,
              enabled: false,
              categories: [],
              stats: { executed: 0 },
            },
          ],
          meta: { count: 1 },
        },
      }),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    renderWithApp(<WorkflowPane />);

    expect(await screen.findByText('Approval interface needs reconfiguration')).toBeInTheDocument();
    expect(mockPlugin.loadWorkflowListNotices).toHaveBeenCalledWith(
      expect.objectContaining({
        api: holder.ctx.api,
        surface: 'workflow-list-row',
        workflows: [expect.objectContaining({ id: 9, type: 'approval' })],
      }),
    );
    expect(workflows.list).toHaveBeenCalledWith(
      expect.objectContaining({
        appends: ['categories', 'stats'],
        except: ['config'],
      }),
    );
  });

  it('maps info workflow row notices to an Ant Design supported tag color', async () => {
    mockPlugin.loadWorkflowListNotices.mockResolvedValue({
      9: [
        {
          key: 'info-ui',
          message: 'Info notice',
          description: 'This notice is informational.',
          type: 'info',
        },
      ],
    });
    const workflows = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              id: 9,
              title: 'Row',
              type: 'approval',
              sync: false,
              enabled: false,
              categories: [],
              stats: { executed: 0 },
            },
          ],
          meta: { count: 1 },
        },
      }),
    };
    const workflowCategories = { list: vi.fn().mockResolvedValue({ data: { data: [] } }) };
    holder.ctx = makeCtx({ workflows, workflowCategories });

    const { container } = renderWithApp(<WorkflowPane />);

    const notice = await screen.findByText('Info notice');
    expect(notice.closest('.ant-tag')).toHaveClass('ant-tag-blue');
    expect(container.querySelector('.anticon-info-circle')).toBeInTheDocument();
  });
});
