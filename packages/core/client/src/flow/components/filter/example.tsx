/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import React from 'react';
import { FilterContainer } from './FilterContainer';
import { FilterItemProps } from './FilterItem';

/**
 * FilterContent 组件的使用示例
 *
 * 展示如何使用新的数据结构和响应式对象
 */
export const FilterContentExample = () => {
  // 创建响应式的过滤条件对象
  const filterValue = observable({
    logic: 'or',
    items: [
      {
        leftValue: 'isAdmin',
        operator: 'eq',
        rightValue: true,
      },
      {
        logic: 'and',
        items: [
          {
            leftValue: 'name',
            operator: 'eq',
            rightValue: 'NocoBase',
          },
          {
            leftValue: 'age',
            operator: 'gt',
            rightValue: 18,
          },
        ],
      },
    ],
  });

  // 自定义筛选项组件
  const CustomFormItem: React.FC<FilterItemProps> = ({ value }) => {
    const { leftValue, operator, rightValue } = value;
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ minWidth: 80 }}>{leftValue}</span>
        <span style={{ minWidth: 40 }}>{operator}</span>
        <span>{String(rightValue)}</span>
      </div>
    );
  };

  const mockContext = {
    model: {
      translate: (text: string) => text,
      dispatchEvent: (event: string) => {
        console.log(`Event dispatched: ${event}`);
      },
    },
  };

  return (
    <div style={{ padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
      <h3>FilterContent 使用示例</h3>
      <FilterContainer value={filterValue} FormItem={CustomFormItem} ctx={mockContext} />

      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
        <h4>当前过滤条件数据：</h4>
        <pre>{JSON.stringify(filterValue, null, 2)}</pre>
      </div>
    </div>
  );
};
