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
const buildTreeData = (ctx, fields: any[], prefix = '', selectedPath = '', labelPrefix = '') => {
  return fields
    .filter((field) => field.filterable && field.options.interface)
    .map((field) => {
      const currentPath = prefix ? `${prefix}.${field.name}` : field.name;
      const label = ctx.t(field.uiSchema?.title) || field.name;
      const fullLabel = labelPrefix ? `${labelPrefix} / ${label}` : label;

      const treeNode: any = {
        title: label,
        value: currentPath,
        key: currentPath,
        fullLabel: fullLabel,
        isLeaf: !field.target, // 如果没有 target，则为叶子节点
        field,
      };

      // 如果选中的路径包含当前路径，且当前字段有关系目标，则预加载子节点
      if (selectedPath && selectedPath.startsWith(currentPath + '.') && field.target) {
        const targetCollection = field.targetCollection;
        if (targetCollection) {
          const targetFields = targetCollection.getFields?.() || [];
          treeNode.children = buildTreeData(ctx, targetFields, currentPath, selectedPath, fullLabel);
        }
      }

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

  const handleSelectChange = (modelUid: string, value: string) => {
    const newValues = {};
    const selectedValues = props.value || [];
    selectedValues.forEach((item) => {
      newValues[item.modelUid] = item;
    });

    if (value != null && value !== '') {
      newValues[modelUid] = {
        modelUid,
        fieldPath: value,
      };
    } else {
      delete newValues[modelUid]; // 如果值为空，则删除该模型的选择
    }

    // 汇总所有选择的值到数组中
    const allSelectedValues = Object.values(newValues).filter(Boolean);
    props.onChange?.(allSelectedValues);
  };

  return (
    <div>
      {/* 添加操作说明 */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#0369a1',
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: '8px' }}>字段连接配置说明：</div>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>这里的每个选择框都对应页面中的一个区块</li>
          <li>选中一个字段后，点击“确定”，就完成了字段之间的连接</li>
          <li>支持选择关系字段的子字段（如：用户.部门.名称）</li>
        </ul>
      </div>

      {allDataModels
        .map((model: CollectionBlockModel) => {
          if (!(model instanceof CollectionBlockModel)) {
            return null;
          }

          const fields = model.collection?.getFields?.() || [];
          const value = props.value?.find((item) => item.modelUid === model.uid)?.fieldPath;
          const treeData = buildTreeData(ctx, fields, '', value, '');

          return (
            <FormItem label={`${model.title} #${model.uid.substring(0, 4)}`} key={model.uid}>
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
                treeLine
              />
            </FormItem>
          );
        })
        .filter(Boolean)}
    </div>
  );
}

function TreeSelectWrapper(props) {
  const ctx = useFlowSettingsContext();
  const [treeData, setTreeData] = React.useState(props.treeData || []);
  const [expandedKeys, setExpandedKeys] = React.useState([]);

  // 根据 value 计算需要展开的路径
  React.useEffect(() => {
    if (props.value) {
      const pathSegments = props.value.split('.');
      const keysToExpand = [];

      // 生成所有需要展开的父级路径
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const expandKey = pathSegments.slice(0, i + 1).join('.');
        keysToExpand.push(expandKey);
      }

      setExpandedKeys(keysToExpand);
    }
  }, [props.value]);

  // 异步加载关系字段的子节点
  const loadData = async (node) => {
    const { key } = node;

    if (node.children?.length) {
      return;
    }

    const targetCollection = node.field.targetCollection;

    if (targetCollection) {
      const targetFields = targetCollection.getFields?.() || [];
      const parentFullLabel = node.fullLabel || node.title;
      const childNodes = buildTreeData(ctx, targetFields, key, '', parentFullLabel);

      node.props.data.children = childNodes;
    }

    setTreeData([...treeData]);
  };

  // 自定义搜索过滤函数，根据 title (label) 进行搜索
  const filterTreeNode = (inputValue: string, treeNode: any) => {
    const title = treeNode.title;
    if (typeof title === 'string') {
      return title.toLowerCase().includes(inputValue.toLowerCase());
    }
    return false;
  };

  return (
    <TreeSelect
      {...props}
      treeData={treeData}
      loadData={loadData}
      treeExpandedKeys={expandedKeys}
      onTreeExpand={(expandedKeys) => setExpandedKeys(expandedKeys)}
      filterTreeNode={filterTreeNode}
      treeNodeLabelProp="fullLabel"
    />
  );
}
