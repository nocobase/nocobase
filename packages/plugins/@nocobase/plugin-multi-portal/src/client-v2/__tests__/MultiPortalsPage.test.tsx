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
  setDefaultMultiPortal,
  updateMultiPortal,
  type MultiPortalFormValues,
  type MultiPortalResource,
} from '../pages/MultiPortalsPage';
import { getMultiPortalRouteUrl, getMultiPortalSettingsUrl } from '../routeUrl';
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
  // 真实的 AttachmentUpload 依赖 FlowEngineProvider（useApp -> 附件存储规则），这里只要一个
  // 能受控读写值的替身，覆盖上传逻辑的是 client-v2 自己的用例。
  const AttachmentUpload = (props: { value?: { url?: string } | null; onChange?: (value: unknown) => void }) =>
    ReactModule.createElement(
      'button',
      {
        type: 'button',
        'data-testid': 'attachment-upload',
        onClick: () => props.onChange?.(props.value ? null : { id: 1, url: 'https://example.com/cover.png' }),
      },
      props.value?.url ?? 'Upload',
    );
  return {
    ...actual,
    AttachmentUpload,
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

function makeResource(overrides: Partial<MultiPortalResource> = {}): MultiPortalResource {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    setDefault: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    }),
    ...overrides,
  };
}

/**
 * 打开新建表单。
 *
 * 新建默认落在 AI mode 上；需要 no-code 表单（布局选择、/v/ 路径）的用例把 `portalType`
 * 显式传成 `'no-code'`，helper 替它点一下单选。
 */
async function openCreatePortalForm(
  resource = makeResource(),
  { portalType = 'no-code' }: { portalType?: 'ai' | 'no-code' } = {},
) {
  const user = userEvent.setup();
  let drawerContent: React.ReactNode;
  const request = vi.fn().mockResolvedValue({ data: { data: [] } });
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

  const { container, rerender } = render(
    <AntdApp>
      <MultiPortalsPage />
      {drawerContent}
    </AntdApp>,
  );

  await user.click((await screen.findAllByRole('button', { name: /Add portal/ }))[0]);
  rerender(
    <AntdApp>
      <MultiPortalsPage />
      {drawerContent}
    </AntdApp>,
  );

  const dialog = await screen.findByRole('dialog', { name: 'Add portal' });

  if (portalType === 'no-code') {
    await user.click(within(dialog).getByRole('radio', { name: /No-code mode/ }));
  }

  return {
    container,
    dialog,
    request,
    resource,
    user,
  };
}

async function selectMobileLayout(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
  await user.click(await screen.findByText('Mobile'));
}

/**
 * Open the "more" menu at the top right of a card.
 *
 * The card actions (edit / routes / set as default / delete) all live in that menu,
 * so a test has to expand it first. antd renders the dropdown into a portal under
 * body, outside the card's DOM, hence the `within(menu)` scope.
 *
 * @param {ReturnType<typeof userEvent.setup>} user interaction instance
 * @param {HTMLElement} card target card
 * @returns queries scoped to the menu
 */
async function openCardMenu(user: ReturnType<typeof userEvent.setup>, card: HTMLElement) {
  await user.click(within(card).getByRole('button', { name: 'More' }));
  // Wait for the entries to mount: the role="menu" container shows up first and the
  // items land a tick later. Every card has "delete", so it anchors the current menu.
  // Entries carry icons, and antd renders those as <span role="img" aria-label="delete">,
  // which counts towards the accessible name - hence matching by regex, not equality.
  const anchor = await screen.findByRole('menuitem', { name: /Delete/ });
  return within(anchor.closest('[role="menu"]') as HTMLElement);
}

/**
 * Expand a card menu and click one of its entries.
 *
 * @param {ReturnType<typeof userEvent.setup>} user interaction instance
 * @param {HTMLElement} card target card
 * @param {string} name entry name
 */
async function clickCardMenuItem(user: ReturnType<typeof userEvent.setup>, card: HTMLElement, name: string) {
  const menu = await openCardMenu(user, card);
  await user.click(menu.getByRole('menuitem', { name: new RegExp(name) }));
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
    expect(getMultiPortalSettingsUrl(app)).toBe('/nocobase/settings');
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
    expect(getMultiPortalSettingsUrl(app)).toBe('/nocobase/settings/apps/a_q7xx6p75d0e');
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
    expect(enUS['Add portal']).toBe('Add Portal');
    expect(enUS['Edit portal']).toBe('Edit portal');
    expect(enUS['Delete portal']).toBe('Delete portal');
    expect(enUS.Desktop).toBe('Desktop');
    expect(enUS['Development mode']).toBe('Development mode');
    expect(enUS['No-code mode']).toBe('No-code mode');
    expect(enUS['AI mode']).toBe('AI mode');
    expect(enUS.Icon).toBe('Icon');
    expect(enUS.Mobile).toBe('Mobile');
    expect(enUS['Multi-portal']).toBe('Portal manager');
    expect(enUS['Portal name']).toBe('Portal name');
    expect(enUS['Portal name can only contain lowercase letters, numbers, hyphens, and underscores']).toBe(
      'Portal name can only contain lowercase letters, numbers, hyphens, and underscores',
    );
    expect(enUS['Build business systems through visual configuration.']).toBe(
      'Build business systems through visual configuration.',
    );
    expect(
      enUS[
        'Users create applications through drag-and-drop configuration. AI can assist with creating, adjusting, and optimizing configurations such as data models, interfaces, workflows, and more.'
      ],
    ).toBe(
      'Users create applications through drag-and-drop configuration. AI can assist with creating, adjusting, and optimizing configurations such as data models, interfaces, workflows, and more.',
    );
    expect(enUS['Build complete business systems with AI agents and code.']).toBe(
      'Build complete business systems with AI agents and code.',
    );
    expect(
      enUS[
        'Users describe requirements in natural language, and AI agents create and modify applications, including interfaces, data models, business logic, roles and permissions, and more.'
      ],
    ).toBe(
      'Users describe requirements in natural language, and AI agents create and modify applications, including interfaces, data models, business logic, roles and permissions, and more.',
    );
    expect(enUS['Source management']).toBe('Source management');
    expect(enUS['Select how the application source code is stored and managed.']).toBe(
      'Select how the application source code is stored and managed.',
    );
    expect(enUS.NocoBase).toBe('NocoBase');
    expect(enUS.Git).toBe('Git');
    expect(enUS['Git repository URL']).toBe('Git repository URL');
    expect(enUS['Git branch']).toBe('Git branch');
    expect(enUS['Git path']).toBe('Git path');
    expect(enUS['Store and manage application source code in NocoBase.']).toBe(
      'Store and manage application source code in NocoBase.',
    );
    expect(enUS['Store and manage application source code in a Git repository.']).toBe(
      'Store and manage application source code in a Git repository.',
    );
    expect(enUS['Used to generate the portal URL.']).toBe('Used to generate the portal URL.');
    expect(enUS['Display name of the portal.']).toBe('Display name of the portal.');
    expect(enUS['Example:']).toBe('Example:');
    expect(enUS['Directory inside the Git repository for this portal. Leave empty for the root.']).toBe(
      'Directory inside the Git repository for this portal. Leave empty for the root.',
    );
    expect(enUS['The corresponding portal directory will also be deleted.']).toBe(
      'The corresponding portal directory will also be deleted.',
    );
    expect(enUS['Set as default']).toBe('Set as default');
    expect(enUS['Default portal updated successfully']).toBe('Default portal updated successfully');
    expect(enUS['Use multiPortals:setDefault to update the default Portal']).toBe(
      'Use multiPortals:setDefault to update the default Portal',
    );
    expect(enUS['filterByTk is required']).toBe('filterByTk is required');
    expect(enUS['Portal not found']).toBe('Portal not found');
    expect(enUS['Disabled Portal cannot be set as default']).toBe('Disabled Portal cannot be set as default');
    expect(enUS['Portal device configuration is invalid']).toBe('Portal device configuration is invalid');
    expect(enUS['Unsupported Portal type cannot be set as default']).toBe(
      'Unsupported Portal type cannot be set as default',
    );

    expect(zhCN['Add portal']).toBe('新增门户');
    expect(zhCN['Edit portal']).toBe('编辑门户');
    expect(zhCN['Delete portal']).toBe('删除门户');
    expect(zhCN.Desktop).toBe('桌面端');
    expect(zhCN['Development mode']).toBe('开发模式');
    expect(zhCN['No-code mode']).toBe('无代码模式');
    expect(zhCN['AI mode']).toBe('AI 模式');
    expect(zhCN.Icon).toBe('图标');
    expect(zhCN.Mobile).toBe('移动端');
    expect(zhCN['Multi-portal']).toBe('门户管理');
    expect(zhCN.Portals).toBe('门户');
    expect(zhCN['No portals']).toBe('暂无门户');
    expect(zhCN['Failed to load portals']).toBe('加载门户失败');
    expect(zhCN['Portal']).toBe('门户');
    expect(zhCN['New portals are allowed to be accessed by default']).toBe('新建门户默认允许访问');
    expect(zhCN['Portal name']).toBe('门户名称');
    expect(zhCN['Portal name can only contain lowercase letters, numbers, hyphens, and underscores']).toBe(
      '门户名称只能包含小写英文字母、数字、连字符和下划线',
    );
    expect(zhCN['Build business systems through visual configuration.']).toBe('通过可视化界面配置开发业务系统。');
    expect(
      zhCN[
        'Users create applications through drag-and-drop configuration. AI can assist with creating, adjusting, and optimizing configurations such as data models, interfaces, workflows, and more.'
      ],
    ).toBe('用户通过拖拽和配置方式创建应用，AI 可以协助创建、调整和优化数据模型、界面、工作流等配置。');
    expect(zhCN['Build complete business systems with AI agents and code.']).toBe(
      '使用 AI Agent 和代码能力开发完整业务系统。',
    );
    expect(
      zhCN[
        'Users describe requirements in natural language, and AI agents create and modify applications, including interfaces, data models, business logic, roles and permissions, and more.'
      ],
    ).toBe('用户通过自然语言描述需求，AI Agent 负责创建和修改应用，包括界面、数据模型、业务逻辑、角色权限等。');
    expect(zhCN['Source management']).toBe('源码管理');
    expect(zhCN['Select how the application source code is stored and managed.']).toBe(
      '选择应用源码的存储和管理方式。',
    );
    expect(zhCN.NocoBase).toBe('NocoBase');
    expect(zhCN.Git).toBe('Git');
    expect(zhCN['Git repository URL']).toBe('Git 仓库 URL');
    expect(zhCN['Git branch']).toBe('Git 分支');
    expect(zhCN['Git path']).toBe('Git 路径');
    expect(zhCN['Store and manage application source code in NocoBase.']).toBe('在 NocoBase 中存储和管理应用源码。');
    expect(zhCN['Store and manage application source code in a Git repository.']).toBe(
      '在 Git 仓库中存储和管理应用源码。',
    );
    expect(zhCN['Used to generate the portal URL.']).toBe('用于生成门户访问地址。');
    expect(zhCN['Display name of the portal.']).toBe('门户显示名称。');
    expect(zhCN['Example:']).toBe('示例：');
    expect(zhCN['Directory inside the Git repository for this portal. Leave empty for the root.']).toBe(
      '该门户在 Git 仓库内的目录，留空表示仓库根目录。',
    );
    expect(zhCN['When disabled, this portal will not be registered or accessible.']).toBe(
      '关闭后，该门户将不会注册，也无法访问。',
    );
    expect(zhCN['The corresponding portal directory will also be deleted.']).toBe('对应的门户目录也会被删除。');
    expect(zhCN['Set as default']).toBe('设为默认');
    expect(zhCN['Default portal']).toBe('默认门户');
    expect(zhCN['Default portal updated successfully']).toBe('默认门户更新成功');
    expect(zhCN['Users enter this portal by default when they open the application without specifying one.']).toBe(
      '用户未指定门户访问应用时，将默认进入此门户。',
    );
    expect(zhCN['Use multiPortals:setDefault to update the default Portal']).toBe(
      '请使用 multiPortals:setDefault 更新默认门户',
    );
    expect(zhCN['filterByTk is required']).toBe('filterByTk 为必填项');
    expect(zhCN['Portal not found']).toBe('门户不存在');
    expect(zhCN['Disabled Portal cannot be set as default']).toBe('已禁用的门户不能设为默认');
    expect(zhCN['Portal device configuration is invalid']).toBe('门户设备配置无效');
    expect(zhCN['Unsupported Portal type cannot be set as default']).toBe('不支持的门户类型不能设为默认');
  });

  it('should fire resource.create with portal fields including uiLayoutUid', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await createMultiPortal({ resource, values: portalValues, onSubmitted });

    expect(resource.create).toHaveBeenCalledWith({ values: portalValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should set the explicit default through the dedicated action', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await setDefaultMultiPortal({ resource, filterByTk: 'customer-portal', onSubmitted });

    expect(resource.setDefault).toHaveBeenCalledWith({ filterByTk: 'customer-portal' });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should update the portal before setting it as default', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await updateMultiPortal({
      resource,
      filterByTk: 'customer-portal',
      values: portalValues,
      setAsDefault: true,
      onSubmitted,
    });

    expect(resource.update).toHaveBeenCalledWith({ filterByTk: 'customer-portal', values: portalValues });
    expect(resource.setDefault).toHaveBeenCalledWith({ filterByTk: 'customer-portal' });
    expect(vi.mocked(resource.update).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(resource.setDefault).mock.invocationCallOrder[0],
    );
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should render the portal gallery without permission or UI layout wording', async () => {
    const user = userEvent.setup();
    const multiPortalsResource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
            },
            {
              ...portalValues,
              title: 'Developer portal',
              uid: 'developer-portal',
              portalType: 'ai',
              portalName: 'developer-portal',
              routePath: '/developer-portal',
              uiLayoutUid: 'admin-layout-model',
            },
            {
              ...portalValues,
              title: 'Disabled portal',
              uid: 'disabled-portal',
              portalName: 'disabled-portal',
              routePath: '/disabled-portal',
              enabled: false,
              uiLayoutUid: 'admin-layout-model',
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

    render(
      <AntdApp>
        <MultiPortalsPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Customer portal')).toBeInTheDocument();
    expect(screen.queryByText('UID')).not.toBeInTheDocument();
    // 画廊按卡片组织，不再有表头，也不再单独铺一列 portal name。
    expect(screen.queryByText('Access path')).not.toBeInTheDocument();
    expect(screen.queryByText('customer-portal')).not.toBeInTheDocument();

    const noCodeAccessPathLink = screen.getByRole('link', { name: '/v/customer-portal' });
    expect(noCodeAccessPathLink).toHaveAttribute('href', '/v/customer-portal');
    expect(noCodeAccessPathLink).toHaveAttribute('target', '_blank');
    expect(noCodeAccessPathLink).toHaveAttribute('rel', 'noopener noreferrer');
    const aiAccessPathLink = screen.getByRole('link', { name: '/x/developer-portal' });
    expect(aiAccessPathLink).toHaveAttribute('href', '/x/developer-portal');
    expect(aiAccessPathLink).toHaveAttribute('target', '_blank');
    expect(aiAccessPathLink).toHaveAttribute('rel', 'noopener noreferrer');
    const customerPortalCard = screen.getByText('Customer portal').closest('.ant-card') as HTMLElement;
    const developerPortalCard = screen.getByText('Developer portal').closest('.ant-card') as HTMLElement;
    const disabledPortalCard = screen.getByText('Disabled portal').closest('.ant-card') as HTMLElement;
    expect(within(customerPortalCard).getByRole('switch', { name: 'Enabled' })).toBeChecked();
    expect(within(developerPortalCard).getByRole('switch', { name: 'Enabled' })).not.toBeDisabled();
    expect(within(disabledPortalCard).getByRole('switch', { name: 'Enabled' })).not.toBeDisabled();
    expect(within(disabledPortalCard).getByRole('switch', { name: 'Enabled' })).not.toBeChecked();

    // Open no longer takes an action slot: the card itself opens the portal, and the hover overlay on the tile is the same entry, reachable by keyboard.
    expect(within(customerPortalCard).getByRole('button', { name: 'View' })).toHaveClass('nb-portal-cover-overlay');
    const openInNewTab = vi.spyOn(window, 'open').mockImplementation(() => null);
    await user.click(within(customerPortalCard).getByText('Customer portal'));
    expect(openInNewTab).toHaveBeenCalledWith('/v/customer-portal', '_blank', 'noopener,noreferrer');
    openInNewTab.mockRestore();

    // AI portals have no visual routes and disabled ones cannot be entered, so the menu omits the entry in both cases.
    const customerMenu = await openCardMenu(user, customerPortalCard);
    expect(customerMenu.getByRole('menuitem', { name: /Routes/ })).toBeInTheDocument();
    expect(customerMenu.getByRole('menuitem', { name: /Set as default/ })).toBeInTheDocument();
    expect(customerMenu.queryByRole('menuitem', { name: /View/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    const developerMenu = await openCardMenu(user, developerPortalCard);
    expect(developerMenu.queryByRole('menuitem', { name: /Routes/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    const disabledMenu = await openCardMenu(user, disabledPortalCard);
    expect(disabledMenu.queryByRole('menuitem', { name: /Routes/ })).not.toBeInTheDocument();
    // Making a disabled portal the default would leave users landing on an entry they cannot open, so that is omitted too.
    expect(disabledMenu.queryByRole('menuitem', { name: /Set as default/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('button', { name: /Logs/ })).not.toBeInTheDocument();

    await clickCardMenuItem(user, customerPortalCard, 'Routes');
    expect(flowContext.current?.viewer.drawer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        closable: true,
        content: expect.any(Function),
        width: '80%',
      }),
    );
    await clickCardMenuItem(user, customerPortalCard, 'Set as default');
    expect(multiPortalsResource.setDefault).toHaveBeenCalledWith({ filterByTk: 'customer-portal' });
    await clickCardMenuItem(user, customerPortalCard, 'Delete');
    expect(await screen.findByText('Are you sure you want to delete it?')).toBeInTheDocument();
    expect(screen.getByText('The corresponding portal directory will also be deleted.')).toBeInTheDocument();

    // The portal type (AI / no-code) is carried by the group heading; cards no longer
    // hold a type tag. `t` is the identity function here, so keys render, not translations.
    expect(within(customerPortalCard).queryByText('No-code')).not.toBeInTheDocument();
    expect(screen.getByText('No-code')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    // The device icon is mapped directly from the fixed uiLayoutUid, with its wording in the aria-label.
    expect(within(customerPortalCard).getByLabelText('Mobile')).toHaveClass('anticon-mobile');
    expect(within(developerPortalCard).getByLabelText('Desktop')).toHaveClass('anticon-desktop');
    expect(within(disabledPortalCard).getByLabelText('Desktop')).toHaveClass('anticon-desktop');
    expect(screen.queryByText('UI layout')).not.toBeInTheDocument();
    expect(screen.queryByText(/permission/i)).not.toBeInTheDocument();
    expect(multiPortalsResource.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: ['createdAt'],
    });
  });

  it('should allow deleting default portals from the gallery', async () => {
    const user = userEvent.setup();
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              title: 'Admin',
              uid: '__default_portal__',
              isDefault: true,
              portalName: 'admin',
              routePath: '/admin',
              uiLayoutUid: 'admin-layout-model',
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
    const card = screen.getByText('Admin').closest('.ant-card') as HTMLElement;
    // The default portal gets a ribbon reading "Default". Badge.Ribbon wraps the card
    // from the outside, so the text lives in the card's parent, not in .ant-card.
    const cardWrapper = card.parentElement as HTMLElement;
    expect(within(cardWrapper).getByText('Default')).toBeInTheDocument();
    // Disabling the default portal would leave the app entry pointing nowhere, so the switch is greyed out.
    expect(within(card).getByRole('switch', { name: 'Enabled' })).toBeDisabled();

    // Already the default, so the menu drops "set as default"; delete stays available.
    const menu = await openCardMenu(user, card);
    expect(menu.queryByRole('menuitem', { name: /Set as default/ })).not.toBeInTheDocument();
    await user.click(menu.getByRole('menuitem', { name: /Delete/ }));
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
      await user.click((await screen.findAllByRole('button', { name: /Add portal/ }))[0]);
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

  it('should open create form without requesting enabled UI layouts', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    const request = vi.fn().mockResolvedValue({ data: { data: [] } });
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

    await user.click((await screen.findAllByRole('button', { name: /Add portal/ }))[0]);
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
    expect(within(dialog).getByText('Used to generate the portal URL.')).toBeInTheDocument();
    expect(within(dialog).getByText('Example: /x/<name>')).toBeInTheDocument();
    expect(within(dialog).getByText('Display name of the portal.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Development mode')).toBeInTheDocument();
    // 新建默认就是 AI mode，源码位置不再单独选，改由 git 地址填没填决定。
    expect(within(dialog).getByRole('radio', { name: /AI mode/ })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: /No-code mode/ })).not.toBeChecked();
    expect(within(dialog).getByText('Build complete business systems with AI agents and code.')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Users describe requirements in natural language, and AI agents create and modify applications, including interfaces, data models, business logic, roles and permissions, and more.',
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog)
        .getByRole('radio', { name: /No-code mode/ })
        .closest('label'),
    ).toHaveStyle('align-items: flex-start');
    // 源码管理默认 NocoBase，git 字段要选中 Git 才出现；AI mode 不暴露设备选择。
    expect(within(dialog).getByLabelText('Source management')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Select how the application source code is stored and managed.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Store and manage application source code in NocoBase.')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Store and manage application source code in a Git repository.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Git repository URL')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox', { name: 'Device' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: /No-code mode/ }));
    expect(within(dialog).getByText('Example: /v/<name>')).toBeInTheDocument();
    expect(within(dialog).getByText('Build business systems through visual configuration.')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Users create applications through drag-and-drop configuration. AI can assist with creating, adjusting, and optimizing configurations such as data models, interfaces, workflows, and more.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Source management')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Device')).toBeInTheDocument();
    expect(within(dialog).getByText('Cover')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Icon')).not.toBeRequired();
    expect(within(dialog).getByLabelText('Enabled')).toBeInTheDocument();
    expect(within(dialog).queryByText('Must start with /. For example: /portal.')).not.toBeInTheDocument();
    expect(
      within(dialog).getByText('When disabled, this portal will not be registered or accessible.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText('UI layout')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Routes permissions')).not.toBeInTheDocument();

    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'uiLayouts:listEnabled' }));
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'uiLayouts:list' }));
  });

  it('should expose only the two fixed device options and preserve the selected uid', async () => {
    const resource = makeResource();
    const { container, dialog, request, user } = await openCreatePortalForm(resource);

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    expect((await screen.findAllByText('Desktop')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Mobile')).toBeInTheDocument();
    expect(
      Array.from(document.querySelectorAll('.ant-select-item-option-content'), (node) => node.textContent),
    ).toEqual(['Desktop', 'Mobile']);
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
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'uiLayouts:listEnabled' }));
  });

  it('should select the admin layout uid by default when creating a portal', async () => {
    const resource = makeResource();
    const { dialog, user } = await openCreatePortalForm(resource);

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
          uiLayoutUid: 'admin-layout-model',
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

    await user.click((await screen.findAllByRole('button', { name: /Add portal/ }))[0]);
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    await user.click(within(dialog).getByRole('radio', { name: /No-code mode/ }));
    await user.type(within(dialog).getByLabelText('Title'), 'Admin portal');
    await user.type(within(dialog).getByLabelText('Portal name'), ' admin ');
    await user.type(within(dialog).getByLabelText('Icon'), 'homeoutlined');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile'));
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
          options: { cover: null },
        },
      });
    });
  });

  it('should submit explicit route name and portal type when creating a portal', async () => {
    const resource = makeResource();
    const { dialog, user } = await openCreatePortalForm(resource, { portalType: 'ai' });

    await user.type(within(dialog).getByLabelText('Title'), 'Developer portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'developer-portal');
    // 源码存储默认 NocoBase，git 相关字段要选中 Git 之后才出现。
    expect(within(dialog).getByLabelText('Source management')).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /NocoBase/ })).toBeChecked();
    expect(within(dialog).queryByLabelText('Git repository URL')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          portalType: 'ai',
          portalName: 'developer-portal',
          routePath: '/developer-portal',
          title: 'Developer portal',
          options: {
            cover: null,
            sourceStorage: 'nocobase',
          },
        }),
      });
    });
  });

  it('should submit git source storage options when creating an AI portal', async () => {
    const resource = makeResource();
    const { dialog, user } = await openCreatePortalForm(resource, { portalType: 'ai' });

    await user.click(within(dialog).getByRole('radio', { name: /^Git/ }));
    await user.type(within(dialog).getByLabelText('Git repository URL'), ' git@github.com:nocobase/customer.git ');
    await user.clear(within(dialog).getByLabelText('Git branch'));
    await user.clear(within(dialog).getByLabelText('Git path'));
    await user.clear(within(dialog).getByLabelText('Title'));
    await user.type(within(dialog).getByLabelText('Title'), 'Git portal');
    await user.clear(within(dialog).getByLabelText('Portal name'));
    await user.type(within(dialog).getByLabelText('Portal name'), 'git-portal');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          portalType: 'ai',
          portalName: 'git-portal',
          routePath: '/git-portal',
          title: 'Git portal',
          options: {
            cover: null,
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

  it('should fill the title and portal name from the git repository URL', async () => {
    const resource = makeResource();
    const { dialog, user } = await openCreatePortalForm(resource, { portalType: 'ai' });

    await user.click(within(dialog).getByRole('radio', { name: /^Git/ }));
    await user.type(within(dialog).getByLabelText('Git repository URL'), 'git@github.com:nocobase/customer-portal.git');

    await waitFor(() => {
      expect(within(dialog).getByLabelText('Title')).toHaveValue('Customer Portal');
    });
    expect(within(dialog).getByLabelText('Portal name')).toHaveValue('customer-portal');

    // 用户改过的名称不再被后续的地址变更覆盖。
    await user.clear(within(dialog).getByLabelText('Portal name'));
    await user.type(within(dialog).getByLabelText('Portal name'), 'my-portal');
    await user.clear(within(dialog).getByLabelText('Git repository URL'));
    await user.type(within(dialog).getByLabelText('Git repository URL'), 'git@github.com:nocobase/other.git');

    expect(within(dialog).getByLabelText('Portal name')).toHaveValue('my-portal');
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
          options: { cover: null },
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

    const editTargetCard = (await screen.findByRole('button', { name: 'More' })).closest('.ant-card') as HTMLElement;
    await clickCardMenuItem(user, editTargetCard, 'Edit');
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
          options: { cover: null },
        },
      });
    });
  });

  it('should expose the default portal setting in the edit form', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              isDefault: false,
              uiLayoutUid: 'mobile-layout-model',
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn(),
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

    const editTargetCard = (await screen.findByRole('button', { name: 'More' })).closest('.ant-card') as HTMLElement;
    await clickCardMenuItem(user, editTargetCard, 'Edit');
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    const defaultPortalSwitch = within(dialog).getByRole('switch', { name: 'Default portal' });
    expect(defaultPortalSwitch).toBeEnabled();
    expect(defaultPortalSwitch).not.toBeChecked();
    expect(
      within(dialog).getByText(
        'Users enter this portal by default when they open the application without specifying one.',
      ),
    ).toBeInTheDocument();

    await user.click(defaultPortalSwitch);
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: expect.objectContaining({
          title: 'Customer portal',
          enabled: true,
        }),
      });
      expect(resource.setDefault).toHaveBeenCalledWith({ filterByTk: 'customer-portal' });
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

    const editTargetCard = (await screen.findByRole('button', { name: 'More' })).closest('.ant-card') as HTMLElement;
    await clickCardMenuItem(user, editTargetCard, 'Edit');
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

    const editTargetCard = (await screen.findByRole('button', { name: 'More' })).closest('.ant-card') as HTMLElement;
    await clickCardMenuItem(user, editTargetCard, 'Edit');
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    expect(within(dialog).getByRole('radio', { name: /^Git/ })).toBeChecked();
    expect(within(dialog).getByLabelText('Git repository URL')).toHaveValue('git@github.com:nocobase/customer.git');
    expect(within(dialog).getByLabelText('Git branch')).toHaveValue('develop');
    expect(within(dialog).getByLabelText('Git path')).toHaveValue('portals/customer');
    expect(within(dialog).queryByRole('combobox', { name: 'Device' })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: expect.objectContaining({
          portalType: 'ai',
          uiLayoutUid: 'mobile-layout-model',
          options: {
            cover: null,
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

  it('should not resurrect a cleared git repository URL when reopening the edit form', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    // 源码已经切回 NocoBase，但记录上仍留着上一次的 git 配置。
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              portalType: 'ai',
              uiLayoutUid: 'admin-layout-model',
              options: {
                sourceStorage: 'nocobase',
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
        request: vi.fn().mockResolvedValue({ data: { data: [] } }),
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

    const editTargetCard = (await screen.findByRole('button', { name: 'More' })).closest('.ant-card') as HTMLElement;
    await clickCardMenuItem(user, editTargetCard, 'Edit');
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    expect(within(dialog).getByRole('radio', { name: /NocoBase/ })).toBeChecked();
    expect(within(dialog).queryByLabelText('Git repository URL')).not.toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('Title'));
    await user.type(within(dialog).getByLabelText('Title'), 'Renamed portal');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    // 只改了标题，源码存储不该被静默切回 git。
    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'customer-portal',
        values: expect.objectContaining({
          title: 'Renamed portal',
          options: expect.objectContaining({ sourceStorage: 'nocobase' }),
        }),
      });
    });
  });

  it('should hide the device and submit Desktop when creating an AI portal', async () => {
    const resource = makeResource();
    const { container, dialog, user } = await openCreatePortalForm(resource, {
      portalType: 'ai',
    });

    expect(within(dialog).queryByRole('combobox', { name: 'Device' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: /No-code mode/ }));
    expect(within(dialog).getByLabelText('Device')).toBeInTheDocument();
    await selectMobileLayout(container, user);
    await user.click(within(dialog).getByRole('radio', { name: /AI mode/ }));
    expect(within(dialog).queryByRole('combobox', { name: 'Device' })).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Title'), 'Agent portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'agent-portal');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({ portalType: 'ai', uiLayoutUid: 'admin-layout-model' }),
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
      expect(resource.update.mock.calls[0]?.[0].values).not.toHaveProperty('uiLayoutUid');
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
              uiLayoutUid: 'admin-layout-model',
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
          icon: null,
          portalType: 'no-code',
          enabled: false,
        },
      });
    });
  });

  it('should lock identity fields when editing and keep the legacy default uid layout immutable', async () => {
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
              uiLayoutUid: 'admin-layout-model',
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

    const editTargetCard = (await screen.findByRole('button', { name: 'More' })).closest('.ant-card') as HTMLElement;
    await clickCardMenuItem(user, editTargetCard, 'Edit');
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit portal' });
    // 门户名和类型建好之后就是身份（名字在访问路径里、类型决定 /v 还是 /x），编辑态一律锁死；
    // legacy default uid 的区别在于其余字段仍然可改。
    expect(within(dialog).getByLabelText('Portal name')).toBeDisabled();
    expect(within(dialog).getByLabelText('Development mode')).toBeDisabled();
    expect(within(dialog).getByLabelText('Enabled')).not.toBeDisabled();
    expect(within(dialog).getByLabelText('Device')).toBeDisabled();
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

    await user.click((await screen.findAllByRole('button', { name: /Add portal/ }))[0]);
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    await user.click(within(dialog).getByRole('radio', { name: /No-code mode/ }));
    await user.type(within(dialog).getByLabelText('Title'), 'Bad portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'foo.bar');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile'));
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

    await user.click((await screen.findAllByRole('button', { name: /Add portal/ }))[0]);
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    await user.click(within(dialog).getByRole('radio', { name: /No-code mode/ }));
    await user.type(within(dialog).getByLabelText('Title'), 'Duplicate portal');
    await user.type(within(dialog).getByLabelText('Portal name'), 'duplicate-portal');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile'));
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

    // 门户名只在新建时可填，所以校验也只能在新建抽屉里测。
    await user.click((await screen.findAllByRole('button', { name: /Add portal/ }))[0]);
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add portal' });
    const portalSlugInput = within(dialog).getByLabelText('Portal name');
    await user.clear(portalSlugInput);
    await user.type(portalSlugInput, 'Customer');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(
      await within(dialog).findByText(
        'Portal name can only contain lowercase letters, numbers, hyphens, and underscores',
      ),
    ).toBeInTheDocument();
    expect(resource.create).not.toHaveBeenCalled();
  });
});
