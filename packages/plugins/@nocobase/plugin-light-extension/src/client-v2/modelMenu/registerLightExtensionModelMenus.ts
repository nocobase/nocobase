/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  registerActionGroupMenuItemProvider,
  registerBlockGridSelectSceneAddBlockProvider,
  registerFieldMenuItemProvider,
  type ActionGroupMenuItemProviderContext,
  type FieldMenuItemProviderContext,
} from '@nocobase/client-v2';
import type { FlowModelContext, SubModelItem, SubModelItemsType } from '@nocobase/flow-engine';

import { NAMESPACE } from '../../constants';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  createLightExtensionModelMenuProvider,
  type LightExtensionModelMenuOptions,
} from './createLightExtensionModelMenuProvider';

const MODEL_MENU_PROVIDER_KEY = `${NAMESPACE}/model-menus`;
const ACTION_MODEL_USES = [
  'JSActionModel',
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
] as const;

const activeRegistrations = new Map<symbol, ApiClientLike>();
let unregisterProviders: (() => void) | undefined;

export function registerLightExtensionModelMenus(api: ApiClientLike): () => void {
  const registration = Symbol(MODEL_MENU_PROVIDER_KEY);
  activeRegistrations.set(registration, api);
  if (!unregisterProviders) {
    unregisterProviders = installProviders();
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
  const disposers = [
    registerBlockGridSelectSceneAddBlockProvider(MODEL_MENU_PROVIDER_KEY, (ctx) =>
      createItemsResolver(getActiveApi(), { target: 'block' })(ctx),
    ),
    registerActionGroupMenuItemProvider(MODEL_MENU_PROVIDER_KEY, (context) =>
      resolveActionMenuItem(getActiveApi(), context),
    ),
    registerFieldMenuItemProvider(MODEL_MENU_PROVIDER_KEY, (context) => resolveFieldMenuItem(getActiveApi(), context)),
  ];

  return () => {
    while (disposers.length) {
      disposers.pop()?.();
    }
  };
}

function getActiveApi(): ApiClientLike {
  const api = Array.from(activeRegistrations.values()).at(-1);
  if (!api) {
    throw new Error('Light extension model menus are not registered');
  }
  return api;
}

async function resolveActionMenuItem(
  api: ApiClientLike,
  context: ActionGroupMenuItemProviderContext,
): Promise<SubModelItem | null> {
  const modelUse = ACTION_MODEL_USES.find((candidate) => containsModelUse(context.items, candidate));
  if (!modelUse) {
    return null;
  }
  const items = await createItemsResolver(api, { target: 'action', modelUse })(context.ctx);
  return items[0] || null;
}

async function resolveFieldMenuItem(
  api: ApiClientLike,
  context: FieldMenuItemProviderContext,
): Promise<SubModelItem | null> {
  const options: LightExtensionModelMenuOptions =
    context.surface === 'table-column'
      ? { target: 'column', modelUse: 'JSColumnModel' }
      : context.surface === 'form-field'
        ? {
            target: 'field',
            itemModelUse: 'FormItemModel',
            fieldModelUse: 'JSEditableFieldModel',
            refreshTargets: ['FormItemModel', 'FormJSFieldItemModel'],
          }
        : context.surface === 'details-field'
          ? {
              target: 'field',
              itemModelUse: 'DetailsItemModel',
              fieldModelUse: 'JSFieldModel',
              refreshTargets: ['DetailsItemModel', 'DetailsJSFieldItemModel'],
            }
          : null;
  if (!options) {
    return null;
  }
  const items = await createItemsResolver(api, options)(context.ctx);
  return items[0] || null;
}

function createItemsResolver(api: ApiClientLike, options: LightExtensionModelMenuOptions) {
  const source = createLightExtensionModelMenuProvider(api, options);
  return async (ctx: FlowModelContext): Promise<SubModelItem[]> => resolveItems(source, ctx);
}

async function resolveItems(items: SubModelItemsType, ctx: FlowModelContext): Promise<SubModelItem[]> {
  return Array.isArray(items) ? items : items(ctx);
}

function containsModelUse(items: SubModelItem[], expected: string): boolean {
  return items.some((item) => {
    if (item.useModel === expected) {
      return true;
    }
    return Array.isArray(item.children) ? containsModelUse(item.children, expected) : false;
  });
}
