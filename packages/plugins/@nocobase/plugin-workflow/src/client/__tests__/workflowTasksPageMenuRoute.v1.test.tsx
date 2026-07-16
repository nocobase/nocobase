/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import {
  createMemoryRouter,
  MemoryRouter,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  UNSAFE_RouteContext,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  useWorkflowTasksPageMenuRouteAdapter,
  WorkflowTasksPageMenuItemRouteScope,
  WorkflowTasksPageMenuRouteProvider,
} from '../workflowTasksPageMenuRoute';

function RouteStateProbe() {
  const adapter = useWorkflowTasksPageMenuRouteAdapter();
  return (
    <div
      data-popup-id={adapter?.route.popupId}
      data-status={adapter?.route.status}
      data-task-type={adapter?.route.taskType}
      data-testid="route-state"
    />
  );
}

function RelativePopupLink() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('./123')}>Open task</button>;
}

function CurrentLocation() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
}

function PathlessFlowRouteContext({ children }: { children: React.ReactNode }) {
  const routeContext = React.useContext(UNSAFE_RouteContext);
  const lastMatch = routeContext.matches.at(-1);

  if (!lastMatch) {
    return children;
  }

  return (
    <UNSAFE_RouteContext.Provider
      value={{
        ...routeContext,
        matches: [
          ...routeContext.matches,
          {
            ...lastMatch,
            pathname: '/',
            pathnameBase: '/',
            route: {
              ...lastMatch.route,
              path: '',
            },
          },
        ],
      }}
    >
      {children}
    </UNSAFE_RouteContext.Provider>
  );
}

function EmptyFlowRouteContext({ children }: { children: React.ReactNode }) {
  const routeContext = React.useContext(UNSAFE_RouteContext);

  return (
    <UNSAFE_RouteContext.Provider
      value={{
        ...routeContext,
        matches: [],
      }}
    >
      {children}
    </UNSAFE_RouteContext.Provider>
  );
}

function RootDataFlowRouteContext({ children }: { children: React.ReactNode }) {
  const routeContext = React.useContext(UNSAFE_RouteContext);

  return (
    <UNSAFE_RouteContext.Provider
      value={{
        ...routeContext,
        matches: routeContext.matches.slice(0, 1),
      }}
    >
      {children}
    </UNSAFE_RouteContext.Provider>
  );
}

describe('workflow tasks page menu route adapter v1', () => {
  it('parses the page menu route segments from the current location', () => {
    render(
      <MemoryRouter initialEntries={['/admin/workflow-menu/tasktype/approval-apply/status/completed/popupid/456']}>
        <Routes>
          <Route
            path="/admin/:name/*"
            element={
              <WorkflowTasksPageMenuRouteProvider pageUid="workflow-menu">
                <RouteStateProbe />
              </WorkflowTasksPageMenuRouteProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('route-state')).toHaveAttribute('data-task-type', 'approval-apply');
    expect(screen.getByTestId('route-state')).toHaveAttribute('data-status', 'completed');
    expect(screen.getByTestId('route-state')).toHaveAttribute('data-popup-id', '456');
  });

  it('keeps legacy task item relative navigation inside the popupid segment', () => {
    render(
      <MemoryRouter initialEntries={['/admin/workflow-menu/tasktype/approval-apply/status/completed']}>
        <Routes>
          <Route
            path="/admin/:name/*"
            element={
              <WorkflowTasksPageMenuRouteProvider pageUid="workflow-menu">
                <PathlessFlowRouteContext>
                  <WorkflowTasksPageMenuItemRouteScope>
                    <RelativePopupLink />
                  </WorkflowTasksPageMenuItemRouteScope>
                </PathlessFlowRouteContext>
                <CurrentLocation />
              </WorkflowTasksPageMenuRouteProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open task' }));

    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/admin/workflow-menu/tasktype/approval-apply/status/completed/popupid/123',
    );
  });

  it('restores the relative navigation base when the flow renderer clears route matches', () => {
    render(
      <MemoryRouter initialEntries={['/admin/workflow-menu/tasktype/approval-apply/status/completed']}>
        <Routes>
          <Route
            path="/admin/:name/*"
            element={
              <WorkflowTasksPageMenuRouteProvider pageUid="workflow-menu">
                <EmptyFlowRouteContext>
                  <WorkflowTasksPageMenuItemRouteScope>
                    <RelativePopupLink />
                  </WorkflowTasksPageMenuItemRouteScope>
                </EmptyFlowRouteContext>
                <CurrentLocation />
              </WorkflowTasksPageMenuRouteProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open task' }));

    expect(screen.getByTestId('current-location')).toHaveTextContent(
      '/admin/workflow-menu/tasktype/approval-apply/status/completed/popupid/123',
    );
  });

  it('uses the page-menu base instead of the data-router root route', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Outlet />,
          children: [
            {
              path: '*',
              element: (
                <WorkflowTasksPageMenuRouteProvider pageUid="workflow-menu">
                  <RootDataFlowRouteContext>
                    <WorkflowTasksPageMenuItemRouteScope>
                      <RelativePopupLink />
                    </WorkflowTasksPageMenuItemRouteScope>
                  </RootDataFlowRouteContext>
                </WorkflowTasksPageMenuRouteProvider>
              ),
            },
          ],
        },
      ],
      {
        initialEntries: ['/admin/workflow-menu/tasktype/approval-apply/status/completed'],
      },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open task' }));

    expect(router.state.location.pathname).toBe(
      '/admin/workflow-menu/tasktype/approval-apply/status/completed/popupid/123',
    );
  });
});
