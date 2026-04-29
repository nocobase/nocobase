/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ignore from 'ignore';

/**
 * 基于 ACL snippets 生成 allow 判定函数。
 *
 * @param snippets 当前角色的 snippets 列表
 * @param allowAll 是否拥有全量权限
 * @returns 根据 snippet 判断是否允许的函数
 */
export const createAclSnippetAllow = (snippets: string[] = [], allowAll = false) => {
  const ig = ignore().add(snippets || []);

  return (aclSnippet?: string) => {
    if (!aclSnippet || aclSnippet === '*') {
      return true;
    }

    if (allowAll) {
      return true;
    }

    return ig.ignores(aclSnippet);
  };
};
