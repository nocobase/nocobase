/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RouterManager as BaseRouterManager, type RouterOptions } from '@nocobase/client-v2';
import React, { type ComponentType, createContext, useContext } from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useRouteError,
} from 'react-router-dom';
import VariablesProvider from '../variables/VariablesProvider';
import { Application } from './Application';
import { CustomRouterContextProvider } from './CustomRouterContextProvider';
import { BlankComponent, RouterContextCleaner } from './components';
import { RouterBridge } from './components/RouterBridge';

export type {
  BrowserRouterOptions,
  HashRouterOptions,
  MemoryRouterOptions,
  RouterOptions,
  ComponentTypeAndString,
  ComponentLoaderResult,
  ComponentLoader,
  RouteType,
  RenderComponentType,
} from '@nocobase/client-v2';

export class RouterManager extends BaseRouterManager<Application> {
  /**
   * @internal
   */
  getRouterComponent(children?: React.ReactNode) {
    const { type = 'browser', ...opts } = this.options;

    const routerCreators = {
      hash: createHashRouter,
      browser: createBrowserRouter,
      memory: createMemoryRouter,
    };

    const routes = this.getRoutesTree();
    const BaseLayoutContext = createContext<ComponentType>(null);

    const Provider = () => {
      const BaseLayout = useContext(BaseLayoutContext);
      return (
        <>
          <RouterBridge app={this.app} />
          <CustomRouterContextProvider>
            <BaseLayout>
              <VariablesProvider>
                <Outlet />
                {children}
              </VariablesProvider>
            </BaseLayout>
          </CustomRouterContextProvider>
        </>
      );
    };

    const ErrorElement = () => {
      const error = useRouteError();
      throw error;
    };

    this.router = routerCreators[type](
      [
        {
          element: <Provider />,
          errorElement: <ErrorElement />,
          children: routes,
        },
      ],
      opts,
    );

    const RenderRouter: React.FC<{ BaseLayout?: ComponentType }> = ({ BaseLayout = BlankComponent }) => {
      return (
        <BaseLayoutContext.Provider value={BaseLayout}>
          <RouterContextCleaner>
            <RouterProvider
              future={{
                v7_startTransition: true,
              }}
              router={this.router}
            />
          </RouterContextCleaner>
        </BaseLayoutContext.Provider>
      );
    };

    return RenderRouter;
  }
}

export function createRouterManager(options?: RouterOptions, app?: Application) {
  return new RouterManager(options, app);
}
