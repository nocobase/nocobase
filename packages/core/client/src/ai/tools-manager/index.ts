/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import { BackendTools, FrontendTools, ToolsEntry, ToolsFilter, ToolsManager, ToolsOptions } from './types';
import { Application } from '../../application';

export class DefaultToolsManager implements ToolsManager {
  constructor(
    protected readonly app: Application,
    private readonly tools = new Registry<FrontendTools>(),
  ) {}

  async listTools(filter?: ToolsFilter): Promise<ToolsEntry[]> {
    const { data: res } = await this.app.apiClient.resource('aiTools').list({ filter });
    const backendTools = res?.data as BackendTools[];
    if (!backendTools) {
      return [];
    }
    return backendTools.map((bt) => ({ ...bt, ...(this.tools.get(bt.definition.name) ?? {}) }));
  }

  useTools(): Registry<FrontendTools> {
    const register = new Registry<FrontendTools>();
    for (const [key, value] of this.tools.getEntities()) {
      register.register(key, { ...(value.useHooks?.() ?? value) } as FrontendTools);
    }
    return register;
  }

  registerTools(name: string, options: ToolsOptions): void {
    this.tools.register(name, { ...options } as FrontendTools);
  }
}

export * from './types';
export * from './hooks';
