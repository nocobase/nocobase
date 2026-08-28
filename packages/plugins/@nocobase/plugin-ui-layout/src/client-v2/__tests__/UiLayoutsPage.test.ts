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

  it('should fire resource.update with the uid as filterByTk on edit', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await updateUiLayout({ resource, filterByTk: 'desktop-layout', values: formValues, onSubmitted });

    expect(resource.update).toHaveBeenCalledTimes(1);
    expect(resource.update).toHaveBeenCalledWith({ filterByTk: 'desktop-layout', values: formValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onSubmitted when resource.update rejects', async () => {
    const resource = makeResource({ update: vi.fn().mockRejectedValue(new Error('nope')) });
    const onSubmitted = vi.fn();

    await expect(
      updateUiLayout({ resource, filterByTk: 'desktop-layout', values: formValues, onSubmitted }),
    ).rejects.toThrow(/nope/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should update enabled from the row switch', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();
    const publicLayoutRecord = {
      ...uiLayoutRecord,
      authCheck: false,
    };

    await updateUiLayoutEnabled({
      resource,
      record: publicLayoutRecord,
      enabled: false,
      onSubmitted,
    });

    expect(resource.update).toHaveBeenCalledTimes(1);
    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 'desktop-layout',
      values: {
        ...publicLayoutRecord,
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

  it('should fire resource.destroy with the uid as filterByTk on row delete', async () => {
    const resource = makeResource();
    const onDeleted = vi.fn();

    await deleteUiLayouts({ resource, filterByTk: 'desktop-layout', onDeleted });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: 'desktop-layout' });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('should fire resource.destroy with selected uids on batch delete', async () => {
    const resource = makeResource();
    const onDeleted = vi.fn();

    await deleteUiLayouts({ resource, filterByTk: ['desktop-layout', 'mobile-layout'], onDeleted });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: ['desktop-layout', 'mobile-layout'] });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onDeleted when resource.destroy rejects', async () => {
    const resource = makeResource({ destroy: vi.fn().mockRejectedValue(new Error('delete failed')) });
    const onDeleted = vi.fn();

    await expect(deleteUiLayouts({ resource, filterByTk: 'desktop-layout', onDeleted })).rejects.toThrow(
      /delete failed/,
    );
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
          page: 1,
          pageSize: 20,
          sort: ['uid'],
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

  it('should request the selected page when table pagination changes', async () => {
    const user = userEvent.setup();
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          data: Array.from({ length: 20 }, (_, index) => ({
            ...uiLayoutRecord,
            title: `Layout ${index + 1}`,
            uid: `layout-${index + 1}`,
          })),
          meta: {
            count: 21,
            page: 1,
            pageSize: 20,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [{ ...uiLayoutRecord, title: 'Layout 21', uid: 'layout-21' }],
          meta: {
            count: 21,
            page: 2,
            pageSize: 20,
          },
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

    expect(await screen.findByText('Layout 1')).toBeInTheDocument();
    await user.click(screen.getByTitle('2'));

    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith({
        url: 'uiLayouts:list',
        method: 'get',
        params: {
          page: 2,
          pageSize: 20,
          sort: ['uid'],
        },
        skipNotify: true,
      });
    });
    expect(await screen.findByText('Layout 21')).toBeInTheDocument();
  });

  it('should open the create layout menu on click', async () => {
    const user = userEvent.setup();
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

    const addButton = await screen.findByRole('button', { name: /Add UI layout/ });
    expect(addButton).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(addButton);

    expect(await screen.findByRole('menuitem', { name: 'Desktop layout' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Mobile layout' })).toBeInTheDocument();
  });

  it('should expose table controls and row actions to keyboard and assistive tech', async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            ...uiLayoutRecord,
            title: 'Desktop layout',
            uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
            routePath: '/admin',
          },
          {
            ...uiLayoutRecord,
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
    expect(screen.queryByRole('columnheader', { name: 'Auth check' })).not.toBeInTheDocument();
    const mobileTitleCell = screen
      .getAllByText('Mobile layout')
      .find((element) => element.closest('td')?.tagName === 'TD');
    const desktopRow = desktopTitleCell?.closest('tr');
    const mobileRow = mobileTitleCell?.closest('tr');

    expect(desktopRow).not.toBeNull();
    expect(mobileRow).not.toBeNull();
    const defaultEnabledSwitch = within(desktopRow as HTMLTableRowElement).getByRole('switch', { name: 'Enabled' });
    expect(defaultEnabledSwitch).toBeChecked();
    expect(defaultEnabledSwitch).toBeDisabled();
    expect(defaultEnabledSwitch).toHaveClass('ant-switch-small');
    expect(within(mobileRow as HTMLTableRowElement).getByRole('link', { name: /View/ })).toHaveAttribute(
      'href',
      '/mobile',
    );

    const defaultDelete = within(desktopRow as HTMLTableRowElement).getByRole('button', { name: /Delete/ });
    expect(defaultDelete).toBeDisabled();

    const defaultEditButton = within(desktopRow as HTMLTableRowElement).getByRole('button', { name: /Edit/ });
    await user.click(defaultEditButton);

    await waitFor(() => {
      expect(drawer).toHaveBeenCalledWith(
        expect.objectContaining({
          closable: true,
          content: expect.any(Function),
        }),
      );
    });

    const defaultDrawerContent = drawer.mock.calls[0][0].content();
    const defaultDrawer = render(React.createElement(AntdApp, null, defaultDrawerContent));
    expect(within(defaultDrawer.container).getByLabelText('UID')).toBeDisabled();
    expect(within(defaultDrawer.container).getByLabelText('Access path')).toBeDisabled();
    expect(within(defaultDrawer.container).queryByLabelText('Auth check')).not.toBeInTheDocument();
    expect(within(defaultDrawer.container).getByLabelText('Enabled')).toBeDisabled();
    defaultDrawer.unmount();
    drawer.mockClear();

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
    const mobileDrawer = render(React.createElement(AntdApp, null, drawerContent));

    expect(within(mobileDrawer.container).getByLabelText('UID')).toBeDisabled();
    expect(within(mobileDrawer.container).getByLabelText('Access path')).not.toBeDisabled();
    expect(within(mobileDrawer.container).queryByLabelText('Auth check')).not.toBeInTheDocument();
    expect(within(mobileDrawer.container).getByLabelText('Enabled')).not.toBeDisabled();
  });

  it('should create layouts with auth check enabled without exposing the field', async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    });
    const resource = makeResource();
    const drawer = vi.fn();
    flowContext.current = {
      api: {
        request,
        resource: vi.fn(() => resource),
      },
      app: {},
      viewer: {
        drawer,
      },
    };

    render(React.createElement(AntdApp, null, React.createElement(UiLayoutsPage)));

    await user.click(await screen.findByRole('button', { name: /Add UI layout/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Desktop layout' }));

    await waitFor(() => {
      expect(drawer).toHaveBeenCalledWith(expect.objectContaining({ content: expect.any(Function) }));
    });

    const drawerContent = drawer.mock.calls[0][0].content();
    const createDrawer = render(React.createElement(AntdApp, null, drawerContent));

    expect(within(createDrawer.container).queryByLabelText('Auth check')).not.toBeInTheDocument();
    await user.type(within(createDrawer.container).getByLabelText('Title'), 'Operations layout');
    await user.type(within(createDrawer.container).getByLabelText('Access path'), '/operations');
    await user.click(within(createDrawer.container).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          title: 'Operations layout',
          uid: 'ui-layout-random-id',
          layoutType: 'desktop',
          routeName: 'operations',
          routePath: '/operations',
          authCheck: true,
          enabled: true,
        }),
      });
    });

    createDrawer.unmount();
  });

  it('should preserve auth check when updating layouts without exposing the field', async () => {
    const user = userEvent.setup();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            ...uiLayoutRecord,
            title: 'Mobile layout',
            uid: 'mobile-layout',
            layoutType: 'mobile',
            routePath: '/mobile',
            authCheck: false,
          },
        ],
      },
    });
    const resource = makeResource();
    const drawer = vi.fn();
    flowContext.current = {
      api: {
        request,
        resource: vi.fn(() => resource),
      },
      app: {},
      viewer: {
        drawer,
      },
    };

    render(React.createElement(AntdApp, null, React.createElement(UiLayoutsPage)));

    const mobileTitleCell = (await screen.findAllByText('Mobile layout')).find(
      (element) => element.closest('td')?.tagName === 'TD',
    );
    const mobileRow = mobileTitleCell?.closest('tr');
    expect(mobileRow).not.toBeNull();

    await user.click(within(mobileRow as HTMLTableRowElement).getByRole('button', { name: /Edit/ }));

    await waitFor(() => {
      expect(drawer).toHaveBeenCalledWith(expect.objectContaining({ content: expect.any(Function) }));
    });

    const drawerContent = drawer.mock.calls[0][0].content();
    const editDrawer = render(React.createElement(AntdApp, null, drawerContent));

    expect(within(editDrawer.container).queryByLabelText('Auth check')).not.toBeInTheDocument();
    await user.clear(within(editDrawer.container).getByLabelText('Title'));
    await user.type(within(editDrawer.container).getByLabelText('Title'), 'Updated mobile layout');
    await user.click(within(editDrawer.container).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'mobile-layout',
        values: expect.objectContaining({
          title: 'Updated mobile layout',
          uid: 'mobile-layout',
          layoutType: 'mobile',
          routeName: 'mobile',
          routePath: '/mobile',
          authCheck: false,
          enabled: true,
        }),
      });
    });

    editDrawer.unmount();
  });
});

describe('plugin-ui-layout form values', () => {
  it('should require access path to start with slash', () => {
    expect(isUiLayoutRoutePathFormatValid('/admin')).toBe(true);
    expect(isUiLayoutRoutePathFormatValid('/foo')).toBe(true);
    expect(isUiLayoutRoutePathFormatValid(' /mobile ')).toBe(true);
    expect(isUiLayoutRoutePathFormatValid('admin')).toBe(false);
    expect(isUiLayoutRoutePathFormatValid('/foo.bar')).toBe(false);
    expect(isUiLayoutRoutePathFormatValid('/')).toBe(false);
    expect(isUiLayoutRoutePathFormatValid('/*')).toBe(false);
    expect(isUiLayoutRoutePathFormatValid('/mobile/*')).toBe(false);
    expect(isUiLayoutRoutePathFormatValid('/mobile?tab=main')).toBe(false);
    expect(isUiLayoutRoutePathFormatValid('/mobile#main')).toBe(false);
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

  it('should preserve explicit auth check values when completing form values', () => {
    expect(
      completeUiLayoutFormValues({
        title: 'Public-looking layout',
        uid: 'public-layout',
        layoutType: 'desktop',
        routePath: '/public',
        authCheck: false,
        enabled: true,
      }),
    ).toEqual({
      title: 'Public-looking layout',
      uid: 'public-layout',
      layoutType: 'desktop',
      routeName: 'public',
      routePath: '/public',
      authCheck: false,
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

  it('should reject unsupported access paths before submit', () => {
    expect(() =>
      completeUiLayoutFormValues({
        title: 'Root layout',
        uid: 'root-layout',
        layoutType: 'desktop',
        routePath: '/',
        authCheck: true,
        enabled: true,
      }),
    ).toThrow('Access path cannot be /');

    expect(() =>
      completeUiLayoutFormValues({
        title: 'Wildcard layout',
        uid: 'wildcard-layout',
        layoutType: 'desktop',
        routePath: '/mobile/*',
        authCheck: true,
        enabled: true,
      }),
    ).toThrow('Access path cannot contain wildcard');

    expect(() =>
      completeUiLayoutFormValues({
        title: 'Query layout',
        uid: 'query-layout',
        layoutType: 'desktop',
        routePath: '/mobile?tab=main',
        authCheck: true,
        enabled: true,
      }),
    ).toThrow('Access path cannot contain query or hash');

    expect(() =>
      completeUiLayoutFormValues({
        title: 'Hash layout',
        uid: 'hash-layout',
        layoutType: 'desktop',
        routePath: '/mobile#main',
        authCheck: true,
        enabled: true,
      }),
    ).toThrow('Access path cannot contain query or hash');
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
