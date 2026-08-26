/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PluginSettingsPageType } from '@nocobase/client-v2';
import type { Role } from '../../registries';

export type TFunction = (key: string, options?: Record<string, unknown>) => string;

export interface RoleSnippetsPayload {
  data?: string[];
}

export function toRoleSnippetsPayload(responseData: unknown): RoleSnippetsPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as RoleSnippetsPayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

export function translateTitle(title: unknown, t: TFunction) {
  if (typeof title !== 'string') {
    return title;
  }
  return t(title) || t('Unnamed');
}

export function mergeRoleSnippets(role: Role, snippets: string[]): Role {
  return {
    ...role,
    snippets,
  };
}

export function getSettingsChildren(item: PluginSettingsPageType): PluginSettingsPageType[] {
  return item.children ? [...item.children] : [];
}
