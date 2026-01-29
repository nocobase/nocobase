/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';

export type ToolOptions = {
  title: string;
  description: string;
  execution?: 'frontend' | 'backend';
  name: string;
  schema?: any;
  invoke: (
    ctx: Context,
    args: Record<string, any>,
    id?: string,
  ) => Promise<{
    status: 'success' | 'error';
    content: string;
  }>;
  [key: string]: unknown;
};

export type ToolRegisterOptions = {
  groupName?: string;
  tool: ToolOptions;
};

export type ToolGroupRegisterOptions = {
  groupName: string;
  title?: string;
  description?: string;
  sort?: number;
};

export type ToolRegisterDelegate = {
  groupName: string;
  getTools: () => Promise<ToolRegisterOptions[]>;
};

export type ToolManagerLike = {
  registerToolGroup: (options: ToolGroupRegisterOptions) => void;
  registerDynamicTool: (delegate: ToolRegisterDelegate) => void;
  registerTools: (options: ToolRegisterOptions | ToolRegisterOptions[]) => void;
};
