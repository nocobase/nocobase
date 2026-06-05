/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useFlowEngine } from '@nocobase/flow-engine';
import { Cascader } from 'antd';

export function SourceCascader(props) {
  const flowEngine = useFlowEngine();

  const buildDataSourceOptions = useCallback(() => {
    const manager = flowEngine?.dataSourceManager;
    if (!manager) {
      return [];
    }
    const dataSources = manager.getDataSources();
    return dataSources.map((dataSource) => ({
      value: dataSource.key,
      label: dataSource.displayName ?? dataSource.key,
      isLeaf: false,
      meta: {
        type: 'dataSource',
        dataSourceKey: dataSource.key,
      },
    }));
  }, [flowEngine]);

  const [options, setOptions] = useState(() => buildDataSourceOptions());

  useEffect(() => {
    setOptions(buildDataSourceOptions());
  }, [buildDataSourceOptions]);

  const loadData = useCallback(
    (selectedOptions) => {
      const target = selectedOptions[selectedOptions.length - 1];
      if (!target || target.children?.length) {
        return;
      }

      const manager = flowEngine?.dataSourceManager;
      if (!manager) {
        return;
      }

      let children = [];

      if (selectedOptions.length === 1) {
        const dataSourceKey = target.value as string;
        const dataSource = manager.getDataSource(dataSourceKey);
        const collections = dataSource?.getCollections() ?? [];
        children = collections.map((collection) => ({
          value: collection.name,
          label: collection.title,
          isLeaf: false,
          meta: {
            type: 'collection',
            dataSourceKey,
            collectionName: collection.name,
            fullPath: collection.name,
          },
        }));
      } else {
        const meta = target.meta || {};
        const dataSourceKey = meta.dataSourceKey;
        const dataSource = manager.getDataSource(dataSourceKey);
        const collectionManager = dataSource?.collectionManager;

        if (!dataSource || !collectionManager) {
          target.isLeaf = true;
          setOptions((prev) => [...prev]);
          return;
        }

        if (meta.type === 'collection') {
          const collection = collectionManager.getCollection(meta.collectionName);
          const fields = collection?.getFields() ?? [];
          children = fields
            .filter((field) => field.filterable)
            .map((field) => {
              const fullPath = `${meta.fullPath}.${field.name}`;
              const hasTarget = !!field.targetCollection;
              return {
                value: field.name,
                label: field.title,
                isLeaf: !hasTarget,
                meta: {
                  type: 'field',
                  dataSourceKey,
                  fullPath,
                },
              };
            })
            .sort((a, b) => (b.isLeaf ? 0 : -1)); // 把叶子节点排在上面
        } else if (meta.type === 'field') {
          const field = dataSource.getCollectionField(meta.fullPath);
          const targetCollection = field?.targetCollection;
          const fields = targetCollection?.getFields() ?? [];
          children = fields
            .filter((field) => field.filterable)
            .map((childField) => {
              const fullPath = `${meta.fullPath}.${childField.name}`;
              const hasTarget = !!childField.targetCollection;
              return {
                value: childField.name,
                label: childField.title,
                isLeaf: !hasTarget,
                meta: {
                  type: 'field',
                  dataSourceKey,
                  fullPath,
                },
              };
            })
            .sort((a, b) => (b.isLeaf ? 0 : -1)); // 把叶子节点排在上面;
        }
      }

      if (!children.length) {
        target.isLeaf = true;
      } else {
        target.children = children;
      }

      setOptions((prev) => [...prev]);
    },
    [flowEngine],
  );

  return <Cascader allowClear {...props} options={options} loadData={loadData} />;
}
