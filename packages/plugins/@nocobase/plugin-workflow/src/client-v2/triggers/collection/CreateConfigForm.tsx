/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { Cascader, Form } from 'antd';
import React, { useMemo } from 'react';
import { useWorkflowTranslation } from '../../locale';

/**
 * `config.collection` is stored as a single string: just the collection name
 * for the `main` data source, or `<dataSourceKey>:<collectionName>` otherwise
 * (mirrors `@nocobase/data-source-manager`'s `joinCollectionName`). The picker
 * is an antd Cascader whose path value `[dataSourceKey, collectionName]` is
 * converted to / from that string so the persisted shape matches the server.
 */
function joinCollectionName(dataSourceKey: string, collectionName: string) {
  if (!dataSourceKey || dataSourceKey === 'main') {
    return collectionName;
  }
  return `${dataSourceKey}:${collectionName}`;
}

function parseCollectionName(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const parts = value.split(':');
  const collectionName = parts.pop() as string;
  const dataSourceKey = parts[0] ?? 'main';
  return [dataSourceKey, collectionName];
}

type CascaderOption = { value: string; label: string; children?: CascaderOption[] };

type DataSourceLike = {
  key: string;
  displayName: string;
  options?: { isDBInstance?: boolean };
  getCollections(): Array<{ name: string; title: string; hidden?: boolean }>;
};

function CollectionCascader({ value, onChange }: { value?: string; onChange?: (value?: string) => void }) {
  const { t } = useWorkflowTranslation();
  const flowEngine = useFlowEngine();

  const options = useMemo<CascaderOption[]>(() => {
    const dataSources = flowEngine.dataSourceManager.getDataSources() as DataSourceLike[];
    return dataSources
      .filter((ds) => ds.key === 'main' || ds.options?.isDBInstance)
      .map((ds) => ({
        value: ds.key,
        label: ds.displayName,
        children: ds
          .getCollections()
          .filter((collection) => !collection.hidden)
          .map((collection) => ({
            value: collection.name,
            label: collection.title,
          })),
      }));
  }, [flowEngine]);

  const pathValue = useMemo(() => parseCollectionName(value), [value]);

  return (
    <Cascader
      options={options}
      value={pathValue}
      placeholder={t('Select collection')}
      showSearch
      onChange={(path) => {
        if (!path?.length) {
          onChange?.(undefined);
          return;
        }
        const [dataSourceKey, collectionName] = path as string[];
        onChange?.(joinCollectionName(dataSourceKey, collectionName));
      }}
    />
  );
}

export default function CollectionTriggerConfigForm() {
  const { t } = useWorkflowTranslation();
  return (
    <Form.Item name={['config', 'collection']} label={t('Collection')} rules={[{ required: true }]}>
      <CollectionCascader />
    </Form.Item>
  );
}
