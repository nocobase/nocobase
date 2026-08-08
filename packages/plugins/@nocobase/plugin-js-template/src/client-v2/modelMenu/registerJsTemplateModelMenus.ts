/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerRunJSSurfaceMenuItemProvider } from '@nocobase/client-v2';

import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { JS_TEMPLATE_MODEL_MENU_PROVIDER_KEY } from '../jsTemplateRunJSIntegrationContract';
import { createJsTemplateSurfaceMenuProvider } from './createJsTemplateModelMenuProvider';

const activeRegistrations = new Map<symbol, ApiClientLike>();
let unregisterProviders: (() => void) | undefined;

export function registerJsTemplateModelMenus(api: ApiClientLike): () => void {
  const registration = Symbol(JS_TEMPLATE_MODEL_MENU_PROVIDER_KEY);
  activeRegistrations.set(registration, api);
  try {
    if (!unregisterProviders) {
      unregisterProviders = installProviders();
    }
  } catch (error) {
    activeRegistrations.delete(registration);
    throw error;
  }

  return () => {
    activeRegistrations.delete(registration);
    if (activeRegistrations.size === 0) {
      unregisterProviders?.();
      unregisterProviders = undefined;
    }
  };
}

function installProviders(): () => void {
  return registerRunJSSurfaceMenuItemProvider(JS_TEMPLATE_MODEL_MENU_PROVIDER_KEY, (context) =>
    createJsTemplateSurfaceMenuProvider(getActiveApi())(context),
  );
}

function getActiveApi(): ApiClientLike {
  const api = Array.from(activeRegistrations.values()).at(-1);
  if (!api) {
    throw new Error('JS Template model menus are not registered');
  }
  return api;
}
