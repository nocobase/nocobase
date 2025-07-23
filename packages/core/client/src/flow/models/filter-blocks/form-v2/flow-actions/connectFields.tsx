/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, useFlowSettingsContext } from '@nocobase/flow-engine';
import { FormItem } from '@formily/antd-v5';
import { TreeSelect } from 'antd';
import React from 'react';
import { CollectionBlockModel } from '../../../base/BlockModel';
import { getAllDataModels } from '../utils';
import { sortTree } from '@nocobase/utils/client';

export const connectFields = defineAction({
  name: 'connectFields',
  title: 'Connect fields',
  uiSchema: {
    targets: {
      type: 'array',
      'x-component': ConnectFields,
    },
  },
  handler(ctx, params) {
    ctx.model.setProps('targets', params.targets);
  },
});

// 构建树形数据结构
const buildTreeData = (ctx, fields: any[], prefix = '') => {
  return fields
    .filter((field) => field.filterable && field.options.interface)
    .map((field) => {
      const currentPath = prefix ? `${prefix}.${field.name}` : field.name;
      const label = ctx.t(field.uiSchema?.title) || field.name;

      const treeNode = {
        title: label,
        value: currentPath,
        key: currentPath,
        isLeaf: !field.target, // 如果没有 target，则为叶子节点
        field,
      };

      return treeNode;
    })
    .sort((a, b) => {
      // isLeaf 为 true 的节点排在前面
      if (a.isLeaf && !b.isLeaf) return -1;
      if (!a.isLeaf && b.isLeaf) return 1;
      return 0;
    });
};

function ConnectFields(props) {
  const ctx = useFlowSettingsContext();
  const allDataModels = getAllDataModels(ctx.blockGridModel);
  const [selectedValues, setSelectedValues] = React.useState({});

  const handleSelectChange = (modelUid: string, value: string) => {
    const newValues = {
      ...selectedValues,
      [modelUid]: {
        modelUid,
        fieldPath: value,
      },
    };

    if (!value) {
      delete newValues[modelUid];
    }

    setSelectedValues(newValues);

    // 汇总所有选择的值到数组中
    const allSelectedValues = Object.values(newValues).filter(Boolean);
    props.onChange?.(allSelectedValues);
  };

  return allDataModels
    .map((model: CollectionBlockModel) => {
      if (!(model instanceof CollectionBlockModel)) {
        return null;
      }

      const fields = model.collection?.getFields?.() || [];
      const treeData = buildTreeData(ctx, fields);
      const value = props.value?.find((item) => item.modelUid === model.uid)?.fieldPath;

      return (
        <FormItem label={model.title} key={model.uid}>
          <TreeSelectWrapper
            treeData={treeData}
            value={value}
            onChange={(value) => handleSelectChange(model.uid, value)}
            allowClear
            placeholder="请选择字段"
            treeDataSimpleMode={false}
            showSearch
            treeDefaultExpandAll={false}
            style={{ width: '100%' }}
          />
        </FormItem>
      );
    })
    .filter(Boolean);
}

function TreeSelectWrapper(props) {
  const ctx = useFlowSettingsContext();
  const [treeData, setTreeData] = React.useState(props.treeData || []);

  // 异步加载关系字段的子节点
  const loadData = async (node) => {
    const { key } = node;

    if (node.children?.length) {
      return;
    }

    const targetCollection = node.field.targetCollection;

    if (targetCollection) {
      const targetFields = targetCollection.getFields?.() || [];
      const childNodes = buildTreeData(ctx, targetFields, key);

      node.props.data.children = childNodes;
    }

    setTreeData([...treeData]);
  };

  return <TreeSelect {...props} treeData={treeData} loadData={loadData} />;
}
