/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { RouteRepository } from '@nocobase/client-v2';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CustomRouterContextProvider } from '../../../../application/CustomRouterContextProvider';
import { NavigateToDefaultPage } from '../AdminShellProvider';
import { RoutesRequestProvider, useAllAccessDesktopRoutes } from '../route-runtime';
import { NocoBaseDesktopRouteType } from '../route-types';

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowEngineContext: vi.fn(),
  };
});

import { useFlowEngineContext } from '@nocobase/flow-engine';

const mockedUseFlowEngineContext = vi.mocked(useFlowEngineContext);

describe('RoutesRequestProvider', () => {
  const RoutesConsumer = () => {
    const { allAccessRoutes, refresh } = useAllAccessDesktopRoutes();

    return (
      <div>
        <div data-testid="route-count">{allAccessRoutes.length}</div>
        <button onClick={() => refresh()} type="button">
          refresh
        </button>
      </div>
    );
  };

  it('should initialize from repository refresh and keep subscription in sync', async () => {
    const api = {
      request: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            data: [{ id: 1, schemaUid: 'schema-1' }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: [
              { id: 1, schemaUid: 'schema-1' },
              { id: 2, schemaUid: 'schema-2' },
            ],
          },
        }),
    } as any;
    const routeRepository = new RouteRepository({ api });

    mockedUseFlowEngineContext.mockReturnValue({
      routeRepository,
    } as any);

    await act(async () => {
      render(
        <RoutesRequestProvider>
          <RoutesConsumer />
        </RoutesRequestProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('1');
    });

    act(() => {
      routeRepository.setRoutes([
        { id: 1, schemaUid: 'schema-1' },
        { id: 2, schemaUid: 'schema-2' },
        { id: 3, schemaUid: 'schema-3' },
      ]);
    });

    expect(screen.getByTestId('route-count').textContent).toBe('3');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'refresh' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('2');
    });
  });

  it('should swallow initial refresh errors and still initialize provider', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const api = {
      request: vi.fn().mockRejectedValueOnce(new Error('network error')),
    } as any;
    const routeRepository = new RouteRepository({ api });

    mockedUseFlowEngineContext.mockReturnValue({
      routeRepository,
    } as any);

    await act(async () => {
      render(
        <RoutesRequestProvider>
          <RoutesConsumer />
        </RoutesRequestProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('route-count').textContent).toBe('0');
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[NocoBase] RoutesRequestProvider failed to refresh accessible routes.',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should land on the next user first page instead of a page cached for the previous user', async () => {
    const api = {
      request: vi.fn().mockResolvedValue({
        data: {
          data: [{ id: 2, schemaUid: 'next-user-page', type: NocoBaseDesktopRouteType.page }],
        },
      }),
    } as any;
    const routeRepository = new RouteRepository({ api });
    routeRepository.setRoutes([
      { id: 1, schemaUid: 'previous-user-page', type: NocoBaseDesktopRouteType.page },
      { id: 2, schemaUid: 'next-user-page', type: NocoBaseDesktopRouteType.page },
    ]);
    // Signing out clears the auth token, which drops the routes cached for the previous user.
    routeRepository.clear();

    mockedUseFlowEngineContext.mockReturnValue({
      routeRepository,
    } as any);

    const PathnameDisplay = () => <div data-testid="pathname">{useLocation().pathname}</div>;

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <CustomRouterContextProvider>
            <RoutesRequestProvider>
              <NavigateToDefaultPage>
                <PathnameDisplay />
              </NavigateToDefaultPage>
            </RoutesRequestProvider>
          </CustomRouterContextProvider>
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pathname').textContent).toBe('/admin/next-user-page');
    });
    expect(api.request).toHaveBeenCalledTimes(1);
  });
});
