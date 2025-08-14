/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Input, InputNumber, Select, Space, Switch } from 'antd';
import { NumberPicker } from '@formily/antd-v5';
import merge from 'lodash/merge';
import { observer } from '@formily/reactive-react';
import { VariableInput, type MetaTreeNode, type Converters, FlowModel } from '@nocobase/flow-engine';
import { DateFilterDynamicComponent } from '../../../schema-component';

export interface VariableFilterItemValue {
  leftValue: string;
  operator: string;
  rightValue: string;
}

export interface VariableFilterItemProps {
  /** 筛选条件值对象 */
  value: VariableFilterItemValue;
  model: FlowModel;
}

/**
 * 上下文筛选项组件
 */
export const VariableFilterItem: React.FC<VariableFilterItemProps> = observer(({ value, model }) => {
  const t = model.translate;
  const { leftValue, operator, rightValue } = value;

  // 左侧选中的元数据节点
  const [leftMeta, setLeftMeta] = useState<MetaTreeNode | null>(null);

  // 基于字段接口的动态操作符元数据（与原筛选逻辑一致：来源于 collectionFieldInterfaceManager + visible 过滤）
  const operatorMetaList = useMemo(() => {
    if (!leftMeta?.interface) return [];
    const dm = model.context.app?.dataSourceManager;
    const fi = dm?.collectionFieldInterfaceManager?.getFieldInterface(leftMeta.interface);
    const ops = fi?.filterable?.operators || [];
    return ops.filter((op) => !op.visible || op.visible(leftMeta as any));
  }, [leftMeta, model]);

  // Select 的可见选项
  const operatorOptions = useMemo(() => {
    return operatorMetaList.map((op) => ({
      value: op.value,
      label: typeof op.label === 'string' ? t(op.label) : (op.label as any)?.toString?.() || String(op.label),
    }));
  }, [operatorMetaList, t]);

  // 处理左侧值变化（值由 converters 决定如何解析）
  const handleLeftChange = useCallback(
    (variableValue: string) => {
      value.leftValue = variableValue || '';
    },
    [value],
  );

  // 自定义转换器来捕获 MetaTreeNode，并在选择左值时设置默认操作符
  const customConverters = useMemo((): Converters => {
    return {
      resolveValueFromPath: (metaTreeNode: MetaTreeNode) => {
        setLeftMeta(metaTreeNode);

        // 基于最新的 meta 获取可用操作符，并设置默认值
        const dm = model.context.app?.dataSourceManager;
        const fi = metaTreeNode?.interface
          ? dm?.collectionFieldInterfaceManager?.getFieldInterface(metaTreeNode.interface)
          : null;
        const metaOps = (fi?.filterable?.operators || []).filter(
          (op) => !op.visible || op.visible(metaTreeNode as any),
        );
        value.operator = metaOps[0]?.value || '';
        value.rightValue = '';

        // 返回变量路径值（去掉根 ctx.collection 前缀, 仅保留字段路径）
        return metaTreeNode?.paths.slice(1).join('.');
      },
      resolvePathFromValue(v) {
        if (!v) return v;
        return ['collection', ...String(v).split('.')];
      },
    };
  }, [model, value]);

  // 处理操作符变化
  const handleOperatorChange = useCallback(
    (operatorValue: string) => {
      value.operator = operatorValue;
      const cur = operatorMetaList.find((op) => op.value === operatorValue);
      if (cur?.noValue) {
        value.rightValue = '';
      }
    },
    [operatorMetaList, value],
  );

  // 处理右侧值变化
  const handleRightValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      value.rightValue = e.target.value;
    },
    [value],
  );

  const currentOpMeta = useMemo(
    () => operatorMetaList.find((op) => op.value === operator),
    [operatorMetaList, operator],
  );

  // 轻量动态输入渲染：使用 formily 动态 schema 渲染 mergedSchema
  const mergedSchema = useMemo(() => {
    const fieldSchema = leftMeta?.uiSchema || {};
    const opSchema = currentOpMeta?.schema || {};
    return merge({}, fieldSchema, opSchema);
  }, [leftMeta, currentOpMeta]);

  // TODO: 等字段重构完成后，我们也需要重构这里，直接使用选择的字段来进行渲染
  const renderRightValueComponent = useCallback(() => {
    const xComp = mergedSchema?.['x-component'];
    // 直接从 uiSchema 读取 component-props，与 flow filter-blocks 保持一致
    const fieldProps = leftMeta?.uiSchema?.['x-component-props'] || {};
    const opProps = mergedSchema?.['x-component-props'] || {};
    const combinedProps = merge({}, fieldProps, opProps);

    const commonProps: any = {
      style: { width: 200, ...(combinedProps?.style || {}) },
      placeholder: combinedProps?.placeholder || t('Enter value'),
      ...combinedProps, // 直接应用所有从 uiSchema 读取的 props
    };

    if (xComp === 'InputNumber') {
      return (
        <InputNumber
          {...commonProps}
          value={rightValue as any}
          onChange={(val) => {
            value.rightValue = val as any;
          }}
        />
      );
    }

    if (xComp === 'NumberPicker') {
      return (
        <NumberPicker
          {...commonProps}
          value={rightValue as any}
          onChange={(val) => {
            value.rightValue = val as any;
          }}
        />
      );
    }

    if (xComp === 'Switch') {
      return (
        <Switch
          {...commonProps}
          checked={!!rightValue}
          onChange={(checked) => {
            value.rightValue = checked.toString();
          }}
        />
      );
    }

    // Select (CheckboxFilterFormEditableFieldModel, SelectFilterFormEditableFieldModel 使用)
    if (xComp === 'Select') {
      return (
        <Select
          {...commonProps}
          value={rightValue}
          onChange={(val) => {
            value.rightValue = val;
          }}
        />
      );
    }

    if (xComp === 'DateFilterDynamicComponent') {
      return (
        <DateFilterDynamicComponent
          {...commonProps}
          value={rightValue}
          onChange={(val) => {
            value.rightValue = val;
          }}
        />
      );
    }

    // 默认回退为 Input
    return <Input {...commonProps} value={rightValue} onChange={handleRightValueChange} />;
  }, [mergedSchema, leftMeta, rightValue, value, t, handleRightValueChange]);

  return (
    <Space>
      <VariableInput
        value={leftValue}
        metaTree={() => model.context.getPropertyMetaTree('{{ ctx.collection }}')}
        onChange={handleLeftChange}
        converters={customConverters}
        showValueComponent={false}
        style={{ width: 200 }}
        onlyLeafSelectable={true}
        placeholder={t('Select field')}
      />

      <Select
        style={{ width: 120 }}
        placeholder={t('Comparition')}
        value={operator || undefined}
        onChange={handleOperatorChange}
      >
        {operatorOptions.map((op) => (
          <Select.Option key={op.value} value={op.value}>
            {op.label}
          </Select.Option>
        ))}
      </Select>

      {!currentOpMeta?.noValue && renderRightValueComponent()}
    </Space>
  );
});
