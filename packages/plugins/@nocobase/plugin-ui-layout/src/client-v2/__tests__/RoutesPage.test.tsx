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
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ADMIN_UI_LAYOUT, DEFAULT_MOBILE_UI_LAYOUT } from '../../constants';
import RoutesPage from '../pages/RoutesPage';

const flowContext = vi.hoisted(() => ({
  current: undefined as
    | {
        api: {
          request: ReturnType<typeof vi.fn>;
          resource: ReturnType<typeof vi.fn>;
        };
        message: {
          success: ReturnType<typeof vi.fn>;
        };
      }
    | undefined,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    randomId: () => 'generated-route-schema-uid',
    useFlowEngine: () => ({
      context: {
        t: (key: string, options?: Record<string, unknown>) =>
          key.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? '')),
      },
    }),
    useFlowContext: () => flowContext.current,
  };
});

afterEach(() => {
  cleanup();
  flowContext.current = undefined;
});

describe('plugin-ui-layout RoutesPage', () => {
  it('should list and mutate desktopRoutes with the selected layout parameter', async () => {
    const resource = createRoutesPageResources();
    flowContext.current = resource.context;

    render(
      <AntdApp>
        <RoutesPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(resource.request).toHaveBeenCalledWith({
        url: '/desktopRoutes:listAccessible',
        method: 'get',
        params: {
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
          paginate: false,
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
      });
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Mobile routes' }));
    expect(await screen.findByText('Mobile workbench')).toBeInTheDocument();
    await waitFor(() => {
      expect(resource.request).toHaveBeenCalledWith({
        url: '/desktopRoutes:listAccessible',
        method: 'get',
        params: {
          layout: DEFAULT_MOBILE_UI_LAYOUT.uid,
          paginate: false,
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Add route/ }));
    const addDialog = await screen.findByRole('dialog', { name: 'Add route' });
    fireEvent.change(within(addDialog).getByLabelText('Title'), { target: { value: 'Mobile approvals' } });
    fireEvent.click(within(addDialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        layout: DEFAULT_MOBILE_UI_LAYOUT.uid,
        values: expect.objectContaining({
          schemaUid: 'generated-route-schema-uid',
          title: 'Mobile approvals',
          type: 'flowPage',
        }),
      });
    });
    expect(await screen.findByText('Mobile approvals')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Desktop routes' }));
    expect(await screen.findByText('Desktop dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Mobile approvals')).not.toBeInTheDocument();

    const desktopRow = screen.getByRole('row', { name: /Desktop dashboard/ });
    fireEvent.click(within(desktopRow).getByRole('button', { name: 'Edit route Desktop dashboard' }));
    const editDialog = await screen.findByRole('dialog', { name: 'Edit route' });
    fireEvent.change(within(editDialog).getByLabelText('Title'), { target: { value: 'Desktop home' } });
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 1,
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        values: expect.objectContaining({
          title: 'Desktop home',
        }),
      });
    });
    expect(await screen.findByText('Desktop home')).toBeInTheDocument();
  });
});

function createRoutesPageResources() {
  const routesByLayout = new Map<string, Array<Record<string, unknown>>>([
    [
      DEFAULT_ADMIN_UI_LAYOUT.uid,
      [
        {
          id: 1,
          schemaUid: 'desktop-dashboard',
          title: 'Desktop dashboard',
          type: 'flowPage',
        },
      ],
    ],
    [
      DEFAULT_MOBILE_UI_LAYOUT.uid,
      [
        {
          id: 2,
          schemaUid: 'mobile-workbench',
          title: 'Mobile workbench',
          type: 'flowPage',
        },
      ],
    ],
  ]);

  const getRoutes = (layout: unknown) => routesByLayout.get(String(layout)) ?? [];
  const request = vi.fn(async ({ params }: { params?: Record<string, unknown> }) => ({
    data: {
      data: getRoutes(params?.layout).map((route) => ({ ...route })),
    },
  }));
  const create = vi.fn(async ({ layout, values }: { layout: string; values: Record<string, unknown> }) => {
    const routes = getRoutes(layout);
    routes.push({
      ...values,
      id: 10 + routes.length,
    });
  });
  const update = vi.fn(
    async ({ filterByTk, layout, values }: { filterByTk: number; layout: string; values: Record<string, unknown> }) => {
      const routes = getRoutes(layout);
      const route = routes.find((item) => item.id === filterByTk);
      if (route) {
        Object.assign(route, values);
      }
    },
  );
  const destroy = vi.fn();
  const resource = vi.fn((name: string) => {
    if (name === 'desktopRoutes') {
      return {
        create,
        destroy,
        update,
      };
    }
    throw new Error(`Unexpected resource: ${name}`);
  });
  const success = vi.fn();

  return {
    context: {
      api: {
        request,
        resource,
      },
      message: {
        success,
      },
    },
    create,
    destroy,
    request,
    resource,
    success,
    update,
  };
}
