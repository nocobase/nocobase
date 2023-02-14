import React from 'react';
import { TreeSelect, Tag } from 'antd';
import type { DefaultOptionType } from 'rc-tree-select/lib/TreeSelect';
import { useForm } from '@formily/react';
import { CollectionFieldOptions, useCollectionManager, useCompile, useRecord } from '@nocobase/client';
import { useSnapshotTranslation } from '../locale';
import { useTopRecord } from '../interface';

export type TreeCacheMapNode = {
  parent?: TreeCacheMapNode;
  title: string;
  path: string;
  children?: TreeCacheMapNode[];
};

export type AppendsTreeSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

type TreeOptionType = Omit<DefaultOptionType, 'value'> & { value: string };

export const AppendsTreeSelect: React.FC<AppendsTreeSelectProps> = (props) => {
  const { value = [], onChange, ...restProps } = props;
  const record = useTopRecord();
  const { getCollectionFields, getCollectionField } = useCollectionManager();
  const compile = useCompile();
  const formValues = useForm().values;
  const { t } = useSnapshotTranslation();

  const fieldsToOptions = (
    fields: CollectionFieldOptions[] = [],
    fieldPath: CollectionFieldOptions[] = [],
  ): TreeOptionType[] => {
    const filter = (i: CollectionFieldOptions) =>
      !!i.target && !!i.interface && !fieldPath.find((p) => p.target === i.target);
    return fields.filter(filter).map((i) => ({
      title: compile(i.uiSchema?.title) ?? i.name,
      value: fieldPath
        .map((p) => p.name)
        .concat(i.name)
        .join('.'),
      children: fieldsToOptions(getCollectionFields(i.target), [...fieldPath, i]),
    }));
  };

  const treeData = fieldsToOptions(
    getCollectionFields(getCollectionField(`${record.name}.${formValues.targetField}`)?.target),
  );

  const valueMap: Record<string, TreeCacheMapNode> = {};

  function loops(list: TreeOptionType[], parent?: TreeCacheMapNode) {
    return (list || []).map(({ children, value, title }) => {
      const node: TreeCacheMapNode = (valueMap[value] = {
        parent,
        path: value,
        title,
      });
      node.children = loops(children, node);
      return node;
    });
  }

  loops(treeData);

  const handleChange = (newNodes: DefaultOptionType[]) => {
    const newValue = newNodes.map((i) => i.value) as string[];
    const valueSet = new Set(newValue);
    const delValue = value.find((i) => !newValue.includes(i));

    if (delValue) {
      const delNode = valueMap[delValue];
      const delNodeValue = (node: TreeCacheMapNode) => {
        valueSet.delete(node.path);
        node.children?.forEach((child) => delNodeValue(child));
      };
      delNodeValue(delNode);
    } else {
      newValue.forEach((v) => {
        let current = valueMap[v];
        while ((current = current.parent)) {
          valueSet.add(current.path);
        }
      });
    }
    onChange(Array.from(valueSet));
  };

  const TreeTag = (props) => {
    const { value, onClose, disabled, closable } = props;
    let node = valueMap[value];
    let text = node?.title;
    while ((node = node?.parent)) {
      text = `${node.title} / ${text}`;
    }
    return (
      <Tag closable={closable && !disabled} onClose={onClose}>
        {text}
      </Tag>
    );
  };

  const filterdValue = Array.isArray(value) ? value.filter((i) => i in valueMap) : value;

  return (
    <TreeSelect
      value={filterdValue}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder={t('Please select')}
      showCheckedStrategy="SHOW_ALL"
      allowClear
      multiple
      treeCheckStrictly
      treeCheckable
      tagRender={TreeTag}
      onChange={handleChange as unknown as () => void}
      treeData={treeData}
      {...restProps}
    />
  );
};
