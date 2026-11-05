/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import type { NocoBaseDesktopRoute } from '../../../flow-compat';
import type { AdminLayoutMenuCreationParams } from './AdminLayoutMenuUtils';

export type AdminLayoutPageTypeRouteContext = {
  flowEngine: FlowEngine;
  pageSchemaUid: string;
  routeId: string | number;
  route: NocoBaseDesktopRoute;
};

export type AdminLayoutPageTypeContext = AdminLayoutPageTypeRouteContext & {
  values: AdminLayoutMenuCreationParams;
};

export type AdminLayoutPageTypeDefinition = {
  name: string;
  label: string;
  sort?: number;
  routeOptions?:
    | Record<string, unknown>
    | ((values: AdminLayoutMenuCreationParams) => Record<string, unknown> | undefined);
  onRouteCreated?: (context: AdminLayoutPageTypeContext) => Promise<void>;
  onRouteDeleted?: (context: AdminLayoutPageTypeRouteContext) => Promise<void>;
};

export class AdminLayoutPageTypeManager {
  private readonly pageTypes = new Map<string, AdminLayoutPageTypeDefinition>();

  register(definition: AdminLayoutPageTypeDefinition) {
    if (!definition.name) {
      throw new Error('Admin layout page type name is required');
    }
    if (!definition.label) {
      throw new Error(`Admin layout page type label is required: ${definition.name}`);
    }
    this.pageTypes.set(definition.name, definition);
    return this;
  }

  remove(name: string) {
    return this.pageTypes.delete(name);
  }

  get(name: string) {
    return this.pageTypes.get(name);
  }

  has(name: string) {
    return this.pageTypes.has(name);
  }

  getPageTypes() {
    return [...this.pageTypes.values()].sort((left, right) => (left.sort ?? 100) - (right.sort ?? 100));
  }
}

export const adminLayoutPageTypeManager = new AdminLayoutPageTypeManager();

adminLayoutPageTypeManager.register({
  name: 'flowPage',
  label: 'Page',
  sort: 10,
});
