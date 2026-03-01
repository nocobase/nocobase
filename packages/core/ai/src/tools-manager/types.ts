/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';

export interface ToolsManager extends ToolsRegistration {
  getTools(toolName: string): Promise<ToolsEntry>;
  listTools(filter?: ToolsFilter): Promise<ToolsEntry[]>;
}

export interface ToolsRegistration {
  registerTools(options: ToolsOptions | ToolsOptions[]): void;
  registerDynamicTools(provider: (register: ToolsRegistration) => Promise<void>): void;
}

export type ToolsOptions = {
  scope: Scope;
  execution?: 'frontend' | 'backend';
  defaultPermission?: Permission;
  silence?: boolean;
  introduction?: {
    title: string;
    about?: string;
  };
  definition: {
    name: string;
    description: string;
    schema?: any;
  };
  invoke: (ctx: Context, args: any, id: string) => Promise<any>;
};

export type ToolsEntry = ToolsOptions;

export type Scope = 'SPECIFIED' | 'GENERAL' | 'CUSTOM';
export type Permission = 'ASK' | 'ALLOW';

export type DynamicToolsProvider = (register: ToolsRegistration) => Promise<void>;

export type ToolsFilter = {
  scope?: Scope;
  defaultPermission?: Permission;
  silence?: boolean;
};
