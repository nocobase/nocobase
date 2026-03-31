/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AIMessage, WorkContext } from './ai-message.type';
import type { Context } from '@nocobase/actions';

export interface WorkContextHandler {
  registerStrategy(type: string, strategies: WorkContextStrategies);
  resolve(ctx: Context, workContext: WorkContext[]): Promise<string[]>;
  background(ctx: Context, aiMessages: AIMessage[]): Promise<String[]>;
}

export type WorkContextStrategies = {
  resolve?: WorkContextResolveStrategy;
  background?: WorkContextBackgroundStrategy;
};

export type WorkContextResolveStrategy = (ctx: Context, contextItem: WorkContext) => Promise<string>;

export type WorkContextBackgroundStrategy = (
  ctx: Context,
  aiMessages: AIMessage[],
  workContext: WorkContext[],
) => Promise<string>;
