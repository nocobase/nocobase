/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { TreeSelect } from 'antd';
import React, { useMemo } from 'react';
import { useT } from '../../locale';
import {
  getCollectionFields,
  hasFieldName,
  isAssociationField,
  parseCollectionName,
  type ScheduleCollectionField,
} from './collectionUtils';

type AppendsTreeNode = { title: string; value: string; key: string; children?: AppendsTreeNode[] };
type ScheduleDataSourceManager = Parameters<typeof getCollectionFields>[0];

function buildAssociationTree(
  dataSourceManager: ScheduleDataSourceManager,
  collectionValue?: string,
  prefix = '',
  depth = 2,
): AppendsTreeNode[] {
  const fields = getCollectionFields(dataSourceManager, collectionValue);
  return fields
    .filter(hasFieldName)
    .filter(isAssociationField)
    .map((field: ScheduleCollectionField & { name: string }) => {
      const value = prefix ? `${prefix}.${field.name}` : field.name;
      const [dataSourceKey] = parseCollectionName(collectionValue) as [string, string];
      const targetCollection = field.target
        ? `${dataSourceKey && dataSourceKey !== 'main' ? `${dataSourceKey}:` : ''}${field.target}`
        : undefined;
      const children =
        depth > 1 && targetCollection
          ? buildAssociationTree(dataSourceManager, targetCollection, value, depth - 1)
          : [];
      return {
        title: field.uiSchema?.title || field.name,
        value,
        key: value,
        children: children.length ? children : undefined,
      };
    });
}

export function AppendsSelect({
  collection,
  value,
  onChange,
}: {
  collection?: string;
  value?: string[];
  onChange?: (value: string[]) => void;
}) {
  const flowEngine = useFlowEngine();
  const t = useT();
  const treeData = useMemo(
    () => buildAssociationTree(flowEngine.context.dataSourceManager, collection),
    [flowEngine, collection],
  );

  return (
    <TreeSelect
      treeData={treeData}
      value={value}
      onChange={onChange}
      treeCheckable
      showCheckedStrategy={TreeSelect.SHOW_PARENT}
      placeholder={t('Preload associations')}
      treeNodeFilterProp="title"
      allowClear
    />
  );
}

export default AppendsSelect;
