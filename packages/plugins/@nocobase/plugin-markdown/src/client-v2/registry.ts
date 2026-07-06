/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as ClientV2 from '@nocobase/client-v2';
import type { MarkdownEngine } from './runtime';

export interface MarkdownRegistryLike {
  register(engine: MarkdownEngine, options?: { default?: boolean }): void;
}

export interface MarkdownRegistryContextLike {
  markdown?: MarkdownRegistryLike;
  defineProperty?: (key: string, options: { get?: () => MarkdownRegistryLike; value?: MarkdownRegistryLike }) => void;
}

type ClientV2MarkdownApi = {
  getOrCreateMarkdownRegistry: (ctx: MarkdownRegistryContextLike) => MarkdownRegistryLike;
};

export function getMarkdownRegistry(ctx: MarkdownRegistryContextLike) {
  return (ClientV2 as unknown as ClientV2MarkdownApi).getOrCreateMarkdownRegistry(ctx);
}
