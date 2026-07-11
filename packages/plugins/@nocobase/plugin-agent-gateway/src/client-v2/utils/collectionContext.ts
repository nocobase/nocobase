/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface FlowCollectionLike {
  name?: string;
  filterTargetKey?: string | string[];
  getFilterByTK?(record: Record<string, unknown>): unknown;
}

export interface CollectionContextLike {
  collection?: FlowCollectionLike;
  blockModel?: {
    collection?: FlowCollectionLike;
  };
  model?: {
    collection?: FlowCollectionLike;
    context?: {
      collection?: FlowCollectionLike;
      blockModel?: {
        collection?: FlowCollectionLike;
      };
    };
  };
}

export function getCollectionFromContext(ctx: CollectionContextLike | undefined) {
  return (
    ctx?.blockModel?.collection ||
    ctx?.model?.context?.blockModel?.collection ||
    ctx?.model?.context?.collection ||
    ctx?.model?.collection ||
    ctx?.collection
  );
}

export function getCollectionNameFromContext(ctx: CollectionContextLike | undefined) {
  const name = getCollectionFromContext(ctx)?.name;
  return typeof name === 'string' ? name.trim() : '';
}
