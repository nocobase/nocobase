/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExtendCollectionsProvider, storePopupContext } from '@nocobase/client';
import React, { FC } from 'react';
import { getWorkflowTodoViewActionSchema, nodeCollection, todoCollection, workflowCollection } from './WorkflowTodo';

const collections = [nodeCollection, workflowCollection, todoCollection];

/**
 * 1. 扩展几个工作流相关的 collection，防止在区块中因找不到 collection 而报错；
 * @param props
 * @returns
 */
export const WorkflowManualProvider: FC = (props) => {
  return <ExtendCollectionsProvider collections={collections}>{props.children}</ExtendCollectionsProvider>;
};

/**
 * 2. 将区块相关的按钮 Schema 缓存起来，这样就可以在弹窗中获取到 Schema，进而实现“弹窗 URL”的功能；
 */
function cacheSchema(collectionNameList: string[]) {
  collectionNameList.forEach((collectionName) => {
    const workflowTodoViewActionSchema = getWorkflowTodoViewActionSchema({ defaultOpenMode: 'drawer', collectionName });

    storePopupContext(workflowTodoViewActionSchema['x-uid'], {
      schema: workflowTodoViewActionSchema,
      ...workflowTodoViewActionSchema['x-action-context'],
      notBackToPreviousPath: true,
    });
  });
}

cacheSchema(Object.values(collections).map((collection) => collection.name));
