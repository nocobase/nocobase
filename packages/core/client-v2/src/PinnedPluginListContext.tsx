/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext } from 'react';
import type { ComponentTypeAndString } from './RouterManager';

export type PinnedPluginListItem = {
  component: ComponentTypeAndString;
  order?: number;
  pin?: boolean;
  snippet?: string;
};

export type PinnedPluginListItems = Record<string, PinnedPluginListItem>;

export type PinnedPluginListContextValue = {
  items: PinnedPluginListItems;
};

export const getPinnedPluginListKeys = (items: PinnedPluginListItems = {}) => {
  return Object.keys(items).sort((a, b) => {
    return (items[a]?.order as number) - (items[b]?.order as number);
  });
};

export const PinnedPluginListContext = createContext<PinnedPluginListContextValue>({ items: {} });
PinnedPluginListContext.displayName = 'PinnedPluginListContext';
