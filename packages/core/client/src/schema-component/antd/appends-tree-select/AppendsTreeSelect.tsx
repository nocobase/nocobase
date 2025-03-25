/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleFilled, DownOutlined } from '@ant-design/icons';
import { Tag, TreeSelect } from 'antd';
import type { TreeSelectProps } from 'rc-tree-select/es/TreeSelect';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions_deprecated, parseCollectionName, useApp, useCompile } from '../../..';
import { DefaultOptionType } from 'antd/es/select';

export type AppendsTreeSelectProps = {
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  title?: string;
  multiple?: boolean;
  filter?(field): boolean;
  collection?: string;
  useCollection?(props: Pick<AppendsTreeSelectProps, 'collection'>): string;
  rootOption?: {
    label: string;
    value: string;
  };
};

type TreeOptionType = Omit<DefaultOptionType, 'value'> & { value: string };

function usePropsCollection({ collection }) {
  return collection;
}

type CallScope = {
  compile?(value: string): string;
  getCollectionFields?(name: any, dataSource?: string): CollectionFieldOptions_deprecated[];
  filter(field): boolean;
};

function loadChildren(this, option) {
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

function isAssociation(field) {
  return field.target && field.interface;
}

function trueFilter(field) {
  return true;
}

function getCollectionFieldOptions(this: CallScope, collection, parentNode?): TreeOptionType[] {
  const fields = this.getCollectionFields(collection).filter(isAssociation);
  const boundLoadChildren = loadChildren.bind(this);
  return fields.filter(this.filter).map((field) => {
    const key = parentNode ? `${parentNode.value ? `${parentNode.value}.` : ''}${field.name}` : field.name;
    const fieldTitle = this.compile(field.uiSchema?.title) ?? field.name;
    const isLeaf = !this.getCollectionFields(field.target).filter(isAssociation).filter(this.filter).length;
    return {
      pId: parentNode?.key ?? null,
      id: key,
      key,
      value: key,
      title: fieldTitle,
      isLeaf,
      loadChildren: isLeaf ? null : boundLoadChildren,
      field,
      fullTitle: parentNode ? [...parentNode.fullTitle, fieldTitle] : [fieldTitle],
    };
  });
}

export const AppendsTreeSelect: React.FC<TreeSelectProps & AppendsTreeSelectProps> = (props) => {
  const {
    title,
    value: propsValue,
    onChange,
    collection,
    useCollection = usePropsCollection,
    filter = trueFilter,
    rootOption,
    loadData: propsLoadData,
    ...restProps
  } = props;
  const compile = useCompile();
  const { t } = useTranslation();
  const [optionsMap, setOptionsMap] = useState({});
  const collectionString = useCollection({ collection });
  const [dataSourceName, collectionName] = parseCollectionName(collectionString);
  const app = useApp();
  const { collectionManager } = app.dataSourceManager.getDataSource(dataSourceName);
  const getCollectionFields = (name, predicate) => {
    const instance = collectionManager.getCollection(name);
    // NOTE: condition for compatibility with hidden collections like "attachments"
    return instance ? instance.getAllFields(predicate) : [];
  };
  const treeData = Object.values(optionsMap);
  const value: string | DefaultOptionType[] = useMemo(() => {
    if (props.multiple) {
      return ((propsValue as string[]) || []).map((v) => optionsMap[v]).filter(Boolean);
    }
    return propsValue;
  }, [propsValue, props.multiple, optionsMap]);

  const loadData = useCallback(
    async (option) => {
      if (propsLoadData != null) {
        return propsLoadData(option);
      }
      if (!option.isLeaf && option.loadChildren) {
        const children = option.loadChildren(option);
        setOptionsMap((prev) => {
          return children.reduce((result, item) => Object.assign(result, { [item.value]: item }), { ...prev });
        });
      }
    },
    [propsLoadData],
  );
  // NOTE:
  useEffect(() => {
    const parentNode = rootOption
      ? {
          ...rootOption,
          id: rootOption.value,
          key: rootOption.value,
          title: rootOption.label,
          fullTitle: rootOption.label,
          isLeaf: false,
        }
      : null;
    const tData =
      propsLoadData === null
        ? []
        : getCollectionFieldOptions.call({ compile, getCollectionFields, filter }, collectionName, parentNode);

    const map = tData.reduce((result, item) => Object.assign(result, { [item.value]: item }), {});
    if (parentNode) {
      map[parentNode.value] = parentNode;
    }
    setOptionsMap(map);
  }, [collectionString, rootOption, filter, propsLoadData]);

  // NOTE: preload options in value
  useEffect(() => {
    const arr = (props.multiple ? propsValue : propsValue ? [propsValue] : []) as string[];
    if (!arr?.length || arr.every((v) => Boolean(optionsMap[v]))) {
      return;
    }
    const loaded = [];

    arr.forEach((v) => {
      const paths = v.split('.');
      let option = optionsMap[paths[0]];
      for (let i = 1; i < paths.length; i++) {
        if (!option) {
          break;
        }
        const next = paths.slice(0, i + 1).join('.');
        if (optionsMap[next]) {
          option = optionsMap[next];
          break;
        }
        if (!option.isLeaf && option.loadChildren) {
          const children = option.loadChildren(option);
          if (children?.length) {
            loaded.push(...children);
            option = children.find((item) => item.value === paths.slice(0, i + 1).join('.'));
          }
        }
      }
    });
    setOptionsMap((prev) => {
      return loaded.reduce((result, item) => Object.assign(result, { [item.value]: item }), { ...prev });
    });
  }, [propsValue, treeData.length, props.multiple]);

  const handleChange = useCallback(
    (next: DefaultOptionType[] | string) => {
      if (!props.multiple) {
        onChange(next as string);
        return;
      }

      const newValue = (next as DefaultOptionType[]).map((i) => i.value).filter(Boolean) as string[];
      const valueSet = new Set(newValue);
      const delValue = (value as DefaultOptionType[]).find((i) => !valueSet.has(i.value as string));

      if (delValue) {
        const prefix = `${delValue.value}.`;
        Object.keys(optionsMap).forEach((key) => {
          if (key.startsWith(prefix)) {
            valueSet.delete(key);
          }
        });
      } else {
        newValue.forEach((v) => {
          const paths = v.split('.');
          if (paths.length) {
            for (let i = 1; i <= paths.length; i++) {
              valueSet.add(paths.slice(0, i).join('.'));
            }
          }
        });
      }
      onChange(Array.from(valueSet));
    },
    [props.multiple, value, onChange, optionsMap],
  );

  const TreeTag = useCallback(
    (props) => {
      const { value, onClose, disabled, closable } = props;
      if (!value) {
        return null;
      }
      const { fullTitle } = optionsMap[value] ?? {};
      return (
        <Tag closable={closable && !disabled} onClose={onClose}>
          {fullTitle?.join(' / ')}
        </Tag>
      );
    },
    [optionsMap],
  );

  const filteredValue = Array.isArray(value) ? value.filter((i) => i.value in optionsMap) : value;
  const valueKeys: string[] = props.multiple
    ? (propsValue as string[])
    : propsValue != null
      ? [propsValue as string]
      : [];

  return (
    <TreeSelect
      // @ts-ignore
      role="button"
      data-testid={`select-field${title ? `-${title}` : ''}`}
      value={filteredValue}
      placeholder={t('Select field')}
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      treeDefaultExpandedKeys={valueKeys}
      allowClear={{
        clearIcon: <CloseCircleFilled role="button" aria-label="icon-close" />,
      }}
      treeCheckStrictly={props.multiple}
      treeCheckable={props.multiple}
      tagRender={TreeTag}
      onChange={handleChange as (next) => void}
      treeDataSimpleMode
      treeData={treeData}
      loadData={loadData}
      {...restProps}
      suffixIcon={<DownOutlined />}
    />
  );
};
