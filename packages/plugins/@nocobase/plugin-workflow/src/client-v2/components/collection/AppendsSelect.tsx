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

type AssociationCollectionTriggerField = CollectionTriggerField & { name: string; target: string };

type AppendsTreeNode = {
  field: AssociationCollectionTriggerField;
  fullTitle: string[];
  id: string;
  isLeaf: boolean;
  key: string;
  loadChildren: ((option: AppendsTreeNode) => AppendsTreeNode[]) | null;
  pId: string | null;
  title: string;
  value: string;
};

type CollectionFieldGetter = (collectionName?: string) => CollectionTriggerField[];
type AppendsTreeScope = {
  compile: (value: string) => string;
  getCollectionFields: CollectionFieldGetter;
};

type TreeSelectValue = { label?: React.ReactNode; value: string };

function isAssociation(field: CollectionTriggerField): field is AssociationCollectionTriggerField {
  return hasFieldName(field) && isAssociationField(field) && Boolean(field.target) && Boolean(field.interface);
}

function getFieldTitle(compile: (value: string) => string, field: AssociationCollectionTriggerField) {
  return field.uiSchema?.title ? compile(field.uiSchema.title) : field.name;
}

function loadChildren(this: AppendsTreeScope, option: AppendsTreeNode) {
  const result = getCollectionFieldOptions.call(this, option.field.target, option);
  if (!result.length || !result.some((item) => isAssociation(item.field))) {
    option.isLeaf = true;
  }
  return result;
}

function getCollectionFieldOptions(
  this: AppendsTreeScope,
  collectionName?: string,
  parentNode?: Pick<AppendsTreeNode, 'key' | 'value' | 'fullTitle'>,
): AppendsTreeNode[] {
  const fields = this.getCollectionFields(collectionName);
  const boundLoadChildren = loadChildren.bind(this);

  return fields.filter(isAssociation).map((field) => {
    const key = parentNode ? `${parentNode.value ? `${parentNode.value}.` : ''}${field.name}` : field.name;
    const title = getFieldTitle(this.compile, field);
    const isLeaf = !this.getCollectionFields(field.target).some(isAssociation);

    return {
      field,
      fullTitle: parentNode ? [...parentNode.fullTitle, title] : [title],
      id: key,
      isLeaf,
      key,
      loadChildren: isLeaf ? null : boundLoadChildren,
      pId: parentNode?.key ?? null,
      title,
      value: key,
    };
  });
}

function mapTreeNodes(nodes: AppendsTreeNode[]) {
  return nodes.reduce<Record<string, AppendsTreeNode>>((result, item) => {
    result[item.value] = item;
    return result;
  }, {});
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
  const compile = useMemoizedFn((text: string) => t(text));
  const [optionsMap, setOptionsMap] = useState<Record<string, AppendsTreeNode>>({});
  const [dataSourceKey, collectionName] = useMemo(
    () => parseCollectionName(collection) as [string, string],
    [collection],
  );
  const treeData = useMemo<AppendsTreeNode[]>(() => Object.values(optionsMap), [optionsMap]);
  const treeValue = useMemo<TreeSelectValue[]>(
    () =>
      (value ?? [])
        .map((item) => optionsMap[item])
        .filter((item): item is AppendsTreeNode => Boolean(item))
        .map((item) => ({ label: item.value, value: item.value })),
    [optionsMap, value],
  );
  const valueKeys = value ?? [];

  const getCollectionFieldsByName = useMemoizedFn((targetCollectionName?: string) => {
    if (!targetCollectionName) {
      return [];
    }

    const resolvedCollection = targetCollectionName.includes(':')
      ? targetCollectionName
      : joinCollectionName(dataSourceKey || 'main', targetCollectionName);

    return getCollectionFields(flowEngine.context.dataSourceManager, resolvedCollection);
  });

  useEffect(() => {
    if (!collectionName) {
      setOptionsMap({});
      return;
    }

    const options = getCollectionFieldOptions.call(
      { compile, getCollectionFields: getCollectionFieldsByName },
      collectionName,
    );
    setOptionsMap(mapTreeNodes(options));
  }, [collectionName, compile, getCollectionFieldsByName]);

  useEffect(() => {
    const pathsToLoad = value ?? [];
    if (!pathsToLoad.length || pathsToLoad.every((item) => Boolean(optionsMap[item]))) {
      return;
    }

    const loaded: AppendsTreeNode[] = [];
    pathsToLoad.forEach((item) => {
      const paths = item.split('.');
      let option = optionsMap[paths[0]];

      for (let index = 1; index < paths.length; index += 1) {
        if (!option) {
          break;
        }

        const nextPath = paths.slice(0, index + 1).join('.');
        if (optionsMap[nextPath]) {
          option = optionsMap[nextPath];
          continue;
        }

        if (option.isLeaf || !option.loadChildren) {
          break;
        }

        const children = option.loadChildren(option);
        if (!children.length) {
          break;
        }

        loaded.push(...children);
        option = children.find((child) => child.value === nextPath);
      }
    });

    const nextLoaded = loaded.filter((item) => !optionsMap[item.value]);
    if (nextLoaded.length) {
      setOptionsMap((current) => ({ ...current, ...mapTreeNodes(nextLoaded) }));
    }
  }, [optionsMap, value]);

  const loadData: NonNullable<TreeSelectProps['loadData']> = useMemoizedFn(async (dataNode) => {
    const option = dataNode as AppendsTreeNode | undefined;
    if (!option || option.isLeaf || !option.loadChildren) {
      return;
    }

    const children = option.loadChildren(option);
    if (!children.length) {
      return;
    }

    setOptionsMap((current) => ({ ...current, ...mapTreeNodes(children) }));
  });

  const handleChange = useMemoizedFn((nextValue: unknown) => {
    const selectedValues = extractSelectedValues(nextValue);
    const valueSet = new Set(selectedValues);
    const removedValue = (value ?? []).find((item) => !valueSet.has(item));

    if (removedValue) {
      const prefix = `${removedValue}.`;
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
    (props: {
      closable?: boolean;
      disabled?: boolean;
      onClose?: (event?: React.MouseEvent<HTMLElement>) => void;
      value?: string;
    }) => {
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
      allowClear
      loadData={loadData}
      onChange={handleChange as TreeSelectProps['onChange']}
      placeholder={t('Select field')}
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      tagRender={tagRender as TreeSelectProps['tagRender']}
      treeCheckStrictly
      treeCheckable
      treeData={treeData}
      treeDataSimpleMode
      treeDefaultExpandedKeys={valueKeys}
      treeNodeFilterProp="title"
      value={treeValue}
    />
  );
}

export default AppendsSelect;
