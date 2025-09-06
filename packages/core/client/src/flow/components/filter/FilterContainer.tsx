/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { Button, Space } from 'antd';
import React, { FC } from 'react';
import { FilterGroup } from './FilterGroup';

/**
 * 筛选项组件的属性接口
 */
interface FilterItemProps {
  value: {
    leftValue: string;
    operator: string;
    rightValue: string;
  };
}

/**
 * FilterContent 组件的属性接口
 */
interface FilterContentProps {
  /** 响应式的过滤条件对象 */
  value: Record<string, any>;
  /** 自定义筛选项组件 */
  FilterItem?: React.FC<FilterItemProps>;
  /** 上下文对象，用于获取字段列表等元信息 */
  ctx: any;
}

/**
 * 筛选内容组件
 *
 * 支持新的数据结构格式：
 * ```typescript
 * {
 *   "logic": "or",
 *   "items": [
 *     {
 *       "leftValue": "isAdmin",
 *       "operator": "eq",
 *       "rightValue": true
 *     },
 *     {
 *       "logic": "and",
 *       "items": [...]
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * ```typescript
 * const filterValue = observable({
 *   logic: 'and',
 *   items: []
 * });
 *
 * <FilterContent
 *   value={filterValue}
 *   ctx={contextObject}
 *   FilterItem={CustomFilterItem}
 * />
 * ```
 */
export const FilterContainer: FC<FilterContentProps> = observer(
  (props) => {
    const { value, FilterItem, ctx } = props;

    // 确保 value 有正确的默认结构
    if (!value.logic) {
      value.logic = 'and';
    }
    if (!Array.isArray(value.items)) {
      value.items = [];
    }

    const handleReset = () => {
      // 触发重置事件，由外部组件处理
      if (ctx?.model?.dispatchEvent) {
        ctx.model.dispatchEvent('reset');
      }
    };

    const handleSubmit = () => {
      // 触发提交事件，由外部组件处理
      if (ctx?.model?.dispatchEvent) {
        ctx.model.dispatchEvent('submit');
      }
    };

    const translate = ctx?.model?.translate || ((text: string) => text);

    return (
      <>
        <FilterGroup value={value} FilterItem={FilterItem} />
        <Space style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleReset}>{translate('Reset')}</Button>
          <Button type="primary" onClick={handleSubmit}>
            {translate('Submit')}
          </Button>
        </Space>
      </>
    );
  },
  {
    displayName: 'FilterContent',
  },
);
