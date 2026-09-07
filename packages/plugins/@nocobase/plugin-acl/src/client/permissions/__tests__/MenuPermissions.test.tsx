/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor, within } from '@nocobase/test/client';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesManagerContext } from '../../RolesManagerProvider';
import { DesktopAllRoutesProvider, MenuPermissions } from '../MenuPermissions';

interface MockRoute {
  id: number;
  title: string;
  children?: MockRoute[];
}

interface RouteFilter {
  hidden?: {
    $ne: boolean;
  };
  'uiLayouts.uid'?: string;
}

interface DesktopRoutesListParams {
  filter?: RouteFilter;
}

interface RolesDesktopRoutesListRequest {
  resource?: string;
  resourceOf?: string;
  action?: string;
  params?: {
    paginate?: boolean;
    filter?: RouteFilter;
  };
}

type FunctionRequestService = () => Promise<{ data: MockRoute[] }>;
type RequestService = FunctionRequestService | RolesDesktopRoutesListRequest;

interface UseRequestOptions {
  onSuccess?: (data: { data: MockRoute[] }) => void;
}

const mocks = vi.hoisted(() => {
  const adminRoute = { id: 1, title: 'Admin route' };
  const portalRoute = { id: 2, title: 'Portal route' };

  return {
    adminRoute,
    portalRoute,
    desktopRoutesList: vi.fn(),
    refreshAllAccessDesktopRoutes: vi.fn(),
    rolesDesktopRoutesSet: vi.fn(),
    rolesDesktopRoutesAdd: vi.fn(),
    rolesDesktopRoutesRemove: vi.fn(),
    rolesListRequests: [] as RolesDesktopRoutesListRequest[],
    setRole: vi.fn(),
    selectedRoutes: [] as MockRoute[],
  };
});

vi.mock('@nocobase/client', async () => {
  const ReactModule = await import('react');

  return {
    css: () => 'menu-permissions-test-table',
    SchemaComponent: () => <div data-testid="schema-component" />,
    useAllAccessDesktopRoutes: () => ({
      refresh: mocks.refreshAllAccessDesktopRoutes,
    }),
    useAPIClient: () => ({
      resource: (name: string) => {
        if (name === 'desktopRoutes') {
          return {
            list: mocks.desktopRoutesList,
          };
        }

        if (name === 'roles.desktopRoutes') {
          return {
            add: mocks.rolesDesktopRoutesAdd,
            remove: mocks.rolesDesktopRoutesRemove,
            set: mocks.rolesDesktopRoutesSet,
          };
        }

        if (name === 'roles') {
          return {
            update: vi.fn(),
          };
        }

        return {};
      },
    }),
    useCompile: () => (value: string) => value,
    useRequest: (service: RequestService, options: UseRequestOptions = {}) => {
      const [data, setData] = ReactModule.useState<{ data: MockRoute[] }>();
      const serviceRef = ReactModule.useRef(service);
      const optionsRef = ReactModule.useRef(options);

      ReactModule.useEffect(() => {
        const service = serviceRef.current;

        if (typeof service !== 'function' && service?.resource === 'roles.desktopRoutes') {
          mocks.rolesListRequests.push(service);
          optionsRef.current.onSuccess?.({ data: mocks.selectedRoutes });
        }
      }, []);

      const runAsync = vi.fn(async () => {
        const service = serviceRef.current;

        if (typeof service === 'function') {
          const response = await service();
          setData(response);
          return response;
        }
      });

      if (typeof service === 'function') {
        return {
          data,
          loading: false,
          runAsync,
        };
      }

      return {
        loading: false,
        refresh: vi.fn(),
      };
    },
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (value: string) => value,
  }),
}));

const role = {
  allowConfigure: true,
  allowNewMenu: false,
  createdAt: '',
  default: false,
  description: '',
  hidden: false,
  name: 'member',
  snippets: [],
  strategy: {
    actions: [],
  },
  title: 'Member',
  updatedAt: '',
};

const renderMenuPermissions = () =>
  render(
    <App>
      <RolesManagerContext.Provider value={{ role, setRole: mocks.setRole }}>
        <DesktopAllRoutesProvider active>
          <MenuPermissions active />
        </DesktopAllRoutesProvider>
      </RolesManagerContext.Provider>
    </App>,
  );

describe('MenuPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rolesListRequests.length = 0;
    mocks.selectedRoutes = [];
    mocks.desktopRoutesList.mockImplementation(({ filter }) => {
      const routeList =
        filter?.['uiLayouts.uid'] === 'admin-layout-model' ? [mocks.adminRoute] : [mocks.adminRoute, mocks.portalRoute];

      return Promise.resolve({
        data: {
          data: routeList,
        },
      });
    });
  });

  it('filters desktop route sources by the default admin layout', async () => {
    renderMenuPermissions();

    await waitFor(() => {
      expect(mocks.desktopRoutesList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            hidden: { $ne: true },
            'uiLayouts.uid': 'admin-layout-model',
          },
        }),
      );
    });

    await waitFor(() => {
      expect(mocks.rolesListRequests).toContainEqual(
        expect.objectContaining({
          params: expect.objectContaining({
            filter: {
              hidden: { $ne: true },
              'uiLayouts.uid': 'admin-layout-model',
            },
          }),
        }),
      );
    });

    expect(await screen.findByText('Admin route')).toBeInTheDocument();
    expect(screen.queryByText('Portal route')).not.toBeInTheDocument();
  });

  it('selects all routes only from the filtered admin layout route list', async () => {
    renderMenuPermissions();

    expect(await screen.findByText('Admin route')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    await waitFor(() => {
      expect(mocks.rolesDesktopRoutesSet).toHaveBeenCalledWith({
        values: [mocks.adminRoute.id],
      });
    });
  });

  it('selects and saves every ancestor when a deeply nested route is checked', async () => {
    mocks.desktopRoutesList.mockResolvedValue({
      data: {
        data: [
          {
            id: 10,
            title: 'Root',
            children: [
              {
                id: 11,
                title: 'Group',
                children: [
                  { id: 12, title: 'Page', children: [{ id: 13, title: 'Tab' }] },
                  { id: 14, title: 'Sibling' },
                ],
              },
            ],
          },
        ],
      },
    });
    renderMenuPermissions();
    for (const name of ['Root', 'Group', 'Page']) {
      const row = (await screen.findByText(name)).closest('tr');
      fireEvent.click(within(row).getByRole('button', { name: 'Expand row' }));
    }
    fireEvent.click(within(screen.getByRole('row', { name: 'Tab', exact: true })).getByRole('checkbox'));

    await waitFor(() => {
      expect(mocks.rolesDesktopRoutesAdd).toHaveBeenCalledWith({ values: [13, 12, 11, 10] });
    });
    for (const name of ['Root', 'Group', 'Page', 'Tab']) {
      expect(within(screen.getByText(name).closest('tr')).getByRole('checkbox')).toBeChecked();
    }
    expect(within(screen.getByText('Sibling').closest('tr')).getByRole('checkbox')).not.toBeChecked();
  });

  it('does not add already accessible descendants again when checking their parent', async () => {
    const child = { id: 11, title: 'Child' };
    mocks.selectedRoutes = [child];
    mocks.desktopRoutesList.mockResolvedValue({
      data: { data: [{ id: 10, title: 'Root', children: [child, { id: 12, title: 'Other child' }] }] },
    });
    renderMenuPermissions();
    const row = (await screen.findByText('Root')).closest('tr');
    fireEvent.click(within(row).getByRole('checkbox'));

    await waitFor(() => {
      expect(mocks.rolesDesktopRoutesAdd).toHaveBeenCalledWith({ values: [10, 12] });
    });
  });
});
