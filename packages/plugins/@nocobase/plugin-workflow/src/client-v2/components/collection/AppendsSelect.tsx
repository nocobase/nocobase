/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { Tag, TreeSelect } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useT } from '../../locale';
import {
  getCollectionFields,
  hasFieldName,
  isAssociationField,
  parseCollectionName,
  type CollectionTriggerField,
} from './utils';

type AppendsTreeNode = {
  title: string;
  value: string;
  key: string;
  fullTitle: string[];
  children?: AppendsTreeNode[];
};
type CollectionDataSourceManager = Parameters<typeof getCollectionFields>[0];

function buildAssociationTree(
  dataSourceManager: CollectionDataSourceManager,
  compile: (value: string) => string,
  collectionValue?: string,
  prefix = '',
  depth = 2,
  parentTitles: string[] = [],
): AppendsTreeNode[] {
  const fields = getCollectionFields(dataSourceManager, collectionValue);
  return fields
    .filter(hasFieldName)
    .filter(isAssociationField)
    .map((field: CollectionTriggerField & { name: string }) => {
      const value = prefix ? `${prefix}.${field.name}` : field.name;
      const title = field.uiSchema?.title ? compile(field.uiSchema.title) : field.name;
      const fullTitle = [...parentTitles, title];
      const [dataSourceKey] = parseCollectionName(collectionValue) as [string, string];
      const targetCollection = field.target
        ? `${dataSourceKey && dataSourceKey !== 'main' ? `${dataSourceKey}:` : ''}${field.target}`
        : undefined;
      const children =
        depth > 1 && targetCollection
          ? buildAssociationTree(dataSourceManager, compile, targetCollection, value, depth - 1, fullTitle)
          : [];
      return {
        title,
        value,
        key: value,
        fullTitle,
        children: children.length ? children : undefined,
      };
    });
}

type TreeSelectValue = { value: string; label?: React.ReactNode };

function flattenTree(treeData: AppendsTreeNode[]): Record<string, AppendsTreeNode> {
  return treeData.reduce<Record<string, AppendsTreeNode>>((result, node) => {
    result[node.value] = node;
    if (node.children?.length) {
      Object.assign(result, flattenTree(node.children));
    }
    return result;
  }, {});
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
    () => buildAssociationTree(flowEngine.context.dataSourceManager, t, collection),
    [flowEngine, t, collection],
  );
  const optionsMap = useMemo(() => flattenTree(treeData), [treeData]);
  const treeValue = useMemo<TreeSelectValue[]>(
    () => (value ?? []).map((item) => ({ value: item, label: item })).filter((item) => item.value in optionsMap),
    [optionsMap, value],
  );

  const handleChange = useCallback(
    (next: TreeSelectValue | TreeSelectValue[] | undefined) => {
      const nextItems = Array.isArray(next) ? next : next ? [next] : [];
      const nextValues = nextItems.map((item) => item.value).filter(Boolean) as string[];
      const valueSet = new Set(nextValues);
      const removedValue = (value ?? []).find((item) => !valueSet.has(item));

      if (removedValue) {
        const prefix = `${removedValue}.`;
        Object.keys(optionsMap).forEach((key) => {
          if (key.startsWith(prefix)) {
            valueSet.delete(key);
          }
        });
      } else {
        nextValues.forEach((item) => {
          const paths = item.split('.');
          for (let i = 1; i <= paths.length; i++) {
            valueSet.add(paths.slice(0, i).join('.'));
          }
        });
      }

      onChange?.(Array.from(valueSet));
    },
    [onChange, optionsMap, value],
  );

  const tagRender = useCallback(
    (props: { value?: string; closable?: boolean; onClose?: (event?: React.MouseEvent<HTMLElement>) => void }) => {
      const node = props.value ? optionsMap[props.value] : undefined;
      if (!node) {
        return null;
      }
      return (
        <Tag closable={props.closable} onClose={props.onClose}>
          {node.fullTitle.join(' / ')}
        </Tag>
      );
    },
    [optionsMap],
  );

  return (
    <TreeSelect
      treeData={treeData}
      value={treeValue}
      onChange={handleChange}
      treeCheckable
      treeCheckStrictly
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      placeholder={t('Preload associations')}
      treeNodeFilterProp="title"
      tagRender={tagRender}
      allowClear
    />
  );
}

export default AppendsSelect;
