/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useACLRoleContext } from '../../acl/ACLProvider';
import ignore from 'ignore';

export const useAclSnippets = () => {
  const { allowAll, snippets } = useACLRoleContext();
  return {
    allow: (aclSnippet) => {
      if (aclSnippet) {
        const ig = ignore().add(snippets);
        const appAllowed = allowAll || ig.ignores(aclSnippet);
        return appAllowed;
      }
      return true;
    },
  };
};
