/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExtendCollectionsProvider, storePopupContext, useRequest } from '@nocobase/client';
import React, { createContext, FC, useContext } from 'react';
import { getWorkflowTodoViewActionSchema, nodeCollection, todoCollection, workflowCollection } from './WorkflowTodo';
import { JOB_STATUS } from '@nocobase/plugin-workflow/client';

const collections = [nodeCollection, workflowCollection, todoCollection];

const ManualTaskCountRequestContext = createContext({});

/**
 * 1. 扩展几个工作流相关的 collection，防止在区块中因找不到 collection 而报错；
 * @param props
 * @returns
 */
export const WorkflowManualProvider: FC = (props) => {
  const request = useRequest<any>(
    {
      resource: 'users_jobs',
      action: 'countMine',
      params: {
        filter: {
          status: JOB_STATUS.PENDING,
        },
      },
    },
    { manual: true },
  );

  return (
    <ExtendCollectionsProvider collections={collections}>
      <ManualTaskCountRequestContext.Provider value={request}>{props.children}</ManualTaskCountRequestContext.Provider>
    </ExtendCollectionsProvider>
  );
};

export function useCountRequest() {
  return useContext(ManualTaskCountRequestContext);
}

/**
 * 2. 将区块相关的按钮 Schema 缓存起来，这样就可以在弹窗中获取到 Schema，进而实现“弹窗 URL”的功能；
 */
function cacheSchema(collectionNameList: string[]) {
  collectionNameList.forEach((collectionName) => {
    const defaultOpenMode = isMobile() ? 'drawer' : 'page';
    const workflowTodoViewActionSchema = getWorkflowTodoViewActionSchema({ defaultOpenMode, collectionName });

    storePopupContext(workflowTodoViewActionSchema['x-uid'], {
      schema: workflowTodoViewActionSchema,
      ...workflowTodoViewActionSchema['x-action-context'],
    });
  });
}

cacheSchema(Object.values(collections).map((collection) => collection.name));

function isMobile() {
  return window.location.pathname.startsWith('/m/');
}
