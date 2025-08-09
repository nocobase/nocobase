/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { MetaTreeNode } from '../../flowContext';

export interface UseResolvedMetaTreeResult {
  resolvedMetaTree: MetaTreeNode[] | undefined;
  loading: boolean;
  error: Error | null;
}

/**
 * 通用 hook 用于处理异步/同步 metaTree
 * 统一处理 metaTree 为函数（同步/异步）或数组的情况
 */
export const useResolvedMetaTree = (
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>),
): UseResolvedMetaTreeResult => {
  const [resolvedMetaTree, setResolvedMetaTree] = React.useState<MetaTreeNode[] | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const resolveMetaTree = async () => {
      if (!metaTree) {
        setResolvedMetaTree(undefined);
        setLoading(false);
        setError(null);
        return;
      }

      // 如果是数组，直接使用
      if (Array.isArray(metaTree)) {
        setResolvedMetaTree(metaTree);
        setLoading(false);
        setError(null);
        return;
      }

      // 如果是函数，需要调用它
      if (typeof metaTree === 'function') {
        setLoading(true);
        setError(null);
        try {
          const result = await metaTree();
          setResolvedMetaTree(result as MetaTreeNode[]);
        } catch (err) {
          console.warn('Failed to resolve metaTree function:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setResolvedMetaTree(undefined);
        } finally {
          setLoading(false);
        }
      }
    };

    resolveMetaTree();
  }, [metaTree]);

  return {
    resolvedMetaTree,
    loading,
    error,
  };
};
