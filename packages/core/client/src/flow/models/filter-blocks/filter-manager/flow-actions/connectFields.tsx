/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, FlowContext, useFlowSettingsContext } from '@nocobase/flow-engine';
import { FormItem } from '@formily/antd-v5';
import { TreeSelect, Button, Dropdown, Switch, Select, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import { CollectionBlockModel } from '../../../base/BlockModel';
import { getAllDataModels } from '../../utils';
import _ from 'lodash';
import { FilterFormEditableFieldModel } from '../../form-v2/fields';
import { ConnectFieldsConfig } from '../FilterManager';

export const connectFields = defineAction({
  name: 'connectFields',
  title: 'Connect fields',
  uiSchema(ctx: FlowContext) {
    return {
      value: {
        type: 'object',
        'x-component': ConnectFields,
      },
    };
  },
  afterParamsSave(ctx, params) {
    ctx.model.context.filterManager.saveConnectFieldsConfig(ctx.model.uid, params.value);
  },
  handler(ctx, params) {},
});

// 构建树形数据结构
const buildTreeData = (ctx, fields: any[], prefix = '', selectedPaths = '', labelPrefix = '') => {
  const selectedPathsArray = selectedPaths ? selectedPaths.split(',').filter(Boolean) : [];

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

      // 如果任一选中的路径包含当前路径，且当前字段有关系目标，则预加载子节点
      const shouldLoadChildren = selectedPathsArray.some(
        (path) => path && path.startsWith(currentPath + '.') && field.target,
      );

      if (shouldLoadChildren) {
        const targetCollection = field.targetCollection;
        if (targetCollection) {
          const targetFields = targetCollection.getFields?.() || [];
          treeNode.children = buildTreeData(ctx, targetFields, currentPath, selectedPaths, fullLabel);
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

function ConnectFields(
  props: Readonly<{ value: ConnectFieldsConfig; onChange?: (value: ConnectFieldsConfig) => void }>,
) {
  const ctx = useFlowSettingsContext<FilterFormEditableFieldModel>();
  const allDataModels = getAllDataModels(ctx.blockGridModel);
  const operatorOptions = (ctx.model.context.collectionField.filterable?.operators || []).map((op) => ({
    ...op,
    label: ctx.t(op.label),
  }));
  const defaultOperator = operatorOptions[0]?.value || '';
  const value = ctx.model.context.filterManager.getConnectFieldsConfig(ctx.model.uid);

  if (!value?.operator) {
    _.set(props, 'value.operator', defaultOperator);
  }

  const handleSelectChange = (modelUid: string, values: string[]) => {
    const newValues: Record<string, { targetModelUid: string; targetFieldPaths: string[] }> = {};
    const selectedValues = value?.targets || [];
    selectedValues.forEach((item) => {
      newValues[item.targetModelUid] = item;
    });

    if (values && values.length > 0) {
      newValues[modelUid] = {
        targetModelUid: modelUid,
        targetFieldPaths: values, // 改为数组存储多个字段路径
      };
    } else {
      delete newValues[modelUid]; // 如果值为空，则删除该模型的选择
    }

    // 汇总所有选择的值到数组中
    const allSelectedTargets = Object.values(newValues);

    props.onChange?.({
      operator: value?.operator || defaultOperator,
      targets: allSelectedTargets,
    });
  };

  // 处理添加/移除目标区块
  const handleToggleBlock = (modelUid: string, checked: boolean) => {
    const newValues: Record<string, { targetModelUid: string; targetFieldPaths: string[] }> = {};
    const selectedValues = value?.targets || [];
    selectedValues.forEach((item) => {
      newValues[item.targetModelUid] = item;
    });

    if (checked) {
      // 添加区块（设置为空字段路径数组）
      newValues[modelUid] = {
        targetModelUid: modelUid,
        targetFieldPaths: [], // 改为空数组
      };
    } else {
      // 移除区块
      delete newValues[modelUid];
    }

    const allSelectedTargets = Object.values(newValues);
    props.onChange?.({
      operator: value?.operator || defaultOperator,
      targets: allSelectedTargets,
    });
  };

  // 处理删除目标区块
  const handleRemoveBlock = (modelUid: string) => {
    const newValues: Record<string, { targetModelUid: string; targetFieldPaths: string[] }> = {};
    const selectedValues = value?.targets || [];
    selectedValues.forEach((item) => {
      if (item.targetModelUid !== modelUid) {
        newValues[item.targetModelUid] = item;
      }
    });

    const allSelectedTargets = Object.values(newValues);
    props.onChange?.({
      operator: value?.operator || defaultOperator,
      targets: allSelectedTargets,
    });
  };

  const handleDefaultOperatorChange = (value) => {
    props.onChange?.({
      operator: value,
      targets: value?.targets || [],
    });
  };

  // 获取已选择的区块UIDs
  const selectedModelUids = (value?.targets || []).map((item) => item.targetModelUid);

  // 生成下拉菜单项
  const menuItems = allDataModels
    .filter((model) => model instanceof CollectionBlockModel)
    .map((model: CollectionBlockModel) => {
      const isSelected = selectedModelUids.includes(model.uid);

      return {
        key: model.uid,
        label: (
          <button
            type="button"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minWidth: '200px',
              border: 'none',
              background: 'none',
              padding: '0',
              width: '100%',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBlock(model.uid, !isSelected);
            }}
          >
            <span style={{ marginRight: '16px' }}>
              {model.title} #{model.uid.substring(0, 4)}
            </span>
            <Switch size="small" checked={isSelected} />
          </button>
        ),
      };
    });

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
        <div style={{ fontWeight: 500, marginBottom: '8px' }}>配置说明：</div>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>可选的“目标区块”为当前页面中的所有数据区块</li>
          <li>支持同时筛选多个区块，支持关系字段深层选择（如：用户/部门/名称）</li>
        </ul>
      </div>
      {ctx.model.enableOperator && (
        <>
          <FormItem label="默认操作符">
            <Select
              options={operatorOptions}
              placeholder="请选择操作符"
              value={value.operator}
              onChange={handleDefaultOperatorChange}
            />
          </FormItem>
          <Divider />
        </>
      )}

      {allDataModels
        .filter((model: CollectionBlockModel) => {
          if (!(model instanceof CollectionBlockModel)) {
            return false;
          }
          // 只显示已选择的区块
          return selectedModelUids.includes(model.uid);
        })
        .sort((a, b) => {
          // 按照在 value.targets 中的顺序排序
          const aIndex = (value?.targets || []).findIndex((item) => item.targetModelUid === a.uid);
          const bIndex = (value?.targets || []).findIndex((item) => item.targetModelUid === b.uid);
          return aIndex - bIndex;
        })
        .map((model: CollectionBlockModel) => {
          const fields = model.collection?.getFields?.() || [];
          const values = value?.targets?.find((item) => item.targetModelUid === model.uid)?.targetFieldPaths || [];
          const treeData = buildTreeData(ctx, fields, '', values.join(','), '');

          return (
            <FormItem key={model.uid} label={`${model.title} #${model.uid.substring(0, 4)}`}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <TreeSelectWrapper
                  treeData={treeData}
                  value={values}
                  onChange={(values) => handleSelectChange(model.uid, values)}
                  multiple
                  allowClear
                  placeholder="请选择字段"
                  treeDataSimpleMode={false}
                  showSearch
                  treeDefaultExpandAll={false}
                  style={{ width: '100%' }}
                  treeLine
                  showCheckedStrategy="SHOW_CHILD"
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveBlock(model.uid)}
                  style={{ color: '#8c8c8c' }}
                  title="删除此目标区块"
                />
              </div>
            </FormItem>
          );
        })}

      {/* 添加目标区块按钮 */}
      <div style={{ marginTop: '16px' }}>
        <Dropdown menu={{ items: menuItems }} trigger={['hover']} autoFocus={false}>
          <Button type="dashed" icon={<PlusOutlined />} style={{ width: '100%' }}>
            添加目标区块
          </Button>
        </Dropdown>
      </div>
    </div>
  );
}

function TreeSelectWrapper(props) {
  const ctx = useFlowSettingsContext();
  const [treeData, setTreeData] = React.useState(props.treeData || []);
  const [expandedKeys, setExpandedKeys] = React.useState([]);

  // 根据 value 计算需要展开的路径
  React.useEffect(() => {
    if (props.value && Array.isArray(props.value) && props.value.length > 0) {
      const keysToExpand = [];

      // 处理多个值的展开路径
      props.value.forEach((selectedPath) => {
        if (selectedPath) {
          const pathSegments = selectedPath.split('.');
          // 生成所有需要展开的父级路径
          for (let i = 0; i < pathSegments.length - 1; i++) {
            const expandKey = pathSegments.slice(0, i + 1).join('.');
            if (!keysToExpand.includes(expandKey)) {
              keysToExpand.push(expandKey);
            }
          }
        }
      });

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
