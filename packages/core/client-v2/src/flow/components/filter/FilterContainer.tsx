/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Space } from 'antd';
import React, { FC } from 'react';
import { FilterGroup } from './FilterGroup';
import { observer } from '@nocobase/flow-engine';

/**
 * 筛选项组件的属性接口
 */
interface FilterItemProps {
  value: {
    path: string;
    operator: string;
    value: string;
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
 *   "logic": "$or",
 *   "items": [
 *     {
 *       "path": "isAdmin",
 *       "operator": "$eq",
 *       "value": true
 *     },
 *     {
 *       "logic": "$and",
 *       "items": [...]
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * ```typescript
 * const filterValue = observable({
 *   logic: '$and',
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
      value.logic = '$and';
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <FilterGroup value={value} FilterItem={FilterItem} />
        <Space style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <Button htmlType="button" onClick={handleReset}>
            {translate('Reset')}
          </Button>
          <Button type="primary" htmlType="submit">
            {translate('Submit')}
          </Button>
        </Space>
      </form>
    );
  },
  {
    displayName: 'FilterContent',
  },
);
