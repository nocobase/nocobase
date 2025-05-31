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
import { getWorkflowTodoViewActionSchema } from './WorkflowTodo';
import { TaskStatusOptions } from '../common/constants';
import { NAMESPACE } from '../locale';

const todoCollection = {
  title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
  name: 'workflowManualTasks',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: `{{t("Task title", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
      },
    },
    {
      type: 'belongsTo',
      name: 'workflow',
      target: 'workflows',
      foreignKey: 'workflowId',
      interface: 'm2o',
      isAssociation: true,
      uiSchema: {
        type: 'number',
        title: `{{t("Workflow", { ns: "workflow" })}}`,
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'id',
          },
        },
      },
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
      interface: 'm2o',
      isAssociation: true,
      uiSchema: {
        type: 'object',
        title: `{{t("Assignee", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            label: 'nickname',
            value: 'id',
          },
        },
      },
    },
    {
      type: 'integer',
      name: 'status',
      interface: 'select',
      uiSchema: {
        type: 'number',
        title: `{{t("Status", { ns: "workflow" })}}`,
        'x-component': 'Select',
        enum: TaskStatusOptions,
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      interface: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
        },
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      interface: 'updatedAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Last updated at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {
          showTime: true,
        },
      },
    },
  ],
};

/**
 * 1. 扩展几个工作流相关的 collection，防止在区块中因找不到 collection 而报错；
 * @param props
 * @returns
 */
export const WorkflowManualProvider: FC = (props) => {
  return <ExtendCollectionsProvider collections={[todoCollection]}>{props.children}</ExtendCollectionsProvider>;
};

/**
 * 2. 将区块相关的按钮 Schema 缓存起来，这样就可以在弹窗中获取到 Schema，进而实现“弹窗 URL”的功能；
 */
function cacheSchema(collectionNameList: string[]) {
  collectionNameList.forEach((collectionName) => {
    const defaultOpenMode = isMobile() ? 'page' : 'modal';
    const workflowTodoViewActionSchema = getWorkflowTodoViewActionSchema({ defaultOpenMode, collectionName });

    storePopupContext(workflowTodoViewActionSchema['x-uid'], {
      schema: workflowTodoViewActionSchema,
      ...workflowTodoViewActionSchema['x-action-context'],
    });
  });
}

cacheSchema([todoCollection.name]);

function isMobile() {
  return window.location.pathname.startsWith('/m/');
}
