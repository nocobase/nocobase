/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import PluginAIServer from '../plugin';
import { WorkContext, WorkContextHandler, WorkContextResolveStrategy } from '../types';
import { Context } from '@nocobase/actions';

export const createWorkContextHandler = (plugin: PluginAIServer): WorkContextHandler =>
  new WorkContextHandlerImpl(plugin);

class WorkContextHandlerImpl implements WorkContextHandler {
  private defaultStrategy: WorkContextResolveStrategy;
  private resolveStrategies: Registry<WorkContextResolveStrategy>;

  constructor(protected plugin: PluginAIServer) {
    this.defaultStrategy = Stringify(plugin);
    this.resolveStrategies = new Registry();
  }

  registerStrategy(type: string, strategy: WorkContextResolveStrategy) {
    this.resolveStrategies.register(type, strategy);
  }

  async resolve(ctx: Context, workContext: WorkContext[]): Promise<string[]> {
    return Promise.all(workContext.map((contextItem) => this.applyResolveStrategy(ctx, contextItem)));
  }

  private async applyResolveStrategy(ctx: Context, contextItem: WorkContext): Promise<string> {
    if (!contextItem) {
      return '';
    }
    const resolve = this.resolveStrategies.get(contextItem.type);
    if (resolve) {
      return await resolve(ctx, contextItem);
    }

    return await this.defaultStrategy(ctx, contextItem);
  }
}

const Stringify =
  (_plugin: PluginAIServer) =>
  async (_ctx: Context, contextItem: WorkContext): Promise<string> => {
    return JSON.stringify(contextItem);
  };
