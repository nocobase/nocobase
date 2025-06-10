/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { parseCollectionName, RemoteSelect, useApp } from '@nocobase/client';

import { useCurrentWorkflowContext } from '../FlowContext';
import { WorkflowVariableWrapper } from '../variable';

export function TriggerCollectionRecordSelect(props) {
  const workflow = useCurrentWorkflowContext();
  const app = useApp();

  const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
  const { collectionManager } = app.dataSourceManager.getDataSource(dataSourceName);
  const collection = collectionManager.getCollection(collectionName);
  const render = (p) =>
    collection ? (
      <RemoteSelect
        objectValue
        dataSource={dataSourceName}
        fieldNames={{
          label: collection.titleField || 'id',
          value: 'id',
        }}
        service={{
          resource: collectionName,
        }}
        manual={false}
        {...p}
      />
    ) : null;
  return (
    <WorkflowVariableWrapper
      value={props.value}
      onChange={props.onChange}
      nullable={false}
      changeOnSelect
      {...props}
      render={render}
    />
  );
}
