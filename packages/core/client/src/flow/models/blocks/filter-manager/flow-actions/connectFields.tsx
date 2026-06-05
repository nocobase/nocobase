/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { FormItem } from '@formily/antd-v5';
import { defineAction, tExpr, FlowContext, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Button, Cascader, Dropdown, Segmented, Select, Switch } from 'antd';
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

// 构建级联选项数据结构
const buildCascaderOptions = (ctx, fields: any[], prefix = '', selectedPaths: string[] = [], labelPrefix = '') => {
  const selectedPathsArray = selectedPaths.filter(Boolean);

  return fields
    .map((field) => {
      const currentPath = prefix ? `${prefix}.${field.name}` : field.name;
      const label = field.title || field.name;
      const fullLabel = labelPrefix ? `${labelPrefix} / ${label}` : label;
      const isLeaf = !field.target;

      const option: any = {
        label,
        value: field.name,
        isLeaf,
        disableCheckbox: !isLeaf,
        meta: {
          field,
          fullPath: currentPath,
          fullLabel,
        },
      };

      // 如果任一选中的路径包含当前路径，且当前字段有关系目标，则预加载子节点
      const shouldLoadChildren =
        !isLeaf && selectedPathsArray.some((path) => path && path.startsWith(currentPath + '.'));

      if (shouldLoadChildren) {
        if (field.filterable?.children?.length) {
          option.children = buildCascaderOptions(ctx, field.filterable.children, currentPath, selectedPaths, fullLabel);
        } else {
          const targetCollection = field.targetCollection;
          if (targetCollection) {
            const targetFields = targetCollection.getFields?.() || [];
            option.children = buildCascaderOptions(ctx, targetFields, currentPath, selectedPaths, fullLabel);
          }
        }
      }

      return option;
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
          const cascaderOptions = buildCascaderOptions(ctx, fields, '', values, '');
          const cascaderValue = values.map((path) => path.split('.'));
          const currentInputMode = getInputMode(model.uid);

          return (
            <FormItem key={model.uid} label={`${model.title} #${model.uid.substring(0, 4)}`}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* 根据模式渲染不同的输入组件 */}
                <div style={{ flex: 1 }}>
                  {currentInputMode === 'field-select' ? (
                    <CascaderWrapper
                      options={cascaderOptions}
                      value={cascaderValue}
                      onChange={(paths) => {
                        const nextValues = (paths || []).map((items) => items.join('.'));
                        handleSelectChange(model.uid, nextValues);
                      }}
                      multiple
                      allowClear
                      placeholder={ctx.t('Please select fields to filter')}
                      style={{ width: '100%' }}
                      showSearch={{
                        filter: (inputValue, path) =>
                          path.some((option) =>
                            (option.label || '').toString().toLowerCase().includes(inputValue.toLowerCase()),
                          ),
                      }}
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

function CascaderWrapper(
  props: Readonly<
    Omit<React.ComponentProps<typeof Cascader>, 'value' | 'onChange'> & {
      value?: string[][];
      onChange?: (value?: string[][]) => void;
      options?: any[];
    }
  >,
) {
  const ctx = useFlowSettingsContext();
  const [options, setOptions] = React.useState(props.options || []);
  const optionsKey = React.useMemo(() => {
    return (props.options || [])
      .map((option) => option?.meta?.fullPath || option?.value)
      .filter(Boolean)
      .join('|');
  }, [props.options]);
  const popupClassName = cx(
    props.popupClassName,
    css`
      .ant-cascader-checkbox {
        display: none;
      }
    `,
  );

  React.useEffect(() => {
    setOptions(props.options || []);
  }, [optionsKey]);

  const selectedSet = React.useMemo(() => {
    const values: string[][] = Array.isArray(props.value) ? props.value : [];
    return new Set(values.map((value) => value.join('.')));
  }, [props.value]);

  const handleToggleOption = (option, checked) => {
    const fullPath = option?.meta?.fullPath;
    if (!fullPath) {
      return;
    }
    const nextSet = new Set(selectedSet);
    if (checked) {
      nextSet.add(fullPath);
    } else {
      nextSet.delete(fullPath);
    }
    const nextValue = Array.from(nextSet).map((path) => path.split('.'));
    props.onChange?.(nextValue);
  };

  const optionRender = (option) => {
    const fullPath = option?.meta?.fullPath;
    const isLeaf = !!option?.isLeaf;
    const checked = !!fullPath && selectedSet.has(fullPath);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span>{option.label}</span>
        {isLeaf ? (
          <Switch
            size="small"
            checked={checked}
            onClick={(_, event) => event?.stopPropagation?.()}
            onChange={(nextChecked, event) => {
              event?.stopPropagation?.();
              handleToggleOption(option, nextChecked);
            }}
          />
        ) : null}
      </div>
    );
  };

  const displayRender =
    props.displayRender ||
    ((labels, selectedOptions) => {
      const lastOption = selectedOptions?.[selectedOptions.length - 1];
      const fullLabel = lastOption?.meta?.fullLabel;
      if (fullLabel) {
        return fullLabel;
      }
      // 兜底按层级拼接，保证标签可读
      return labels.join(' / ');
    });

  // 异步加载关系字段的子节点
  const loadData = async (selectedOptions) => {
    const target = selectedOptions[selectedOptions.length - 1];
    if (!target || target.children?.length) {
      return;
    }

    const meta = target.meta || {};
    const field = meta.field;
    const fullPath = meta.fullPath;

    if (!field || !fullPath) {
      target.isLeaf = true;
      setOptions((prev) => [...prev]);
      return;
    }

    const filterableChildren = field.filterable?.children || [];
    let childFields = [];

    if (filterableChildren.length) {
      childFields = filterableChildren;
    } else if (field.targetCollection) {
      childFields = field.targetCollection.getFields?.() || [];
    }

    if (!childFields.length) {
      target.isLeaf = true;
      setOptions((prev) => [...prev]);
      return;
    }

    target.children = buildCascaderOptions(ctx, childFields, fullPath, [], meta.fullLabel || target.label);
    setOptions((prev) => [...prev]);
  };

  return (
    // @ts-ignore
    <Cascader
      allowClear
      {...props}
      options={options}
      loadData={loadData}
      displayRender={displayRender}
      optionRender={optionRender}
      popupClassName={popupClassName}
    />
  );
}
