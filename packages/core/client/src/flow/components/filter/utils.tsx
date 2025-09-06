/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input, InputNumber, Select, Switch } from 'antd';
import { NumberPicker } from '@formily/antd-v5';
import merge from 'lodash/merge';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { DateFilterDynamicComponent } from '../../../schema-component';

// ===================== 静态输入渲染器 =====================

/**
 * 根据 mergedSchema 与字段 meta 生成一个“受控静态输入组件”的渲染函数。
 * - 用于 FilterItem 右侧静态输入（无变量模式）；
 * - 也可作为 VariableInput 的 renderInputComponent（变量模式下未选择变量时）。
 */
export function createStaticInputRenderer(
  schema: any,
  meta: MetaTreeNode | null,
  t: (s: string) => string,
): (p: { value?: any; onChange?: (v: any) => void }) => JSX.Element {
  const xComp = schema?.['x-component'];
  const fieldProps = meta?.uiSchema?.['x-component-props'] || {};
  const opProps = schema?.['x-component-props'] || {};
  const combinedProps = merge({}, fieldProps, opProps);

  const commonProps: any = {
    style: { width: 200, ...(combinedProps?.style || {}) },
    placeholder: combinedProps?.placeholder || t('Enter value'),
    ...combinedProps,
  };

  return (p: any) => {
    const { value, onChange } = p || {};
    if (xComp === 'InputNumber') return <InputNumber {...commonProps} value={value} onChange={onChange} />;
    if (xComp === 'NumberPicker') return <NumberPicker {...commonProps} value={value} onChange={onChange} />;
    if (xComp === 'Switch') return <Switch {...commonProps} checked={!!value} onChange={onChange} />;
    if (xComp === 'Select') return <Select {...commonProps} value={value} onChange={onChange} />;
    if (xComp === 'DateFilterDynamicComponent')
      return <DateFilterDynamicComponent {...commonProps} value={value} onChange={onChange} />;
    return <Input {...commonProps} value={value} onChange={(e) => onChange?.(e?.target?.value)} />;
  };
}

// ===================== 过滤器结构转换 =====================

export interface FilterCondition {
  leftValue: string;
  operator: string;
  rightValue: any;
}

export interface FilterGroup {
  logic: '$and' | '$or';
  items: (FilterCondition | FilterGroup)[];
}

export type QueryCondition = {
  [field: string]: {
    [operator: string]: any;
  };
};

export type QueryObject =
  | {
      [logic: string]: (QueryCondition | QueryObject)[];
    }
  | QueryCondition;

function isFilterCondition(item: FilterCondition | FilterGroup): item is FilterCondition {
  return 'leftValue' in item && 'operator' in item && 'rightValue' in item;
}

function isFilterGroup(item: FilterCondition | FilterGroup): item is FilterGroup {
  return 'logic' in item && 'items' in item;
}

function transformCondition(condition: FilterCondition): QueryCondition {
  const { leftValue, operator, rightValue } = condition;
  return { [leftValue]: { [operator]: rightValue } };
}

function transformGroup(group: FilterGroup): QueryObject {
  const { logic, items } = group;
  const transformedItems = items.map((item) => {
    if (isFilterCondition(item)) return transformCondition(item);
    if (isFilterGroup(item)) return transformGroup(item);
    throw new Error('Invalid filter item type');
  });
  return { [logic]: transformedItems };
}

export function transformFilter(filter: FilterGroup): QueryObject {
  if (!filter || typeof filter !== 'object') {
    throw new Error('Invalid filter: filter must be an object');
  }
  if (!isFilterGroup(filter)) {
    throw new Error('Invalid filter: filter must have logic and items properties');
  }
  if (!Array.isArray(filter.items)) {
    throw new Error('Invalid filter: items must be an array');
  }
  return transformGroup(filter);
}
