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
  routeName: 'customer-portal',
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
                title: 'Mobile layout',
              },
            },
            {
              ...portalValues,
              title: 'Developer portal',
              uid: 'developer-portal',
              portalType: 'ai',
              routeName: 'developer-portal',
              routePath: '/developer-portal',
              uiLayoutUid: null,
              uiLayout: null,
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
    expect(screen.getAllByRole('link', { name: /View/ })[0]).toHaveAttribute('href', '/v/customer-portal');
    const actionCell = container.querySelector('tbody tr .ant-table-cell:last-child');
    const actionButtons = actionCell?.querySelectorAll('.ant-btn-link') ?? [];
    expect(actionButtons).toHaveLength(3);
    actionButtons.forEach((button) => {
      expect(button).toHaveStyle('padding-inline: 0');
    });
    expect(actionCell?.querySelectorAll('.anticon')).toHaveLength(0);
    expect(within(actionCell as HTMLElement).getByRole('button', { name: /Delete/ })).not.toHaveClass(
      'ant-btn-dangerous',
    );
    expect(screen.queryByRole('button', { name: /Logs/ })).not.toBeInTheDocument();
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
              routeName: 'admin',
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
          routeName: 'mobile-portal',
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
          routeName: 'desktop-portal',
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
          routeName: 'admin',
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
    await selectMobileLayout(container, user);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          portalType: 'ai',
          routeName: 'developer-portal',
          routePath: '/developer-portal',
          title: 'Developer portal',
        }),
      });
    });
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
  ])('should accept URL-safe portal name %s', async (routeName, routePath) => {
    const resource = makeResource();
    const { container, dialog, user } = await openCreatePortalForm(resource);

    await user.type(within(dialog).getByLabelText('Title'), 'Valid portal');
    await user.type(within(dialog).getByLabelText('Portal name'), routeName);
    await selectMobileLayout(container, user);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: {
          title: 'Valid portal',
          uid: 'portal-random-id',
          routeName,
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
          routeName: 'customer-portal',
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
          routeName: 'customer-portal',
          routePath: '/customer-portal',
          uiLayoutUid: 'mobile-layout-model',
          icon: 'homeoutlined',
          portalType: 'no-code',
          enabled: false,
        },
      });
    });
  });

  it('should allow toggling enabled for default portals from the table', async () => {
    const user = userEvent.setup();
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              title: 'Admin',
              uid: '__default_portal__',
              routeName: 'admin',
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
          routeName: 'admin',
          routePath: '/admin',
          uiLayoutUid: 'mobile-layout-model',
          icon: null,
          portalType: 'no-code',
          enabled: false,
        },
      });
    });
  });

  it('should allow toggling enabled for default portals from the edit form', async () => {
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
              routeName: 'admin',
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
    expect(within(dialog).getByLabelText('Portal name')).toBeDisabled();
    expect(within(dialog).getByLabelText('Enabled')).not.toBeDisabled();
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
