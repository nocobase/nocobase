/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp } from 'antd';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MultiPortalsPage, {
  createMultiPortal,
  type MultiPortalFormValues,
  type MultiPortalResource,
} from '../pages/MultiPortalsPage';
import { getMultiPortalRouteUrl } from '../routeUrl';
import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';

const flowContext = vi.hoisted(() => ({
  app: {
    apiClient: {
      request: vi.fn().mockResolvedValue({ data: { data: { apps: [], portals: [] } } }),
    },
    entryActionManager: {
      invalidate: vi.fn(),
    },
  },
  current: undefined as
    | {
        api: {
          request: ReturnType<typeof vi.fn>;
          resource: ReturnType<typeof vi.fn>;
        };
        viewer: {
          drawer: ReturnType<typeof vi.fn>;
        };
      }
    | undefined,
}));

type IconPickerTestProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  onChange?: (value: string | null) => void;
  value?: string | null;
};

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    randomId: () => 'random-id',
    useFlowEngine: () => ({
      context: {
        t: (key: string) => key,
      },
    }),
    useFlowContext: () => ({
      app: flowContext.app,
      ...flowContext.current,
    }),
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');
  type IconFieldTestProps = IconPickerTestProps & {
    ref?: React.Ref<HTMLInputElement>;
  };
  const IconField = (props: IconPickerTestProps) =>
    ReactModule.createElement('input', {
      ...props,
      value: props.value ?? '',
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        props.onChange?.(event.target.value || null);
      },
    });
  const IconPicker = ReactModule.forwardRef<HTMLInputElement, IconPickerTestProps>((props, ref) =>
    ReactModule.createElement(IconField as React.ComponentType<IconFieldTestProps>, {
      ...props,
      ref,
    }),
  );
  IconPicker.displayName = 'IconPicker';
  return {
    ...actual,
    DrawerFormLayout: (props: {
      children: React.ReactNode;
      title: string;
      onSubmit: () => Promise<void> | void;
      submitText: string;
    }) =>
      ReactModule.createElement(
        'div',
        { role: 'dialog', 'aria-label': props.title },
        props.children,
        ReactModule.createElement(
          'button',
          {
            type: 'button',
            onClick: async () => {
              try {
                await props.onSubmit();
              } catch {
                // Keep the test drawer mounted after form validation rejects.
              }
            },
          },
          props.submitText,
        ),
      ),
    IconPicker,
  };
});

const portalValues: MultiPortalFormValues = {
  title: 'Customer portal',
  uid: 'customer-portal',
  portalType: 'no-code',
  portalName: 'customer-portal',
  routePath: '/customer-portal',
  uiLayoutUid: 'mobile-layout-model',
  enabled: true,
};

type UiLayoutTestRecord = {
  layoutType?: string;
  title?: string;
  uid: string;
};

const defaultUiLayoutOptions: UiLayoutTestRecord[] = [
  {
    uid: 'mobile-layout-model',
    title: 'Mobile layout',
  },
];

function makeResource(overrides: Partial<MultiPortalResource> = {}): MultiPortalResource {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    }),
    ...overrides,
  };
}

async function openCreatePortalForm(resource = makeResource(), uiLayouts = defaultUiLayoutOptions) {
  const user = userEvent.setup();
  let drawerContent: React.ReactNode;
  flowContext.current = {
    api: {
      request: vi.fn().mockResolvedValue({
        data: {
          data: uiLayouts,
        },
      }),
      resource: vi.fn((name: string) => {
        if (name === 'multiPortals') {
          return resource;
        }
        throw new Error(`Unexpected resource ${name}`);
      }),
    },
    viewer: {
      drawer: vi.fn((options: { content: () => React.ReactNode }) => {
        drawerContent = options.content();
      }),
    },
  };

  const { container, rerender } = render(
    <AntdApp>
      <MultiPortalsPage />
      {drawerContent}
    </AntdApp>,
  );

  await user.click(await screen.findByRole('button', { name: /Add portal/ }));
  rerender(
    <AntdApp>
      <MultiPortalsPage />
      {drawerContent}
    </AntdApp>,
  );

  return {
    container,
    dialog: await screen.findByRole('dialog', { name: 'Add portal' }),
    resource,
    user,
  };
}

async function selectMobileLayout(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
  await user.click(await screen.findByText('Mobile layout'));
}

afterEach(() => {
  cleanup();
  flowContext.current = undefined;
  window.__nocobase_modern_client_prefix__ = undefined;
});

describe('plugin-multi-portal settings page', () => {
  it('should build portal hrefs with router basename without duplicating it', () => {
    const app = {
      router: {
        getBasename: () => '/nocobase/v',
      },
      getRouteUrl: (pathname: string) => `/nocobase/v${pathname}`,
      getPublicPath: () => '/nocobase/v/',
    };

    expect(getMultiPortalRouteUrl(app, '/customer-portal')).toBe('/nocobase/v/customer-portal');
    expect(getMultiPortalRouteUrl(app, '/customer-portal', 'no-code')).toBe('/nocobase/v/customer-portal');
    expect(getMultiPortalRouteUrl(app, '/customer-portal', 'ai')).toBe('/nocobase/x/customer-portal');
    expect(getMultiPortalRouteUrl(app, '/nocobase/v/customer-portal')).toBe('/nocobase/v/customer-portal');
    expect(getMultiPortalRouteUrl(app, '/nocobase/x/customer-portal', 'ai')).toBe('/nocobase/x/customer-portal');
    expect(getMultiPortalRouteUrl(app, '/nocobase/v/customer-portal', 'ai')).toBe('/nocobase/x/customer-portal');
  });

  it('should build sub-app portal hrefs from the app-scoped basename', () => {
    const app = {
      router: {
        getBasename: () => '/nocobase/v/apps/a_q7xx6p75d0e',
      },
      getRouteUrl: (pathname: string) => `/nocobase/v/apps/a_q7xx6p75d0e${pathname}`,
      getPublicPath: () => '/nocobase/v/apps/a_q7xx6p75d0e/',
    };

    expect(getMultiPortalRouteUrl(app, '/admin', 'no-code')).toBe('/nocobase/v/apps/a_q7xx6p75d0e/admin');
    expect(getMultiPortalRouteUrl(app, '/test', 'ai')).toBe('/nocobase/x/apps/a_q7xx6p75d0e/test');
    expect(getMultiPortalRouteUrl(app, '/nocobase/v/apps/a_q7xx6p75d0e/v/admin', 'no-code')).toBe(
      '/nocobase/v/apps/a_q7xx6p75d0e/admin',
    );
    expect(getMultiPortalRouteUrl(app, '/nocobase/v/apps/a_q7xx6p75d0e/x/test', 'ai')).toBe(
      '/nocobase/x/apps/a_q7xx6p75d0e/test',
    );
  });

  it.each([
    ['apps', 'no-code', '/customer-portal/dashboard', '/nocobase/v/apps/demo/customer-portal/dashboard'],
    ['apps', 'ai', '/developer-portal', '/nocobase/x/apps/demo/developer-portal'],
    ['_app', 'no-code', '/customer-portal/dashboard', '/nocobase/v/_app/demo/customer-portal/dashboard'],
    ['_app', 'ai', '/developer-portal', '/nocobase/x/apps/demo/developer-portal'],
  ])('should build %s Settings %s portal hrefs from the real runtime basename', (scope, portalType, path, expected) => {
    const app = {
      router: {
        getBasename: () => `/nocobase/settings/${scope}/demo/`,
      },
      getPublicPath: () => '/nocobase/',
    };

    expect(getMultiPortalRouteUrl(app, path, portalType)).toBe(expected);
  });

  it('should honor a custom modern client prefix in standalone Settings portal hrefs', () => {
    window.__nocobase_modern_client_prefix__ = 'modern';
    const app = {
      router: {
        getBasename: () => '/nocobase/_app/demo/',
      },
      getPublicPath: () => '/nocobase/',
    };

    expect(getMultiPortalRouteUrl(app, '/customer-portal/dashboard', 'no-code')).toBe(
      '/nocobase/modern/_app/demo/customer-portal/dashboard',
    );
  });

  it.each(['apps', '_app'])(
    'should not treat a %s suffix in the main Settings public path as an application scope',
    (scope) => {
      window.__nocobase_modern_client_prefix__ = 'modern';
      const publicPath = `/tenant/${scope}/root/`;
      const app = {
        name: 'main',
        router: {
          getBasename: () => publicPath,
        },
        getPublicPath: () => publicPath,
      };
      const subApp = {
        ...app,
        name: 'demo',
        router: {
          getBasename: () => `${publicPath}settings/${scope}/demo/`,
        },
      };

      expect(getMultiPortalRouteUrl(app, '/admin', 'no-code')).toBe(`${publicPath}modern/admin`);
      expect(getMultiPortalRouteUrl(app, '/assistant', 'ai')).toBe(`${publicPath}x/assistant`);
      expect(getMultiPortalRouteUrl(subApp, '/admin', 'no-code')).toBe(`${publicPath}modern/${scope}/demo/admin`);
      expect(getMultiPortalRouteUrl(subApp, '/assistant', 'ai')).toBe(`${publicPath}x/apps/demo/assistant`);
    },
  );

  it('should keep portal wording user-facing translations consistent', () => {
    expect(enUS['Add portal']).toBe('Add portal');
    expect(enUS['Edit portal']).toBe('Edit portal');
    expect(enUS['Delete portal']).toBe('Delete portal');
    expect(enUS.Desktop).toBe('Desktop');
    expect(enUS['Portal type']).toBe('Portal type');
    expect(enUS['No-code portal']).toBe('No-code portal');
    expect(enUS['AI portal']).toBe('AI portal');
    expect(enUS.Icon).toBe('Icon');
    expect(enUS.Mobile).toBe('Mobile');
    expect(enUS['Multi-portal']).toBe('Portal manager');
    expect(enUS['Portal name']).toBe('Portal name');
    expect(enUS['Portal name can only contain lowercase letters, numbers, hyphens, and underscores']).toBe(
      'Portal name can only contain lowercase letters, numbers, hyphens, and underscores',
    );
    expect(enUS['Create with visual configuration. AI can help adjust the configuration. Path: /v/<name>']).toBe(
      'Create with visual configuration. AI can help adjust the configuration. Path: /v/<name>',
    );
    expect(enUS['Create with AI Agent and code. Users can request changes in natural language. Path: /x/<name>']).toBe(
      'Create with AI Agent and code. Users can request changes in natural language. Path: /x/<name>',
    );
    expect(enUS['Source storage']).toBe('Source storage');
    expect(enUS.NocoBase).toBe('NocoBase');
    expect(enUS.Git).toBe('Git');
    expect(enUS['Git repository URL']).toBe('Git repository URL');
    expect(enUS['Git branch']).toBe('Git branch');
    expect(enUS['Git path']).toBe('Git path');
    expect(enUS['Manage portal source code in NocoBase.']).toBe('Manage portal source code in NocoBase.');
    expect(enUS['Manage portal source code in a Git repository.']).toBe(
      'Manage portal source code in a Git repository.',
    );
    expect(enUS['Directory inside the Git repository for this portal. Leave empty for the root.']).toBe(
      'Directory inside the Git repository for this portal. Leave empty for the root.',
    );
    expect(enUS['The corresponding portal directory will also be deleted.']).toBe(
      'The corresponding portal directory will also be deleted.',
    );

    expect(zhCN['Add portal']).toBe('新增 Portal');
    expect(zhCN['Edit portal']).toBe('编辑 Portal');
    expect(zhCN['Delete portal']).toBe('删除 Portal');
    expect(zhCN.Desktop).toBe('桌面端');
    expect(zhCN['Portal type']).toBe('Portal 类型');
    expect(zhCN['No-code portal']).toBe('无代码 Portal');
    expect(zhCN['AI portal']).toBe('AI Portal');
    expect(zhCN.Icon).toBe('图标');
    expect(zhCN.Mobile).toBe('移动端');
    expect(zhCN['Multi-portal']).toBe('Portal 管理');
    expect(zhCN.Portals).toBe('Portal');
    expect(zhCN['No portals']).toBe('暂无 Portal');
    expect(zhCN['Failed to load portals']).toBe('加载 Portal 失败');
    expect(zhCN['Portal']).toBe('Portal');
    expect(zhCN['New portals are allowed to be accessed by default']).toBe('新建 Portal 默认允许访问');
    expect(zhCN['Portal name']).toBe('Portal 名称');
    expect(zhCN['Portal name can only contain lowercase letters, numbers, hyphens, and underscores']).toBe(
      'Portal 名称只能包含小写英文字母、数字、连字符和下划线',
    );
    expect(zhCN['Create with visual configuration. AI can help adjust the configuration. Path: /v/<name>']).toBe(
      '通过可视化配置创建，AI 可以协助调整配置。访问路径：/v/<name>',
    );
    expect(zhCN['Create with AI Agent and code. Users can request changes in natural language. Path: /x/<name>']).toBe(
      '通过 AI Agent 和代码创建，可用自然语言提出修改要求。访问路径：/x/<name>',
    );
    expect(zhCN['Source storage']).toBe('源码存储');
    expect(zhCN.NocoBase).toBe('NocoBase');
    expect(zhCN.Git).toBe('Git');
    expect(zhCN['Git repository URL']).toBe('Git 仓库 URL');
    expect(zhCN['Git branch']).toBe('Git 分支');
    expect(zhCN['Git path']).toBe('Git 路径');
    expect(zhCN['Manage portal source code in NocoBase.']).toBe('在 NocoBase 中管理 Portal 源码。');
    expect(zhCN['Manage portal source code in a Git repository.']).toBe('在 Git 仓库中管理 Portal 源码。');
    expect(zhCN['Directory inside the Git repository for this portal. Leave empty for the root.']).toBe(
      '该 Portal 在 Git 仓库内的目录，留空表示仓库根目录。',
    );
    expect(zhCN['When disabled, this portal will not be registered or accessible.']).toBe(
      '关闭后，该 Portal 将不会注册，也无法访问。',
    );
    expect(zhCN['The corresponding portal directory will also be deleted.']).toBe('对应的 Portal 目录也会被删除。');
  });

  it('should fire resource.create with portal fields including uiLayoutUid', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await createMultiPortal({ resource, values: portalValues, onSubmitted });

    expect(resource.create).toHaveBeenCalledWith({ values: portalValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should render portal management table without permission or UI layout wording', async () => {
    const user = userEvent.setup();
    const multiPortalsResource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              uiLayout: {
                layoutType: 'mobile',
                title: 'Mobile layout',
                uid: 'mobile-layout-model',
              },
            },
            {
              ...portalValues,
              title: 'Developer portal',
              uid: 'developer-portal',
              portalType: 'ai',
              portalName: 'developer-portal',
              routePath: '/developer-portal',
              uiLayoutUid: null,
              uiLayout: null,
            },
            {
              ...portalValues,
              title: 'Disabled portal',
              uid: 'disabled-portal',
              portalName: 'disabled-portal',
              routePath: '/disabled-portal',
              enabled: false,
              uiLayout: {
                layoutType: 'desktop',
                title: 'Desktop layout',
                uid: 'desktop-layout-model',
              },
            },
          ],
        },
      }),
    });
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            uid: 'mobile-layout-model',
            title: 'Mobile layout',
          },
        ],
      },
    });
    flowContext.current = {
      api: {
        request,
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return multiPortalsResource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn(),
      },
    };

    const { container } = render(
      <AntdApp>
        <MultiPortalsPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Customer portal')).toBeInTheDocument();
    expect(screen.queryByText('UID')).not.toBeInTheDocument();
    expect(screen.getByText('Portal name')).toBeInTheDocument();
    expect(screen.getByText('customer-portal')).toBeInTheDocument();
    const noCodeAccessPathLink = screen.getByRole('link', { name: '/v/customer-portal' });
    expect(noCodeAccessPathLink).toHaveAttribute('href', '/v/customer-portal');
    expect(noCodeAccessPathLink).toHaveAttribute('target', '_blank');
    expect(noCodeAccessPathLink).toHaveAttribute('rel', 'noopener noreferrer');
    const aiAccessPathLink = screen.getByRole('link', { name: '/x/developer-portal' });
    expect(aiAccessPathLink).toHaveAttribute('href', '/x/developer-portal');
    expect(aiAccessPathLink).toHaveAttribute('target', '_blank');
    expect(aiAccessPathLink).toHaveAttribute('rel', 'noopener noreferrer');
    const toolbar = container.querySelector('.ant-flex');
    expect(within(toolbar as HTMLElement).getByRole('button', { name: /Delete/ })).not.toHaveClass('ant-btn-dangerous');
    expect(screen.getByText('Access path')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /mode/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /View/ })[0]).toHaveAttribute('href', '/v/customer-portal');
    const customerPortalRow = screen.getByText('Customer portal').closest('tr') as HTMLElement;
    const developerPortalRow = screen.getByText('Developer portal').closest('tr') as HTMLElement;
    const disabledPortalRow = screen.getByText('Disabled portal').closest('tr') as HTMLElement;
    const routesButton = within(customerPortalRow).getByRole('button', { name: 'Routes' });
    expect(routesButton).toBeEnabled();
    expect(within(developerPortalRow).queryByRole('button', { name: 'Routes' })).not.toBeInTheDocument();
    expect(within(disabledPortalRow).getByRole('button', { name: 'Routes' })).toBeDisabled();

    const actionCell = customerPortalRow.querySelector('.ant-table-cell:last-child');
    const actionButtons = actionCell?.querySelectorAll('.ant-btn-link') ?? [];
    expect(Array.from(actionButtons).map((button) => button.textContent)).toEqual(['View', 'Edit', 'Routes', 'Delete']);
    actionButtons.forEach((button) => {
      expect(button).toHaveStyle('padding-inline: 0');
    });
    expect(actionCell?.querySelectorAll('.anticon')).toHaveLength(0);
    expect(within(actionCell as HTMLElement).getByRole('button', { name: /Delete/ })).not.toHaveClass(
      'ant-btn-dangerous',
    );
    expect(screen.queryByRole('button', { name: /Logs/ })).not.toBeInTheDocument();
    await user.click(routesButton);
    expect(flowContext.current?.viewer.drawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        closable: true,
        content: expect.any(Function),
        width: '80%',
      }),
    );
    await user.click(within(actionCell as HTMLElement).getByRole('button', { name: /Delete/ }));
    expect(await screen.findByText('Are you sure you want to delete it?')).toBeInTheDocument();
    expect(screen.getByText('The corresponding portal directory will also be deleted.')).toBeInTheDocument();
    expect(container.querySelector('.ant-tag')).toHaveTextContent('Mobile layout');
    expect(screen.queryByText('UI layout')).not.toBeInTheDocument();
    expect(screen.queryByText(/permission/i)).not.toBeInTheDocument();
    expect(multiPortalsResource.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: ['createdAt'],
      appends: ['uiLayout'],
    });
  });

  it('should allow deleting default portals from the table', async () => {
    const user = userEvent.setup();
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              title: 'Admin',
              uid: '__default_portal__',
              portalName: 'admin',
              routePath: '/admin',
              uiLayout: {
                title: 'Desktop layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({ data: { data: { apps: [], portals: [] } } }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn(),
      },
    };

    const { container } = render(
      <AntdApp>
        <MultiPortalsPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Admin')).toBeInTheDocument();
    const toolbar = container.querySelector('.ant-flex');
    const toolbarDeleteButton = within(toolbar as HTMLElement).getByRole('button', { name: /Delete/ });
    expect(toolbarDeleteButton).toBeDisabled();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[1]).not.toBeDisabled();
    await user.click(checkboxes[1]);
    expect(toolbarDeleteButton).not.toBeDisabled();

    const actionCell = container.querySelector('tbody tr .ant-table-cell:last-child');
    await user.click(within(actionCell as HTMLElement).getByRole('button', { name: /Delete/ }));
    expect(await screen.findByText('Are you sure you want to delete it?')).toBeInTheDocument();
    expect(screen.getByText('The corresponding portal directory will also be deleted.')).toBeInTheDocument();
  });

  it('should not warn about refs when opening the create form icon field', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    try {
      await user.click(await screen.findByRole('button', { name: /Add portal/ }));
      rerender(
        <AntdApp>
          <MultiPortalsPage />
          {drawerContent}
        </AntdApp>,
      );

      expect(await screen.findByRole('dialog', { name: 'Add portal' })).toBeInTheDocument();
      expect(
        consoleError.mock.calls.some((args) =>
          args.some((arg) => typeof arg === 'string' && arg.includes('Function components cannot be given refs')),
        ),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('should open create form with portal fields and layout selection', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            uid: 'mobile-layout-model',
            title: 'Mobile layout',
          },
        ],
      },
    });
    flowContext.current = {
      api: {
        request,
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Add portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    expect(within(dialog).getByLabelText('Title')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('UID')).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Access path')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Portal name')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Portal type')).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /No-code portal/ })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: /AI portal/ })).not.toBeChecked();
    expect(
      within(dialog)
        .getByRole('radio', { name: /No-code portal/ })
        .closest('label'),
    ).toHaveStyle('align-items: flex-start');
    expect(within(dialog).queryByLabelText('Source storage')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Layout')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Icon')).not.toBeRequired();
    expect(within(dialog).getByLabelText('Enabled')).toBeInTheDocument();
    expect(within(dialog).queryByText('Must start with /. For example: /portal.')).not.toBeInTheDocument();
    expect(
      within(dialog).getByText('When disabled, this portal will not be registered or accessible.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText('UI layout')).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/permission/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: 'uiLayouts:listEnabled',
        method: 'get',
        params: {
          pageSize: 200,
          sort: ['uid'],
        },
        skipNotify: true,
      });
    });
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'uiLayouts:list' }));
  });

  it('should simplify layout option labels while preserving selected layout uid', async () => {
    const resource = makeResource();
    const { container, dialog, user } = await openCreatePortalForm(resource, [
      {
        uid: 'desktop-layout-model',
        title: 'Desktop layout',
        layoutType: 'desktop',
      },
      {
        uid: 'mobile-layout-model',
        title: 'Mobile layout',
        layoutType: 'mobile',
      },
      {
        uid: 'legacy-layout-model',
        title: 'Legacy layout',
      },
      {
        uid: 'fallback-layout-model',
      },
    ]);

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    expect((await screen.findAllByText('Desktop')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Mobile')).toBeInTheDocument();
    expect(await screen.findByText('Legacy layout')).toBeInTheDocument();
    expect(await screen.findByText('fallback-layout-model')).toBeInTheDocument();
    expect(screen.queryByText('Desktop layout')).not.toBeInTheDocument();
    expect(screen.queryByText('Mobile layout')).not.toBeInTheDocument();
    await user.click(screen.getByText('Mobile'));

    await user.type(within(dialog).getByLabelText('Title'), 'Mobile portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'mobile-portal');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          portalName: 'mobile-portal',
          routePath: '/mobile-portal',
          title: 'Mobile portal',
          uiLayoutUid: 'mobile-layout-model',
        }),
      });
    });
  });

  it('should select the desktop layout by default when creating a portal', async () => {
    const resource = makeResource();
    const { dialog, user } = await openCreatePortalForm(resource, [
      {
        uid: 'desktop-layout-model',
        title: 'Desktop layout',
        layoutType: 'desktop',
      },
      {
        uid: 'mobile-layout-model',
        title: 'Mobile layout',
        layoutType: 'mobile',
      },
    ]);

    expect(await within(dialog).findByText('Desktop')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Title'), 'Desktop portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'desktop-portal');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          portalName: 'desktop-portal',
          routePath: '/desktop-portal',
          title: 'Desktop portal',
          uiLayoutUid: 'desktop-layout-model',
        }),
      });
    });
  });

  it('should derive access path from portal name when creating a portal', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { container, rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Add portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    await user.type(within(dialog).getByLabelText('Title'), 'Admin portal');
    await user.type(within(dialog).getByLabelText('Portal name'), ' admin ');
    await user.type(within(dialog).getByLabelText('Icon'), 'homeoutlined');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile layout'));
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: {
          title: 'Admin portal',
          uid: 'portal-random-id',
          portalName: 'admin',
          routePath: '/admin',
          uiLayoutUid: 'mobile-layout-model',
          icon: 'homeoutlined',
          portalType: 'no-code',
          enabled: true,
        },
      });
    });
  });

  it('should submit explicit route name and portal type when creating a portal', async () => {
    const resource = makeResource();
    const { container, dialog, user } = await openCreatePortalForm(resource);

    await user.type(within(dialog).getByLabelText('Title'), 'Developer portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'developer-portal');
    await user.click(within(dialog).getByRole('radio', { name: /AI portal/ }));
    expect(within(dialog).getByLabelText('Source storage')).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /NocoBase/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /Git/ })).toBeInTheDocument();
    expect(
      within(dialog)
        .getByRole('radio', { name: /NocoBase/ })
        .closest('label'),
    ).toHaveStyle('align-items: flex-start');
    expect(within(dialog).queryByLabelText('Git repository URL')).not.toBeInTheDocument();
    await selectMobileLayout(container, user);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          portalType: 'ai',
          portalName: 'developer-portal',
          routePath: '/developer-portal',
          title: 'Developer portal',
          options: {
            sourceStorage: 'nocobase',
          },
        }),
      });
    });
  });

  it('should submit git source storage options when creating an AI portal', async () => {
    const resource = makeResource();
    const { container, dialog, user } = await openCreatePortalForm(resource);

    await user.type(within(dialog).getByLabelText('Title'), 'Git portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'git-portal');
    await user.click(within(dialog).getByRole('radio', { name: /AI portal/ }));
    await user.click(within(dialog).getByRole('radio', { name: /Git/ }));
    await user.type(within(dialog).getByLabelText('Git repository URL'), ' git@github.com:nocobase/customer.git ');
    await user.clear(within(dialog).getByLabelText('Git branch'));
    await user.clear(within(dialog).getByLabelText('Git path'));
    await selectMobileLayout(container, user);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          portalType: 'ai',
          portalName: 'git-portal',
          routePath: '/git-portal',
          title: 'Git portal',
          options: {
            sourceStorage: 'git',
            git: {
              repo: 'git@github.com:nocobase/customer.git',
              branch: 'main',
              path: '',
            },
          },
        }),
      });
    });
  });

  it('should require git repository URL when AI portal source storage is git', async () => {
    const resource = makeResource();
    const { container, dialog, user } = await openCreatePortalForm(resource);

    await user.type(within(dialog).getByLabelText('Title'), 'Git portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'git-portal');
    await user.click(within(dialog).getByRole('radio', { name: /AI portal/ }));
    await user.click(within(dialog).getByRole('radio', { name: /Git/ }));
    await selectMobileLayout(container, user);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await within(dialog).findByText('The field value is required')).toBeInTheDocument();
    expect(resource.create).not.toHaveBeenCalled();
  });

  it.each([['中文'], ['foo bar'], ['foo.bar'], ['Foo'], ['foo/bar']])(
    'should reject unsafe portal name %s before submitting',
    async (portalSlug) => {
      const resource = makeResource();
      const { container, dialog, user } = await openCreatePortalForm(resource);

      await user.type(within(dialog).getByLabelText('Title'), 'Bad portal');
      await user.type(within(dialog).getByLabelText('Portal name'), portalSlug);
      await selectMobileLayout(container, user);
      await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

      expect(
        await within(dialog).findByText(
          'Portal name can only contain lowercase letters, numbers, hyphens, and underscores',
        ),
      ).toBeInTheDocument();
      expect(resource.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['portal', '/portal'],
    ['sales-mobile', '/sales-mobile'],
    ['sales_mobile', '/sales_mobile'],
  ])('should accept URL-safe portal name %s', async (portalName, routePath) => {
    const resource = makeResource();
    const { container, dialog, user } = await openCreatePortalForm(resource);

    await user.type(within(dialog).getByLabelText('Title'), 'Valid portal');
    await user.type(within(dialog).getByLabelText('Portal name'), portalName);
    await selectMobileLayout(container, user);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: {
          title: 'Valid portal',
          uid: 'portal-random-id',
          portalName,
          routePath,
          uiLayoutUid: 'mobile-layout-model',
          icon: null,
          portalType: 'no-code',
          enabled: true,
        },
      });
    });
  });

  it('should populate and preserve the portal icon when editing', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              icon: 'homeoutlined',
              uiLayout: {
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    expect(within(dialog).queryByLabelText('UID')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Icon')).toHaveValue('homeoutlined');

    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: {
          title: 'Customer portal',
          uid: 'customer-portal',
          portalType: 'no-code',
          portalName: 'customer-portal',
          routePath: '/customer-portal',
          uiLayoutUid: 'mobile-layout-model',
          icon: 'homeoutlined',
          enabled: true,
        },
      });
    });
  });

  it('should submit null when clearing the portal icon', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              icon: 'homeoutlined',
              uiLayout: {
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    await user.clear(within(dialog).getByLabelText('Icon'));
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: expect.objectContaining({
          icon: null,
        }),
      });
    });
  });

  it('should populate and preserve AI portal git source storage options when editing', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              portalType: 'ai',
              options: {
                sourceStorage: 'git',
                git: {
                  repo: 'git@github.com:nocobase/customer.git',
                  branch: 'develop',
                  path: 'portals/customer',
                },
              },
              uiLayout: {
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    expect(within(dialog).getByLabelText('Source storage')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Git repository URL')).toHaveValue('git@github.com:nocobase/customer.git');
    expect(within(dialog).getByLabelText('Git branch')).toHaveValue('develop');
    expect(within(dialog).getByLabelText('Git path')).toHaveValue('portals/customer');

    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: expect.objectContaining({
          portalType: 'ai',
          options: {
            sourceStorage: 'git',
            git: {
              repo: 'git@github.com:nocobase/customer.git',
              branch: 'develop',
              path: 'portals/customer',
            },
          },
        }),
      });
    });
  });

  it('should preserve the portal icon when toggling enabled', async () => {
    const user = userEvent.setup();
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              icon: 'homeoutlined',
              uiLayout: {
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({ data: { data: { apps: [], portals: [] } } }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn(),
      },
    };

    render(
      <AntdApp>
        <MultiPortalsPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Customer portal')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Enabled' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: {
          title: 'Customer portal',
          uid: 'customer-portal',
          portalName: 'customer-portal',
          routePath: '/customer-portal',
          uiLayoutUid: 'mobile-layout-model',
          icon: 'homeoutlined',
          portalType: 'no-code',
          enabled: false,
        },
      });
    });
  });

  it('should preserve AI portal source storage options when toggling enabled', async () => {
    const user = userEvent.setup();
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              portalType: 'ai',
              uiLayoutUid: null,
              options: {
                sourceStorage: 'git',
                git: {
                  repo: 'git@github.com:nocobase/customer.git',
                  branch: 'develop',
                  path: 'portals/customer',
                },
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({ data: { data: { apps: [], portals: [] } } }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn(),
      },
    };

    render(
      <AntdApp>
        <MultiPortalsPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Customer portal')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Enabled' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: expect.objectContaining({
          portalType: 'ai',
          enabled: false,
          options: {
            sourceStorage: 'git',
            git: {
              repo: 'git@github.com:nocobase/customer.git',
              branch: 'develop',
              path: 'portals/customer',
            },
          },
        }),
      });
    });
  });

  it('should treat the legacy default uid as a normal portal in the table', async () => {
    const user = userEvent.setup();
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              title: 'Admin',
              uid: '__default_portal__',
              portalName: 'admin',
              routePath: '/admin',
              uiLayout: {
                title: 'Desktop layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({ data: { data: { apps: [], portals: [] } } }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn(),
      },
    };

    render(
      <AntdApp>
        <MultiPortalsPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Admin')).toBeInTheDocument();
    const enabledSwitch = screen.getByRole('switch', { name: 'Enabled' });
    expect(enabledSwitch).not.toBeDisabled();
    await user.click(enabledSwitch);

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: '__default_portal__',
        values: {
          title: 'Admin',
          uid: '__default_portal__',
          portalName: 'admin',
          routePath: '/admin',
          uiLayoutUid: 'mobile-layout-model',
          icon: null,
          portalType: 'no-code',
          enabled: false,
        },
      });
    });
  });

  it('should not lock editable fields for the legacy default uid but should keep its layout immutable', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              title: 'Admin',
              uid: '__default_portal__',
              portalName: 'admin',
              routePath: '/admin',
              uiLayout: {
                title: 'Desktop layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    expect(within(dialog).getByLabelText('Portal name')).not.toBeDisabled();
    expect(within(dialog).getByLabelText('Portal type')).not.toBeDisabled();
    expect(within(dialog).getByLabelText('Enabled')).not.toBeDisabled();
    expect(within(dialog).getByLabelText('Layout')).toBeDisabled();
  });

  it('should populate the layout field from the appended uiLayout relation when editing', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              uiLayoutUid: undefined,
              uiLayout: {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    expect(await within(dialog).findByText('Mobile layout')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Layout')).toBeDisabled();
  });

  it('should reject portal names with dots before submitting', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { container, rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Add portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    await user.type(within(dialog).getByLabelText('Title'), 'Bad portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'foo.bar');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile layout'));
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(
      await within(dialog).findByText(
        'Portal name can only contain lowercase letters, numbers, hyphens, and underscores',
      ),
    ).toBeInTheDocument();
    expect(resource.create).not.toHaveBeenCalled();
  });

  it('should notify backend create errors and keep the form open', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const backendMessage = 'route_name 字段值已存在';
    const resource = makeResource({
      create: vi.fn().mockRejectedValue({
        response: {
          data: {
            errors: [{ message: backendMessage }],
          },
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { container, rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Add portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    await user.type(within(dialog).getByLabelText('Title'), 'Duplicate portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'duplicate-portal');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile layout'));
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText(backendMessage)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Add portal' })).toBeInTheDocument();
  });

  it('should reject invalid portal name before submitting', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              uiLayout: {
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    const portalSlugInput = within(dialog).getByLabelText('Portal name');
    await user.clear(portalSlugInput);
    await user.type(portalSlugInput, 'Customer');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(
      await within(dialog).findByText(
        'Portal name can only contain lowercase letters, numbers, hyphens, and underscores',
      ),
    ).toBeInTheDocument();
    expect(resource.update).not.toHaveBeenCalled();
  });
});
