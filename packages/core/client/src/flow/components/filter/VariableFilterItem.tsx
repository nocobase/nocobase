/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Input, Select, Space } from 'antd';
import { observer } from '@formily/reactive-react';
import { VariableInput, useFlowModel, type MetaTreeNode, type Converters, FlowModel } from '@nocobase/flow-engine';

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

// 默认操作符映射
const getDefaultOperators = (leftMeta: MetaTreeNode | null, t: (key: string) => string) => {
  if (!leftMeta) return [];

  const type = leftMeta.type;
  const interface_ = leftMeta.interface;

  // 数字类型
  if (interface_ === 'number' || type === 'number' || type === 'integer') {
    return [
      { value: '$eq', label: t('equals') },
      { value: '$ne', label: t('not equals') },
      { value: '$gt', label: t('greater than') },
      { value: '$lt', label: t('less than') },
    ];
  }

  // 布尔类型
  if (type === 'boolean') {
    return [
      { value: '$eq', label: t('equals') },
      { value: '$ne', label: t('not equals') },
    ];
  }

  // 默认字符串操作符
  return [
    { value: '$eq', label: t('equals') },
    { value: '$ne', label: t('not equals') },
    { value: '$includes', label: t('contains') },
    { value: '$empty', label: t('is empty') },
  ];
};

/**
 * 上下文筛选项组件
 */
export const VariableFilterItem: React.FC<VariableFilterItemProps> = observer(({ value, model }) => {
  // const model = useFlowModel();
  const t = model.translate;
  const { leftValue, operator, rightValue } = value;

  // 左侧选中的元数据节点
  const [leftMeta, setLeftMeta] = useState<MetaTreeNode | null>(null);

  // 操作符选项
  const operatorOptions = useMemo(() => {
    return getDefaultOperators(leftMeta, t);
  }, [leftMeta, t]);

  // 处理左侧值变化
  const handleLeftChange = useCallback(
    (variableValue: string) => {
      value.leftValue = variableValue || '';
      // 注意：metaTreeNode会通过converters传递
    },
    [value],
  );

  // 自定义转换器来捕获MetaTreeNode
  const customConverters = useMemo((): Converters => {
    return {
      resolveValueFromPath: (metaTreeNode: MetaTreeNode) => {
        // 更新leftMeta状态
        setLeftMeta(metaTreeNode);

        // 重置操作符和右侧值
        value.operator = operatorOptions[0]?.value || '';
        value.rightValue = '';

        // 返回变量路径值
        return metaTreeNode?.paths.slice(1).join('.');
      },
      resolvePathFromValue(value) {
        if (!value) {
          return value;
        }
        return ['collection', ...value.split('.')];
      },
    };
  }, [operatorOptions, value]);

  // 处理操作符变化
  const handleOperatorChange = useCallback(
    (operatorValue: string) => {
      value.operator = operatorValue;
      if (operatorValue === '$empty' || operatorValue === '$notEmpty') {
        value.rightValue = '';
      }
    },
    [value],
  );

  // 处理右侧值变化
  const handleRightValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      value.rightValue = e.target.value;
    },
    [value],
  );

  const isRightDisabled = !leftValue || !operator || operator === '$empty' || operator === '$notEmpty';

  return (
    <Space>
      <VariableInput
        value={leftValue}
        metaTree={() => model.context.getPropertyMetaTree('{{ ctx.collection }}')}
        onChange={handleLeftChange}
        converters={customConverters}
        showValueComponent={false}
        style={{ width: 200 }}
        placeholder={t('Select context variable')}
      />

      <Select
        style={{ width: 120 }}
        placeholder={t('Select operator')}
        value={operator || undefined}
        onChange={handleOperatorChange}
        disabled={!leftValue}
      >
        {operatorOptions.map((op) => (
          <Select.Option key={op.value} value={op.value}>
            {op.label}
          </Select.Option>
        ))}
      </Select>

      <Input
        style={{ width: 200 }}
        placeholder={t('Enter value')}
        value={rightValue}
        onChange={handleRightValueChange}
        disabled={isRightDisabled}
      />
    </Space>
  );
});
