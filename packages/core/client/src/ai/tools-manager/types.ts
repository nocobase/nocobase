/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentType } from 'react';
import type { Application } from '../../application';
import { Registry } from '@nocobase/utils/client';

export interface ToolsManager extends ToolsRegistration {
  listTools(filter?: ToolsFilter): Promise<ToolsEntry[]>;
  useTools(): Registry<FrontendTools>;
}

export interface ToolsRegistration {
  registerTools(name: string, options: ToolsOptions): void;
}

export type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      useOnOk?: (
        decisions: ToolsUIProperties['decisions'],
        adjustArgs: Record<string, any>,
      ) => {
        onOk: () => void | Promise<void>;
      };
      Component?: ComponentType<{
        tool: ToolCall;
        saveToolArgs?: (args: unknown) => Promise<void>;
      }>;
    };
  };
  invoke?: (ctx: Application, params: any) => any | Promise<any>;
  useHooks?: () => ToolsOptions;
};

export type ToolCall<T = unknown> = {
  id: string;
  type: string;
  name: string;
  status?: 'success' | 'error';
  invokeStatus: 'init' | 'interrupted' | 'waiting' | 'pending' | 'done' | 'confirmed';
  auto: boolean;
  args: T;
  [key: string]: any;
};

export type FrontendTools = ToolsOptions;

export type BackendTools = {
  scope: Scope;
  defaultPermission?: Permission;
  silence?: boolean;
  introduction?: {
    title: string;
    about: string;
  };
  definition: {
    name: string;
    description: string;
    schema?: any;
  };
};

export type ToolsEntry = BackendTools & FrontendTools;

export type ToolsUIProperties<ToolCallArgs = unknown> = {
  messageId: string;
  tools: ToolsEntry;
  toolCall: ToolCall<ToolCallArgs>;
  decisions: DecisionActions;
};

export type DecisionActions = {
  approve: () => Promise<void>;
  edit: (args: any) => Promise<void>;
  reject: (message: string) => Promise<void>;
};

export type ToolsFilter = {
  scope?: Scope;
  defaultPermission?: Permission;
  silence?: boolean;
};

export type Scope = 'SPECIFIED' | 'GENERAL' | 'CUSTOM';
export type Permission = 'ASK' | 'ALLOW';
