/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {GeneratedOperation} from './generated-command';

export interface PostProcessorContext {
  flags: Record<string, unknown>;
  operation: GeneratedOperation;
}

export type PostProcessor = (result: unknown, context: PostProcessorContext) => unknown | Promise<unknown>;

function buildKey(resource: string, action: string) {
  return `${resource}:${action}`;
}

class PostProcessorRegistry {
  private readonly processors = new Map<string, PostProcessor>();

  register(resource: string, action: string, processor: PostProcessor) {
    this.processors.set(buildKey(resource, action), processor);
  }

  resolve(resource?: string, action?: string) {
    if (!resource || !action) {
      return undefined;
    }

    return this.processors.get(buildKey(resource, action));
  }
}

export const postProcessorRegistry = new PostProcessorRegistry();

export async function applyPostProcessor(result: unknown, context: PostProcessorContext) {
  const processor = postProcessorRegistry.resolve(context.operation.logicalResourceName, context.operation.actionName);
  if (!processor) {
    return result;
  }

  return processor(result, context);
}
