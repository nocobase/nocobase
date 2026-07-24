/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerRunJSSurfaceMenuItemProvider } from '@nocobase/client-v2';

import { NAMESPACE } from '../../constants';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { createLightExtensionSurfaceMenuProvider } from './createLightExtensionModelMenuProvider';

const MODEL_MENU_PROVIDER_KEY = `${NAMESPACE}/model-menus`;

const activeRegistrations = new Map<symbol, ApiClientLike>();
let unregisterProviders: (() => void) | undefined;

export function registerLightExtensionModelMenus(api: ApiClientLike): () => void {
  const registration = Symbol(MODEL_MENU_PROVIDER_KEY);
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
  return registerRunJSSurfaceMenuItemProvider(MODEL_MENU_PROVIDER_KEY, (context) =>
    createLightExtensionSurfaceMenuProvider(getActiveApi())(context),
  );
}

function getActiveApi(): ApiClientLike {
  const api = Array.from(activeRegistrations.values()).at(-1);
  if (!api) {
    throw new Error('Light extension model menus are not registered');
  }
  return api;
}
