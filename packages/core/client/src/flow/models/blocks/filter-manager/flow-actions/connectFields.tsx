/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FormItem } from '@formily/antd-v5';
import { defineAction, tExpr, FlowContext, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Button, Dropdown, Segmented, Select, Switch, TreeSelect } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { CollectionBlockModel } from '../../../base';
import { FilterFormFieldModel } from '../../filter-form/fields';
import { ConnectFieldsConfig } from '../FilterManager';
import { getAllDataModels } from '../utils';

export const connectFields = defineAction({
  name: 'connectFields',
  title: tExpr('Connect fields'),
  uiSchema(ctx: FlowContext) {
    return {
      value: {
        type: 'object',
        'x-component': ConnectFields,
      },
    };
  },
  beforeParamsSave(ctx, params) {
    if (!_.isEmpty(params.value)) {
      ctx.model.context.filterManager.saveConnectFieldsConfig(ctx.model.uid, params.value);
    }
    ctx.exit();
  },
  handler(ctx, params) {},
});

// 构建树形数据结构
const buildTreeData = (ctx, fields: any[], prefix = '', selectedPaths = '', labelPrefix = '') => {
  const selectedPathsArray = selectedPaths ? selectedPaths.split(',').filter(Boolean) : [];

  return fields
    .map((field) => {
      const currentPath = prefix ? `${prefix}.${field.name}` : field.name;
      const label = field.title || field.name;
      const fullLabel = labelPrefix ? `${labelPrefix} / ${label}` : label;

      const treeNode: any = {
        title: label,
        value: currentPath,
        key: currentPath,
        fullLabel: fullLabel,
        isLeaf: !field.target, // 如果没有 target，则为叶子节点
        field, // 保留字段信息以便后续使用
      };

      // 如果任一选中的路径包含当前路径，且当前字段有关系目标，则预加载子节点
      const shouldLoadChildren = selectedPathsArray.some(
        (path) => path && path.startsWith(currentPath + '.') && field.target,
      );

      if (shouldLoadChildren) {
        if (field.filterable?.children?.length) {
          treeNode.children = buildTreeData(ctx, field.filterable.children, currentPath, selectedPaths, fullLabel);
        } else {
          const targetCollection = field.targetCollection;
          if (targetCollection) {
            const targetFields = targetCollection.getFields?.() || [];
            treeNode.children = buildTreeData(ctx, targetFields, currentPath, selectedPaths, fullLabel);
          }
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
  const ctx = useFlowSettingsContext<FilterFormFieldModel>();
  const allDataModels = useMemo(() => getAllDataModels(ctx.blockGridModel), [ctx.blockGridModel]);
  const [value, setValue] = useState(() => ctx.model.context.filterManager.getConnectFieldsConfig(ctx.model.uid));
  const [modelFields, setModelFields] = useState<Record<string, any[]>>({});

  // 为每个目标区块维护输入模式状态
  const [inputModes, setInputModes] = useState<Record<string, 'field-select' | 'text-input'>>({});

  // 异步加载字段数据
  React.useEffect(() => {
    const loadFields = async () => {
      const fieldsMap: Record<string, any[]> = {};
      const selectedModelUids = (value?.targets || []).map((item) => item.targetId);

      for (const model of allDataModels.filter((model: CollectionBlockModel) =>
        selectedModelUids.includes(model.uid),
      )) {
        const fields = (await (model as any).getFilterFields?.()) || [];
        fieldsMap[model.uid] = fields;
      }

      setModelFields(fieldsMap);
    };

    loadFields();
  }, [value?.targets, allDataModels]);

  // 处理输入模式切换
  const handleInputModeChange = (modelUid: string, mode: 'field-select' | 'text-input') => {
    setInputModes((prev) => ({
      ...prev,
      [modelUid]: mode,
    }));
  };

  // 获取指定区块的输入模式
  const getInputMode = (modelUid: string): 'field-select' | 'text-input' => {
    return inputModes[modelUid] || 'field-select';
  };

  const handleSelectChange = (modelUid: string, values: string[]) => {
    const newValues: Record<string, { targetId: string; filterPaths: string[] }> = {};
    const selectedValues = value?.targets || [];
    selectedValues.forEach((item) => {
      newValues[item.targetId] = item;
    });

    newValues[modelUid] = {
      targetId: modelUid,
      filterPaths: values, // 改为数组存储多个字段路径
    };

    // 汇总所有选择的值到数组中
    const allSelectedTargets = Object.values(newValues);

    props.onChange?.({
      targets: allSelectedTargets,
    });
    setValue({
      targets: allSelectedTargets,
    });
  };

  // 处理添加/移除目标区块
  const handleToggleBlock = (modelUid: string, checked: boolean) => {
    const newValues: Record<string, { targetId: string; filterPaths: string[] }> = {};
    const selectedValues = value?.targets || [];
    selectedValues.forEach((item) => {
      newValues[item.targetId] = item;
    });

    if (checked) {
      // 添加区块（设置为空字段路径数组）
      newValues[modelUid] = {
        targetId: modelUid,
        filterPaths: [], // 改为空数组
      };
    } else {
      // 移除区块
      delete newValues[modelUid];
    }

    const allSelectedTargets = Object.values(newValues);
    props.onChange?.({
      targets: allSelectedTargets,
    });
    setValue({
      targets: allSelectedTargets,
    });
  };

  // 处理删除目标区块
  const handleRemoveBlock = (modelUid: string) => {
    const newValues: Record<string, { targetId: string; filterPaths: string[] }> = {};
    const selectedValues = value?.targets || [];
    selectedValues.forEach((item) => {
      if (item.targetId !== modelUid) {
        newValues[item.targetId] = item;
      }
    });

    const allSelectedTargets = Object.values(newValues);
    props.onChange?.({
      targets: allSelectedTargets,
    });
    setValue({
      targets: allSelectedTargets,
    });
  };

  // 获取已选择的区块UIDs
  const selectedModelUids = (value?.targets || []).map((item) => item.targetId);

  // 生成下拉菜单项
  const menuItems = allDataModels
    .filter((model: any) => model.resource?.supportsFilter)
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
        <div style={{ fontWeight: 500, marginBottom: '8px' }}>{ctx.t('Configuration:')}</div>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>{ctx.t('Available "target blocks" are all data blocks on the current page')}</li>
          <li>
            {ctx.t(
              'Support filtering multiple blocks simultaneously, support deep selection of relationship fields (e.g.: User/Department/Name)',
            )}
          </li>
        </ul>
      </div>
      {allDataModels
        .filter((model: CollectionBlockModel) => {
          // 只显示已选择的区块
          return selectedModelUids.includes(model.uid) && modelFields[model.uid];
        })
        .sort((a, b) => {
          // 按照在 value.targets 中的顺序排序
          const aIndex = (value?.targets || []).findIndex((item) => item.targetId === a.uid);
          const bIndex = (value?.targets || []).findIndex((item) => item.targetId === b.uid);
          return aIndex - bIndex;
        })
        .map((model: CollectionBlockModel) => {
          const fields = modelFields[model.uid] || [];
          const values = value?.targets?.find((item) => item.targetId === model.uid)?.filterPaths || [];
          const treeData = buildTreeData(ctx, fields, '', values.join(','), '');
          const currentInputMode = getInputMode(model.uid);

          return (
            <FormItem key={model.uid} label={`${model.title} #${model.uid.substring(0, 4)}`}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* 根据模式渲染不同的输入组件 */}
                <div style={{ flex: 1 }}>
                  {currentInputMode === 'field-select' ? (
                    <TreeSelectWrapper
                      treeData={treeData}
                      value={values}
                      onChange={(values) => handleSelectChange(model.uid, values)}
                      multiple
                      allowClear
                      placeholder={ctx.t('Please select fields to filter')}
                      treeDataSimpleMode={false}
                      showSearch
                      treeDefaultExpandAll={false}
                      style={{ width: '100%' }}
                      treeLine
                      showCheckedStrategy="SHOW_CHILD"
                    />
                  ) : (
                    <Select
                      mode="tags"
                      value={values}
                      onChange={(values) => handleSelectChange(model.uid, values)}
                      placeholder={ctx.t('Separate multiple values with comma or Enter')}
                      style={{ width: '100%' }}
                      allowClear
                      tokenSeparators={[',']}
                      open={false}
                      suffixIcon={null}
                    />
                  )}
                </div>
                {/* 模式选择器和删除按钮 */}
                <Segmented
                  value={currentInputMode}
                  onChange={(mode) => handleInputModeChange(model.uid, mode as 'field-select' | 'text-input')}
                  options={[
                    { label: ctx.t('Dropdown select'), value: 'field-select' },
                    { label: ctx.t('Text input'), value: 'text-input' },
                  ]}
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveBlock(model.uid)}
                  style={{ color: '#8c8c8c' }}
                  title={ctx.t('Delete this target block')}
                />
              </div>
            </FormItem>
          );
        })}

      {/* 添加目标区块按钮 */}
      <div style={{ marginTop: '16px' }}>
        <Dropdown menu={{ items: menuItems }} trigger={['hover']} autoFocus={false}>
          <Button type="dashed" icon={<PlusOutlined />} style={{ width: '100%' }}>
            {ctx.t('Add target block')}
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
    const filterableChildren = node.field.filterable?.children || [];

    if (filterableChildren.length) {
      const childNodes = buildTreeData(ctx, filterableChildren, key, '', node.fullLabel || node.title);
      node.props.data.children = childNodes;
    } else if (targetCollection) {
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
