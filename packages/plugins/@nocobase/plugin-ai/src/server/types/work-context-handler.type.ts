/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { WorkContext } from './ai-message.type';
import type { Context } from '@nocobase/actions';

export interface WorkContextHandler {
  registerStrategy(type: string, strategy: WorkContextResolveStrategy);
  resolve(ctx: Context, workContext: WorkContext[]): Promise<string[]>;
}

export type WorkContextResolveStrategy = (ctx: Context, contextItem: WorkContext) => Promise<string>;
