/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const viewport = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    // antd Grid breakpoint (drives isMobileViewport) and ProLayout's RouteContext.isMobile (drives isMobileLayout).
    breakpointIsMobile: false,
    proLayoutIsMobile: false,
    menuItemCount: 0,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next: { breakpointIsMobile?: boolean; proLayoutIsMobile?: boolean }) {
      Object.assign(this, next);
      listeners.forEach((listener) => listener());
    },
  };
});

const useViewportValue = (key: 'breakpointIsMobile' | 'proLayoutIsMobile') =>
  React.useSyncExternalStore(
    (listener) => viewport.subscribe(listener),
    () => viewport[key],
  );

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ md: !useViewportValue('breakpointIsMobile') }),
    },
  };
});

vi.mock('@ant-design/pro-layout', async () => {
  const ReactModule = await import('react');
  const RouteContext = ReactModule.createContext({ isMobile: false });
  const ProLayoutMock = (props: { children?: React.ReactNode; route?: { children?: unknown[] } }) => {
    const isMobile = useViewportValue('proLayoutIsMobile');
    viewport.menuItemCount = props.route?.children?.length || 0;
    return ReactModule.createElement(RouteContext.Provider, { value: { isMobile } }, props.children);
  };

  return {
    default: ProLayoutMock,
    RouteContext,
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    useApplications: () => ({ appList: [] }),
    useAppListRender: () => undefined,
    useSystemSettings: () => ({ loading: false, data: { data: { title: 'NocoBase' } } }),
  };
});

vi.mock('../../../../plugin-manager', () => ({
  PinnedPluginList: () => null,
}));

import { ADMIN_LAYOUT_MODEL_UID } from '@nocobase/client-v2';
import { SchemaComponentContext } from '../../../../schema-component/context';
import { AdminLayoutComponent } from '../AdminLayoutComponentV1';
import { AdminLayoutModelV1 } from '../AdminLayoutModel';

async function renderLayoutInUIEditorMode() {
  const engine = new FlowEngine();
  engine.context.defineProperty('routeRepository', {
    value: {
      listAccessible: () => [],
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    },
  });
  engine.createModel<AdminLayoutModelV1>({
    uid: ADMIN_LAYOUT_MODEL_UID,
    use: AdminLayoutModelV1,
  });
  await engine.flowSettings.enable();

  const router = createMemoryRouter([{ path: '/admin/*', element: <AdminLayoutComponent /> }], {
    initialEntries: ['/admin/page'],
  });

  render(
    <FlowEngineProvider engine={engine}>
      <SchemaComponentContext.Provider value={{ designable: true }}>
        <RouterProvider router={router} />
      </SchemaComponentContext.Provider>
    </FlowEngineProvider>,
  );

  return engine;
}

// With no accessible routes, the only menu node in UI editor mode is the "Add menu item" initializer.
async function expectUIEditorEnabled(engine: FlowEngine, enabled: boolean) {
  await waitFor(() => {
    expect(engine.flowSettings.enabled).toBe(enabled);
    expect(viewport.menuItemCount).toBe(enabled ? 1 : 0);
  });
}

describe('AdminLayoutComponentV1 flow settings', () => {
  beforeEach(() => {
    viewport.breakpointIsMobile = false;
    viewport.proLayoutIsMobile = false;
    viewport.menuItemCount = 0;
  });

  it('restores the UI editor after the viewport goes from mobile back to desktop', async () => {
    const engine = await renderLayoutInUIEditorMode();
    await expectUIEditorEnabled(engine, true);

    act(() => {
      viewport.set({ breakpointIsMobile: true, proLayoutIsMobile: true });
    });
    await expectUIEditorEnabled(engine, false);

    act(() => {
      viewport.set({ breakpointIsMobile: false, proLayoutIsMobile: false });
    });
    await expectUIEditorEnabled(engine, true);
  });

  it('follows the ProLayout mobile layout even when the breakpoint stays desktop', async () => {
    const engine = await renderLayoutInUIEditorMode();
    await expectUIEditorEnabled(engine, true);

    act(() => {
      viewport.set({ proLayoutIsMobile: true });
    });
    await expectUIEditorEnabled(engine, false);

    act(() => {
      viewport.set({ proLayoutIsMobile: false });
    });
    await expectUIEditorEnabled(engine, true);
  });
});
