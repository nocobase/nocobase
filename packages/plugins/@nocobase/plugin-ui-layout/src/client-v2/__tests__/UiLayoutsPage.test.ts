/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp } from 'antd';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import UiLayoutsPage, {
  completeUiLayoutFormValues,
  createUiLayout,
  deleteUiLayouts,
  getLayoutTypeTagColor,
  getRouteNameFromRoutePath,
  getUiLayoutRouteUrl,
  isDefaultAdminUiLayout,
  isUiLayoutRoutePathFormatValid,
  type UiLayoutFormValues,
  type UiLayoutRecord,
  type UiLayoutResource,
  updateUiLayoutEnabled,
  updateUiLayout,
} from '../pages/UiLayoutsPage';

const flowContext = vi.hoisted(() => ({
  current: undefined as
    | {
        api: {
          request: ReturnType<typeof vi.fn>;
          resource: ReturnType<typeof vi.fn>;
        };
        app: Record<string, unknown>;
        viewer: {
          drawer: ReturnType<typeof vi.fn>;
        };
      }
    | undefined,
}));

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
    useFlowContext: () => flowContext.current,
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    DrawerFormLayout: (props: { children: React.ReactNode; title: string; onSubmit: () => void; submitText: string }) =>
      ReactModule.createElement(
        'div',
        { role: 'dialog', 'aria-label': props.title },
        props.children,
        ReactModule.createElement('button', { type: 'button', onClick: props.onSubmit }, props.submitText),
      ),
  };
});

const formValues: UiLayoutFormValues = {
  title: 'Operations layout',
  uid: 'desktop-layout',
  layoutType: 'desktop',
  routeName: 'adminDesktop',
  routePath: '/admin',
  authCheck: true,
  enabled: true,
};

const uiLayoutRecord: UiLayoutRecord = {
  id: 42,
  ...formValues,
};

function makeResource(overrides: Partial<UiLayoutResource> = {}): UiLayoutResource {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  flowContext.current = undefined;
});

describe('plugin-ui-layout submit pipeline', () => {
  it('should fire resource.create with the form values', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await createUiLayout({ resource, values: formValues, onSubmitted });

    expect(resource.create).toHaveBeenCalledTimes(1);
    expect(resource.create).toHaveBeenCalledWith({ values: formValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onSubmitted when resource.create rejects', async () => {
    const resource = makeResource({ create: vi.fn().mockRejectedValue(new Error('boom')) });
    const onSubmitted = vi.fn();

    await expect(createUiLayout({ resource, values: formValues, onSubmitted })).rejects.toThrow(/boom/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should fire resource.update with the numeric id as filterByTk on edit', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await updateUiLayout({ resource, filterByTk: 42, values: formValues, onSubmitted });

    expect(resource.update).toHaveBeenCalledTimes(1);
    expect(resource.update).toHaveBeenCalledWith({ filterByTk: 42, values: formValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onSubmitted when resource.update rejects', async () => {
    const resource = makeResource({ update: vi.fn().mockRejectedValue(new Error('nope')) });
    const onSubmitted = vi.fn();

    await expect(updateUiLayout({ resource, filterByTk: 1, values: formValues, onSubmitted })).rejects.toThrow(/nope/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should update enabled from the row switch', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await updateUiLayoutEnabled({ resource, record: uiLayoutRecord, enabled: false, onSubmitted });

    expect(resource.update).toHaveBeenCalledTimes(1);
    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 42,
      values: {
        ...formValues,
        enabled: false,
      },
    });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onSubmitted when enabled update rejects', async () => {
    const resource = makeResource({ update: vi.fn().mockRejectedValue(new Error('switch failed')) });
    const onSubmitted = vi.fn();

    await expect(
      updateUiLayoutEnabled({ resource, record: uiLayoutRecord, enabled: false, onSubmitted }),
    ).rejects.toThrow(/switch failed/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should fire resource.destroy with the numeric id as filterByTk on row delete', async () => {
    const resource = makeResource();
    const onDeleted = vi.fn();

    await deleteUiLayouts({ resource, filterByTk: 42, onDeleted });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: 42 });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('should fire resource.destroy with selected ids on batch delete', async () => {
    const resource = makeResource();
    const onDeleted = vi.fn();

    await deleteUiLayouts({ resource, filterByTk: [42, 43], onDeleted });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: [42, 43] });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onDeleted when resource.destroy rejects', async () => {
    const resource = makeResource({ destroy: vi.fn().mockRejectedValue(new Error('delete failed')) });
    const onDeleted = vi.fn();

    await expect(deleteUiLayouts({ resource, filterByTk: 1, onDeleted })).rejects.toThrow(/delete failed/);
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

describe('plugin-ui-layout settings page', () => {
  it('should keep using uiLayouts:list as the management list API', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    flowContext.current = {
      api: {
        request,
        resource: vi.fn(() => makeResource()),
      },
      app: {},
      viewer: {
        drawer: vi.fn(),
      },
    };

    render(React.createElement(AntdApp, null, React.createElement(UiLayoutsPage)));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: 'uiLayouts:list',
        method: 'get',
        params: {
          pageSize: 20,
          sort: ['id'],
        },
        skipNotify: true,
      });
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'uiLayouts:listAccessible',
      }),
    );
  });

  it('should expose table controls and row actions to keyboard and assistive tech', async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            ...uiLayoutRecord,
            id: 1,
            title: 'Desktop layout',
            uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
            routePath: '/admin',
          },
          {
            ...uiLayoutRecord,
            id: 2,
            title: 'Mobile layout',
            uid: 'mobile-layout',
            layoutType: 'mobile',
            routePath: '/mobile',
          },
        ],
      },
    });
    const drawer = vi.fn();
    flowContext.current = {
      api: {
        request,
        resource: vi.fn(() => makeResource()),
      },
      app: {},
      viewer: {
        drawer,
      },
    };

    render(React.createElement(AntdApp, null, React.createElement(UiLayoutsPage)));

    const desktopTitleCell = (await screen.findAllByText('Desktop layout')).find(
      (element) => element.closest('td')?.tagName === 'TD',
    );
    const mobileTitleCell = screen
      .getAllByText('Mobile layout')
      .find((element) => element.closest('td')?.tagName === 'TD');
    const desktopRow = desktopTitleCell?.closest('tr');
    const mobileRow = mobileTitleCell?.closest('tr');

    expect(desktopRow).not.toBeNull();
    expect(mobileRow).not.toBeNull();
    expect(within(desktopRow as HTMLTableRowElement).getByRole('switch', { name: 'Enabled' })).toBeChecked();
    expect(within(mobileRow as HTMLTableRowElement).getByRole('link', { name: /View/ })).toHaveAttribute(
      'href',
      '/mobile',
    );

    const defaultDelete = within(desktopRow as HTMLTableRowElement).getByRole('button', { name: /Delete/ });
    expect(defaultDelete).toBeDisabled();

    const editButton = within(mobileRow as HTMLTableRowElement).getByRole('button', { name: /Edit/ });
    editButton.focus();
    expect(editButton).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(drawer).toHaveBeenCalledWith(
        expect.objectContaining({
          closable: true,
          content: expect.any(Function),
        }),
      );
    });

    const drawerContent = drawer.mock.calls[0][0].content();
    render(React.createElement(AntdApp, null, drawerContent));

    expect(screen.getByLabelText('UID')).toBeDisabled();
  });
});

describe('plugin-ui-layout form values', () => {
  it('should require access path to start with slash', () => {
    expect(isUiLayoutRoutePathFormatValid('/admin')).toBe(true);
    expect(isUiLayoutRoutePathFormatValid('/foo')).toBe(true);
    expect(isUiLayoutRoutePathFormatValid(' /mobile ')).toBe(true);
    expect(isUiLayoutRoutePathFormatValid('admin')).toBe(false);
    expect(isUiLayoutRoutePathFormatValid('/foo.bar')).toBe(false);
  });

  it('should derive route name from the access path', () => {
    expect(getRouteNameFromRoutePath('/admin')).toBe('admin');
    expect(getRouteNameFromRoutePath('mobile')).toBe('mobile');
    expect(getRouteNameFromRoutePath('/mobile/pages?tab=main')).toBe('mobile');
  });

  it('should complete submit values with the derived route name', () => {
    expect(
      completeUiLayoutFormValues({
        title: ' Mobile workspace ',
        uid: 'mobile-layout',
        layoutType: 'mobile',
        routePath: ' /mobile ',
        authCheck: true,
        enabled: true,
      }),
    ).toEqual({
      title: 'Mobile workspace',
      uid: 'mobile-layout',
      layoutType: 'mobile',
      routeName: 'mobile',
      routePath: '/mobile',
      authCheck: true,
      enabled: true,
    });
  });

  it('should reject access paths that derive route names with dots', () => {
    expect(getRouteNameFromRoutePath('/foo.bar')).toBe('foo.bar');
    expect(() =>
      completeUiLayoutFormValues({
        title: 'Mobile workspace',
        uid: 'mobile-layout',
        layoutType: 'mobile',
        routePath: '/foo.bar',
        authCheck: true,
        enabled: true,
      }),
    ).toThrow('Route name cannot contain dots');
  });
});

describe('plugin-ui-layout layout type tag', () => {
  it('should return different tag colors for built-in layout types', () => {
    expect(getLayoutTypeTagColor('desktop')).toBe('blue');
    expect(getLayoutTypeTagColor('mobile')).toBe('purple');
    expect(getLayoutTypeTagColor('custom')).toBe('default');
  });
});

describe('plugin-ui-layout default layout', () => {
  it('should identify the default AdminLayout record', () => {
    expect(isDefaultAdminUiLayout({ ...uiLayoutRecord, uid: DEFAULT_ADMIN_UI_LAYOUT.uid })).toBe(true);
    expect(isDefaultAdminUiLayout(uiLayoutRecord)).toBe(false);
  });
});

describe('plugin-ui-layout route URL', () => {
  it('should build route URL from router basename', () => {
    expect(
      getUiLayoutRouteUrl(
        {
          router: {
            getBasename: () => '/v2/apps/app1',
          },
        },
        '/admin',
      ),
    ).toBe('/v2/apps/app1/admin');
  });

  it('should fall back to app route URL', () => {
    expect(
      getUiLayoutRouteUrl(
        {
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
        '/mobile',
      ),
    ).toBe('/v2/mobile');
  });

  it('should keep absolute URLs unchanged', () => {
    expect(getUiLayoutRouteUrl(undefined, 'https://www.nocobase.com/docs')).toBe('https://www.nocobase.com/docs');
  });
});
