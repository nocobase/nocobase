/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Tag, TreeSelect, type TreeSelectProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useT } from '../../locale';
import {
  getCollectionFields,
  hasFieldName,
  isAssociationField,
  joinCollectionName,
  parseCollectionName,
  type CollectionTriggerField,
} from './utils';

type AppendsTreeNode = {
  field: CollectionTriggerField & { name: string; target: string };
  fullTitle: string[];
  id: string;
  isLeaf: boolean;
  key: string;
  pId: string | null;
  targetCollection?: string;
  title: string;
  value: string;
};
type CollectionDataSourceManager = Parameters<typeof getCollectionFields>[0];

function isSelectableAssociationField(
  field: CollectionTriggerField,
): field is CollectionTriggerField & { name: string; target: string } {
  return hasFieldName(field) && isAssociationField(field) && Boolean(field.target && field.interface);
}

function getTargetCollectionValue(
  collectionValue: string | undefined,
  field: CollectionTriggerField & { target: string },
) {
  const [dataSourceKey] = parseCollectionName(collectionValue) as [string, string];
  return joinCollectionName(dataSourceKey || 'main', field.target);
}

function buildAssociationTree(
  dataSourceManager: CollectionDataSourceManager,
  compile: (value: string) => string,
  collectionValue?: string,
  parentNode?: AppendsTreeNode,
): AppendsTreeNode[] {
  const fields = getCollectionFields(dataSourceManager, collectionValue);
  return fields.filter(isSelectableAssociationField).map((field) => {
    const title = field.uiSchema?.title ? compile(field.uiSchema.title) : field.name;
    const value = parentNode ? `${parentNode.value}.${field.name}` : field.name;
    const targetCollection = getTargetCollectionValue(collectionValue, field);
    const isLeaf = !getCollectionFields(dataSourceManager, targetCollection).some(isSelectableAssociationField);
    return {
      field,
      fullTitle: parentNode ? [...parentNode.fullTitle, title] : [title],
      id: value,
      isLeaf,
      key: value,
      pId: parentNode?.key ?? null,
      targetCollection,
      title,
      value,
    };
  });
}

function mapTreeNodes(nodes: AppendsTreeNode[]) {
  return nodes.reduce<Record<string, AppendsTreeNode>>((result, item) => {
    result[item.value] = item;
    return result;
  }, {});
}

function isAppendsTreeNode(option: unknown): option is AppendsTreeNode {
  return (
    typeof option === 'object' &&
    option !== null &&
    'field' in option &&
    'fullTitle' in option &&
    'targetCollection' in option &&
    'value' in option
  );
}

function extractSelectedValues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'object' && item !== null && 'value' in item) {
        const selectedValue = (item as { value?: unknown }).value;
        return typeof selectedValue === 'string' ? selectedValue : undefined;
      }
      return undefined;
    })
    .filter((item): item is string => Boolean(item));
}

function addParentPaths(valueSet: Set<string>, path: string) {
  const segments = path.split('.');
  for (let index = 1; index <= segments.length; index += 1) {
    valueSet.add(segments.slice(0, index).join('.'));
  }
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
  const dataSourceManager = flowEngine.context.dataSourceManager;
  const compile = useMemoizedFn((valueToCompile: string) => t(valueToCompile));
  const [optionsMap, setOptionsMap] = useState<Record<string, AppendsTreeNode>>({});
  const treeData = useMemo(() => Object.values(optionsMap), [optionsMap]);
  const treeValue = useMemo(
    () => (value ?? []).map((item) => optionsMap[item]).filter((item): item is AppendsTreeNode => Boolean(item)),
    [optionsMap, value],
  );
  const loadRootOptions = useMemoizedFn(() => buildAssociationTree(dataSourceManager, compile, collection));

  useEffect(() => {
    setOptionsMap(mapTreeNodes(loadRootOptions()));
  }, [collection, loadRootOptions]);

  const loadChildren = useMemoizedFn((option: AppendsTreeNode) => {
    if (option.isLeaf || !option.targetCollection) {
      return [];
    }
    return buildAssociationTree(dataSourceManager, compile, option.targetCollection, option);
  });

  const loadData: NonNullable<TreeSelectProps['loadData']> = useMemoizedFn(async (option) => {
    if (!isAppendsTreeNode(option)) {
      return;
    }
    const children = loadChildren(option);
    if (!children.length) {
      return;
    }
    setOptionsMap((current) => ({ ...current, ...mapTreeNodes(children) }));
  });

  useEffect(() => {
    const selectedValues = value ?? [];
    if (!selectedValues.length || selectedValues.every((item) => optionsMap[item])) {
      return;
    }

    const loaded: AppendsTreeNode[] = [];
    selectedValues.forEach((item) => {
      const paths = item.split('.');
      let option = optionsMap[paths[0]];
      for (let index = 1; index < paths.length; index += 1) {
        if (!option) {
          break;
        }

        const nextValue = paths.slice(0, index + 1).join('.');
        if (optionsMap[nextValue]) {
          option = optionsMap[nextValue];
          continue;
        }

        const children = loadChildren(option);
        if (!children.length) {
          break;
        }
        loaded.push(...children);
        option = children.find((child) => child.value === nextValue);
      }
    });

    const nextLoaded = loaded.filter((item) => !optionsMap[item.value]);
    if (nextLoaded.length) {
      setOptionsMap((current) => ({ ...current, ...mapTreeNodes(nextLoaded) }));
    }
  }, [loadChildren, optionsMap, value]);

  const handleChange = useMemoizedFn((nextValue: unknown) => {
    const selectedValues = extractSelectedValues(nextValue);
    const valueSet = new Set(selectedValues);
    const deletedValue = treeValue.find((item) => !valueSet.has(item.value));

    if (deletedValue) {
      const prefix = `${deletedValue.value}.`;
      Object.keys(optionsMap).forEach((key) => {
        if (key.startsWith(prefix)) {
          valueSet.delete(key);
        }
      });
    } else {
      selectedValues.forEach((item) => addParentPaths(valueSet, item));
    }

    onChange?.(Array.from(valueSet));
  });

  const tagRender = useMemoizedFn(
    (props: { closable?: boolean; disabled?: boolean; onClose?: () => void; value?: string }) => {
      const { closable, disabled, onClose, value: tagValue } = props;
      if (!tagValue) {
        return null;
      }
      return (
        <Tag closable={closable && !disabled} onClose={onClose}>
          {optionsMap[tagValue]?.fullTitle?.join(' / ') ?? tagValue}
        </Tag>
      );
    },
  );

  return (
    <TreeSelect
      treeData={treeData}
      value={treeValue}
      onChange={handleChange as TreeSelectProps['onChange']}
      treeCheckable
      treeCheckStrictly
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      treeDefaultExpandedKeys={value}
      treeDataSimpleMode
      loadData={loadData}
      tagRender={tagRender as TreeSelectProps['tagRender']}
      placeholder={t('Select field')}
      treeNodeFilterProp="title"
      allowClear
    />
  );
}

export default AppendsSelect;
