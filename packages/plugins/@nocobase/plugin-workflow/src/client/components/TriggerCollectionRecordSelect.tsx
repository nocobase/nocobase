/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert } from 'antd';
import { parseCollectionName, RemoteSelect, useApp } from '@nocobase/client';

import { useCurrentWorkflowContext } from '../FlowContext';
import { WorkflowVariableWrapper } from '../variable';
import { lang } from '../locale';

export function TriggerCollectionRecordSelect(props) {
  const workflow = useCurrentWorkflowContext();
  const app = useApp();

  const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
  const dataSource = app.dataSourceManager.getDataSource(dataSourceName);
  if (!dataSource) {
    return (
      <Alert
        type="warning"
        showIcon
        message={lang(`Data source "{{dataSourceName}}" not found.`, { dataSourceName })}
      />
    );
  }
  const collection = dataSource.collectionManager.getCollection(collectionName);
  if (!collection) {
    return (
      <Alert type="warning" showIcon message={lang(`Collection "{{collectionName}}" not found.`, { collectionName })} />
    );
  }
  const id = collection.filterTargetKey;
  const render = (p) => (
    <RemoteSelect
      objectValue
      dataSource={dataSourceName}
      fieldNames={{
        label: collection.titleField || id,
        value: id,
      }}
      service={{
        resource: collectionName,
      }}
      manual={false}
      {...p}
    />
  );
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
