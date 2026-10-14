import {
  ClientApplication,
  defineAppClientRenderConfig,
  type AppClientRenderConfig,
} from '@nocobase/app-client';
import { I18nProvider } from '@nocobase/i18n/client';
import type { AppRuntimeContext } from '@nocobase/app-client/runtime';
import {
  createElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { AppRouter } from './routing/app-router.js';
export function createApp(runtime: AppRuntimeContext): ClientApplication {
  // Outermost, so every provider and page below can translate.
  const AppI18nProvider = ({ children }: PropsWithChildren): ReactElement =>
    createElement(I18nProvider, { runtime: runtime.i18n }, children);

  const app = new ClientApplication({
    runtime,
    createRenderConfig: (): AppClientRenderConfig =>
      defineAppClientRenderConfig({
        basename: runtime.basename,
        reactProviders: [
          AppI18nProvider,
          ...runtime.reactProviders.map((provider) => provider.component),
        ],
        routes: createElement(AppRouter, {
          clientRoutes: runtime.routes,
        }),
      }),
  });
  runtime.app = app;
  return app;
}
