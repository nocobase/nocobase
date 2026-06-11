/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useACLRoleContext } from './ACLProvider';
import { createAclSnippetAllow } from './createAclSnippetAllow';

/**
 * 返回当前 ACL snippets 的 allow 判定函数。
 *
 * @returns 包含 allow 方法的对象
 */
export const useAclSnippets = () => {
  const { allowAll, snippets = [] } = useACLRoleContext();

  const allow = useMemo(() => createAclSnippetAllow(snippets, !!allowAll), [allowAll, snippets]);

  return { allow };
};
