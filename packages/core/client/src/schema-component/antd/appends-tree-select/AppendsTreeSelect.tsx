import { Tag, TreeSelect } from 'antd';
import type { DefaultOptionType } from 'rc-tree-select/es/TreeSelect';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions, useCollectionManager, useCompile } from '../../..';

export type AppendsTreeSelectProps = {
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  multiple?: boolean;
  includeAncestors?: boolean;
  collection?: string;
  useCollection?(props: Pick<AppendsTreeSelectProps, 'collection'>): string;
};

type TreeOptionType = Omit<DefaultOptionType, 'value'> & { value: string };

function usePropsCollection({ collection }) {
  return collection;
}

type CallScope = {
  compile?(value: string): string;
  getCollectionFields?(name: any): CollectionFieldOptions[];
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

function getCollectionFieldOptions(this: CallScope, collection, parentNode?): TreeOptionType[] {
  const fields = this.getCollectionFields(collection).filter(isAssociation);
  const boundLoadChildren = loadChildren.bind(this);
  return fields.map((field) => {
    const key = parentNode ? `${parentNode.value}.${field.name}` : field.name;
    const fieldTitle = this.compile(field.uiSchema?.title) ?? field.name;
    const isLeaf = !this.getCollectionFields(field.target).filter(isAssociation).length;
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

export const AppendsTreeSelect: React.FC<AppendsTreeSelectProps> = (props) => {
  const {
    value: propsValue,
    onChange,
    collection,
    useCollection = usePropsCollection,
    includeAncestors = false,
    ...restProps
  } = props;
  const { getCollectionFields } = useCollectionManager();
  const compile = useCompile();
  const { t } = useTranslation();
  const [optionsMap, setOptionsMap] = useState({});
  const baseCollection = useCollection({ collection });
  const treeData = Object.values(optionsMap);
  const value = useMemo(() => propsValue ?? (props.multiple ? [] : undefined), [propsValue, props.multiple]);

  const loadData = useCallback(
    async (option) => {
      if (!option.isLeaf && option.loadChildren) {
        const children = option.loadChildren(option);
        setOptionsMap((prev) => {
          return children.reduce((result, item) => Object.assign(result, { [item.value]: item }), { ...prev });
        });
      }
    },
    [setOptionsMap],
  );

  useEffect(() => {
    const treeData = getCollectionFieldOptions.call({ compile, getCollectionFields }, baseCollection);
    setOptionsMap(treeData.reduce((result, item) => Object.assign(result, { [item.value]: item }), {}));
  }, [collection, baseCollection]);

  useEffect(() => {
    const arr = (props.multiple ? value : value ? [value] : []) as string[];
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
  }, [value, treeData.length, props.multiple]);

  const handleChange = useCallback(
    (next: DefaultOptionType[] | string) => {
      if (!props.multiple) {
        onChange(next as string);
        return;
      }

      const newValue = (next as DefaultOptionType[]).map((i) => i.value).filter(Boolean) as string[];
      const valueSet = new Set(newValue);
      const delValue = (value as string[]).find((i) => !newValue.includes(i));

      if (delValue) {
        const delNode = optionsMap[delValue];
        const prefix = `${delNode.value}.`;
        Object.keys(optionsMap).forEach((key) => {
          if (key.startsWith(prefix)) {
            valueSet.delete(key);
          }
        });
      } else {
        newValue.forEach((v) => {
          const paths = v.split('.');
          if (paths.length) {
            for (let i = 1; i < paths.length; i++) {
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

  const filteredValue = Array.isArray(value) ? value.filter((i) => i in optionsMap) : value;

  return (
    <TreeSelect
      value={filteredValue}
      placeholder={t('Select field')}
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      treeDefaultExpandedKeys={Array.isArray(filteredValue) ? filteredValue : filteredValue && [filteredValue]}
      allowClear
      treeCheckStrictly={props.multiple}
      treeCheckable={props.multiple}
      tagRender={TreeTag}
      onChange={(handleChange as unknown) as () => void}
      treeDataSimpleMode
      treeData={treeData}
      loadData={loadData}
      {...restProps}
    />
  );
};
