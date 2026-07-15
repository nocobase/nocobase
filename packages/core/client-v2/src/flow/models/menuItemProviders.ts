/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel, FlowModelContext, SubModelItem } from '@nocobase/flow-engine';

export type FieldMenuSurface = 'form-field' | 'details-field' | 'filter-form-field' | 'table-column';

export interface FieldMenuItemProviderContext {
  surface: FieldMenuSurface;
  model: FlowModel;
  ctx: FlowModelContext;
  items: SubModelItem[];
}

export type FieldMenuItemProvider = (
  context: FieldMenuItemProviderContext,
) => SubModelItem | SubModelItem[] | null | undefined | Promise<SubModelItem | SubModelItem[] | null | undefined>;

const fieldMenuItemProviders = new Map<string, FieldMenuItemProvider>();

export function registerFieldMenuItemProvider(key: string, provider: FieldMenuItemProvider): () => void {
  fieldMenuItemProviders.set(key, provider);
  return () => {
    if (fieldMenuItemProviders.get(key) === provider) {
      fieldMenuItemProviders.delete(key);
    }
  };
}

export function clearFieldMenuItemProviders(): void {
  fieldMenuItemProviders.clear();
}

export async function resolveFieldMenuItems(input: {
  surface: FieldMenuSurface;
  model: FlowModel;
  ctx: FlowModelContext;
  items?: SubModelItem[];
}): Promise<SubModelItem[]> {
  const items = [...(input.items ?? [])];

  for (const [key, provider] of fieldMenuItemProviders) {
    try {
      const provided = await provider({
        surface: input.surface,
        model: input.model,
        ctx: input.ctx,
        items: [...items],
      });
      if (Array.isArray(provided)) {
        items.push(...provided);
      } else if (provided) {
        items.push(provided);
      }
    } catch (error) {
      console.error(`[NocoBase] Failed to resolve field menu item provider '${key}':`, error);
    }
  }

  return items.sort((a, b) => (a.sort ?? 1000) - (b.sort ?? 1000));
}
