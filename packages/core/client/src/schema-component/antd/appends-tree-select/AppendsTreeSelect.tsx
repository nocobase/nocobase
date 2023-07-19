import { CollectionFieldOptions, useCollectionManager, useCompile } from '../../..';
import { Tag, TreeSelect } from 'antd';
import type { DefaultOptionType } from 'rc-tree-select/es/TreeSelect';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type AppendsTreeSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
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
}

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
  const { value = [], onChange, collection, useCollection = usePropsCollection, ...restProps } = props;
  const { getCollectionFields } = useCollectionManager();
  const compile = useCompile();
  const { t } = useTranslation();
  const [optionsMap, setOptionsMap] = useState({});
  const baseCollection = useCollection({ collection });
  const treeData = Object.values(optionsMap);

  const loadData = useCallback(async (option) => {
    if (!option.isLeaf && option.loadChildren) {
      const children = option.loadChildren(option);
      setOptionsMap((prev) => {
        return children.reduce((result, item) => Object.assign(result, { [item.value]: item }), { ...prev });
      });
    }
  }, [setOptionsMap]);

  useEffect(() => {
    const treeData = getCollectionFieldOptions.call({ compile, getCollectionFields }, baseCollection);
    setOptionsMap(treeData.reduce((result, item) => Object.assign(result, { [item.value]: item }), {}));
  }, [collection, baseCollection]);

  useEffect(() => {
    if (!value?.length || value.every(v => Boolean(optionsMap[v]))) {
      return;
    }
    const loaded = [];

    value.forEach((v) => {
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
            option = children.find(item => item.value === paths.slice(0, i + 1).join('.'));
          }
        }
      }
    });
    setOptionsMap((prev) => {
      return loaded.reduce((result, item) => Object.assign(result, { [item.value]: item }), { ...prev });
    });
  }, [value, treeData.length]);

  const handleChange = useCallback((newNodes: DefaultOptionType[]) => {
    const newValue = newNodes.map((i) => i.value).filter(Boolean) as string[];
    const valueSet = new Set(newValue);
    const delValue = value.find((i) => !newValue.includes(i));

    if (delValue) {
      const delNode = optionsMap[delValue];
      const prefix = `${delNode.value}.`;
      Object.keys(optionsMap)
        .forEach((key) => {
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
  }, [value, optionsMap]);

  const TreeTag = useCallback((props) => {
    const { value, onClose, disabled, closable } = props;
    const { fullTitle } = optionsMap[value];
    return (
      <Tag closable={closable && !disabled} onClose={onClose}>{fullTitle.join(' / ')}</Tag>
    );
  }, [optionsMap]);

  const filterdValue = Array.isArray(value) ? value.filter((i) => i in optionsMap) : value;

  return (
    <TreeSelect
      value={filterdValue}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder={t('Select field')}
      showCheckedStrategy="SHOW_ALL"
      allowClear
      multiple
      treeCheckStrictly
      treeCheckable
      tagRender={TreeTag}
      onChange={handleChange as unknown as () => void}
      treeDataSimpleMode
      treeData={treeData}
      loadData={loadData}
      {...restProps}
    />
  );
};
