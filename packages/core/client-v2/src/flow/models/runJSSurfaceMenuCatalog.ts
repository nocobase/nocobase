/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';

import {
  registerActionGroupMenuItemProvider,
  type ActionGroupMenuItemProviderContext,
} from './base/ActionGroupModelCore';
import { registerBlockGridSelectSceneAddBlockProvider } from './base/BlockGridModel';
import {
  registerFieldMenuItemProvider,
  type FieldMenuItemProviderContext,
  type FieldMenuSurface,
} from './menuItemProviders';

export type RunJSSurfaceMenuSurface = 'block' | 'action' | FieldMenuSurface;

export type RunJSSurfaceMenuItemProviderContext =
  | {
      surface: 'block';
      ctx: FlowModelContext;
      items: SubModelItem[];
    }
  | ({ surface: 'action' } & ActionGroupMenuItemProviderContext)
  | FieldMenuItemProviderContext;

export type RunJSSurfaceMenuItemProvider = (
  context: RunJSSurfaceMenuItemProviderContext,
) => SubModelItem | SubModelItem[] | null | undefined | Promise<SubModelItem | SubModelItem[] | null | undefined>;

export function registerRunJSSurfaceMenuItemProvider(key: string, provider: RunJSSurfaceMenuItemProvider): () => void {
  const disposers: Array<() => void> = [];
  try {
    disposers.push(
      registerBlockGridSelectSceneAddBlockProvider(key, async (ctx) =>
        normalizeProvidedItems(await provider({ surface: 'block', ctx, items: [] })),
      ),
    );
    disposers.push(registerActionGroupMenuItemProvider(key, (context) => provider({ surface: 'action', ...context })));
    disposers.push(registerFieldMenuItemProvider(key, provider));
  } catch (error) {
    disposeRegistrations(disposers);
    throw error;
  }

  return () => disposeRegistrations(disposers);
}

function normalizeProvidedItems(items: SubModelItem | SubModelItem[] | null | undefined): SubModelItem[] {
  if (Array.isArray(items)) {
    return items;
  }
  return items ? [items] : [];
}

function disposeRegistrations(disposers: Array<() => void>): void {
  while (disposers.length) {
    disposers.pop()?.();
  }
}
