/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { useAPIClient } from '@nocobase/client';
import { TreeManagerOptions, useTreeManager } from './tree-manager';
import deepmerge from 'deepmerge';

type DepartmentManagerOptions = {
  resource?: string;
  resourceOf?: string;
  params?: any;
} & TreeManagerOptions;

export const useDepartmentManager = (options?: DepartmentManagerOptions) => {
  const { resource = 'departments', resourceOf, params = {} } = options || {};
  const api = useAPIClient();
  const resourceAPI = api.resource(resource, resourceOf);
  const treeManager = useTreeManager(options);
  const { setTreeData, updateTreeData, setLoadedKeys, initData } = treeManager;
  const loadData = async ({ key, children }) => {
    if (children?.length) {
      return;
    }
    const { data } = await resourceAPI.list(
      deepmerge(params, {
        paginate: false,
        appends: ['parent(recursively=true)'],
        filter: {
          parentId: key,
        },
      }),
    );
    if (!data?.data?.length) {
      return;
    }
    setTreeData(updateTreeData(key, data?.data));
  };

  const getByKeyword = async (keyword: string) => {
    const { data } = await resourceAPI.list(
      deepmerge(params, {
        paginate: false,
        filter: {
          title: {
            $includes: keyword,
          },
        },
        appends: ['parent(recursively=true)'],
        pageSize: 100,
      }),
    );
    initData(data?.data);
  };

  return {
    ...treeManager,
    loadData,
    getByKeyword,
  };
};
