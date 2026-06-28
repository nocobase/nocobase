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
import { Tag, TreeSelect } from 'antd';
import type { LegacyDataNode } from 'rc-tree-select/lib/interface';
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

type AppendsTreeNode = LegacyDataNode & {
  pId: string | null;
  id: string;
  title: string;
  value: string;
  key: string;
  isLeaf: boolean;
  field: CollectionTriggerField & { name: string };
  fullTitle: string[];
  loadChildren: ((option: AppendsTreeNode) => AppendsTreeNode[]) | null;
};
type CollectionFieldGetter = (collectionName?: string) => Array<CollectionTriggerField & { name: string }>;
type AppendsTreeScope = {
  compile: (value: string) => string;
  getCollectionFields: CollectionFieldGetter;
};

function isAssociation(field: CollectionTriggerField) {
  return isAssociationField(field) && Boolean(field.target) && Boolean(field.interface);
}

function getFieldTitle(compile: (value: string) => string, field: CollectionTriggerField & { name: string }) {
  return field.uiSchema?.title ? compile(field.uiSchema.title) : field.name;
}

function loadChildren(this: AppendsTreeScope, option: AppendsTreeNode) {
  const result = getCollectionFieldOptions.call(this, option.field.target, option);
  if (result.length) {
    if (!result.some((item) => isAssociation(item.field))) {
      option.isLeaf = true;
    }
  } else {
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
    const isLeaf = !this.getCollectionFields(field.target).filter(isAssociation).length;

    return {
      props: undefined,
      pId: parentNode?.key ?? null,
      id: key,
      key,
      value: key,
      title,
      isLeaf,
      loadChildren: isLeaf ? null : boundLoadChildren,
      field,
      fullTitle: parentNode ? [...parentNode.fullTitle, title] : [title],
    };
  });
}

type TreeSelectValue = { value: string; label?: React.ReactNode };

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
        .filter(Boolean)
        .map((item) => ({ value: item.value, label: item.value })),
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

    return getCollectionFields(flowEngine.context.dataSourceManager, resolvedCollection).filter(hasFieldName) as Array<
      CollectionTriggerField & { name: string }
    >;
  });

  useEffect(() => {
    if (!collectionName) {
      setOptionsMap({});
      return;
    }

    const options: AppendsTreeNode[] = getCollectionFieldOptions.call(
      { compile, getCollectionFields: getCollectionFieldsByName },
      collectionName,
    );
    const nextOptionsMap = options.reduce<Record<string, AppendsTreeNode>>((result, item) => {
      result[item.value] = item;
      return result;
    }, {});
    setOptionsMap(nextOptionsMap);
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

      for (let i = 1; i < paths.length; i++) {
        if (!option) {
          break;
        }

        const nextPath = paths.slice(0, i + 1).join('.');
        if (optionsMap[nextPath]) {
          option = optionsMap[nextPath];
          continue;
        }

        if (!option.isLeaf && option.loadChildren) {
          const children = option.loadChildren(option);
          if (children?.length) {
            loaded.push(...children);
            option = children.find((child) => child.value === nextPath);
          }
        }
      }
    });

    if (!loaded.length) {
      return;
    }

    setOptionsMap((prev) => {
      const next = { ...prev };
      loaded.forEach((item) => {
        next[item.value] = item;
      });
      return next;
    });
  }, [optionsMap, treeData.length, value]);

  const loadData = useMemoizedFn(async (dataNode: LegacyDataNode) => {
    const option = dataNode as AppendsTreeNode;
    if (!option.isLeaf && option.loadChildren) {
      const children = option.loadChildren(option);
      setOptionsMap((prev) => {
        const next = { ...prev };
        children.forEach((item) => {
          next[item.value] = item;
        });
        return next;
      });
    }
  });

  const handleChange = useMemoizedFn((next: TreeSelectValue | TreeSelectValue[] | undefined) => {
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
  });

  const tagRender = useMemoizedFn(
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
  );

  return (
    <TreeSelect
      treeData={treeData}
      value={treeValue}
      treeDataSimpleMode
      loadData={loadData}
      onChange={handleChange}
      treeCheckable
      treeCheckStrictly
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      treeDefaultExpandedKeys={valueKeys}
      placeholder={t('Preload associations')}
      treeNodeFilterProp="title"
      tagRender={tagRender}
      allowClear
    />
  );
}

export default AppendsSelect;
