/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, useFlowModel, useFlowSettingsContext } from '@nocobase/flow-engine';
import { observer } from '@formily/reactive-react';
import { Input, Select, Space } from 'antd';
import React, { FC, useMemo } from 'react';
import { fieldsToOptions } from './fieldsToOptions';

/**
 * 筛选项组件的属性接口
 */
export interface FilterItemProps {
  /** 筛选条件值对象 */
  value: {
    leftValue: string;
    operator: string;
    rightValue: string;
  };
  model: FlowModel;
}

/**
 * FilterItem 组件
 *
 * 用于渲染单个筛选条件项，支持字段选择、操作符选择和值输入
 *
 * @example
 * ```typescript
 * <FilterItem
 *   value={{
 *     leftValue: "name",
 *     operator: "eq",
 *     rightValue: "test"
 *   }}
 * />
 * ```
 */
export const FilterItem: FC<FilterItemProps> = observer(
  (props) => {
    const { leftValue, operator, rightValue } = props.value;
    const modelInstance = props.model;
    const currentBlockModel = modelInstance.context.blockModel;
    const fields = currentBlockModel.collection.getFields().filter((field) => {
      // 过滤掉附件字段，因为会报错：Target collection attachments not found for field xxx
      return field.target !== 'attachments';
    });
    const ignoreFieldsNames = getIgnoreFieldsNames(
      modelInstance.props.filterableFieldsNames || [],
      fields.map((field) => field.name),
    );
    const t = modelInstance.translate;
    const options = fieldsToOptions(
      fields.filter((field) => {
        // 过滤掉附件字段，因为会报错：Target collection attachments not found for field xxx
        // 过滤掉关系字段，避免性能问题
        return (
          field.target !== 'attachments' &&
          field.interface !== 'formula' &&
          !['belongsTo', 'belongsToMany', 'hasOne', 'hasMany', 'oho', 'obo', 'm2o', 'o2m', 'm2m'].includes(field.type)
        );
      }),
      1,
      ignoreFieldsNames,
      t,
    ).filter(Boolean);

    // 根据当前选中的字段获取可用的操作符
    const operatorOptions = useMemo(() => {
      const selectedField = options.find((option) => option.name === leftValue);
      return selectedField?.operators || [];
    }, [options, leftValue]);

    // 处理字段选择变化
    const handleFieldChange = (value: string) => {
      props.value.leftValue = value;
      // 当字段改变时，重置操作符和值
      const selectedField = options.find((option) => option.name === value);
      if (selectedField?.operators?.length > 0) {
        props.value.operator = selectedField.operators[0].value;
      } else {
        props.value.operator = '';
      }
      props.value.rightValue = '';
    };

    // 处理操作符选择变化
    const handleOperatorChange = (value: string) => {
      props.value.operator = value;
    };

    // 处理值输入变化
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.value.rightValue = e.target.value;
    };

    return (
      <Space>
        <Select
          style={{ width: 200 }}
          placeholder={t('Select field')}
          value={leftValue || undefined}
          onChange={handleFieldChange}
        >
          {options.map((option) => (
            <Select.Option key={option.name} value={option.name}>
              {option.title}
            </Select.Option>
          ))}
        </Select>

        <Select
          style={{ width: 120 }}
          placeholder={t('Select operator')}
          value={operator || undefined}
          onChange={handleOperatorChange}
          disabled={!leftValue || operatorOptions.length === 0}
        >
          {operatorOptions.map((op) => (
            <Select.Option key={op.value} value={op.value}>
              {op.label}
            </Select.Option>
          ))}
        </Select>

        <Input style={{ width: 200 }} placeholder={t('Enter value')} value={rightValue} onChange={handleValueChange} />
      </Space>
    );
  },
  {
    displayName: 'FilterItem',
  },
);

function getIgnoreFieldsNames(filterableFieldsNames: string[], allFields: string[]) {
  return allFields.filter((field) => !filterableFieldsNames.includes(field));
}
