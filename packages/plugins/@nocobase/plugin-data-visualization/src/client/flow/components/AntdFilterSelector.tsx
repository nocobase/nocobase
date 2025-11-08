/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { CSSProperties } from 'react';
import { FilterGroup, VariableFilterItem } from '@nocobase/client';
import type { VariableFilterItemValue } from '@nocobase/client';
import type { FlowModel } from '@nocobase/flow-engine';
import { observable, reaction, toJS } from '@formily/reactive';
import isEqual from 'lodash/isEqual';
import { DeleteOutlined } from '@ant-design/icons';

type LogicOp = '$and' | '$or';

export type FilterCondition = VariableFilterItemValue;

export type FilterGroupValue = {
  logic: LogicOp;
  items: Array<FilterCondition | FilterGroupValue>;
};

export interface AntdFilterSelectorProps {
  // antd Form 注入的受控属性
  value?: FilterGroupValue;
  onChange?: (next: FilterGroupValue) => void;

  // VariableFilterItem 渲染所需
  model: FlowModel;

  // 是否变量作为右值
  rightAsVariable?: boolean;

  className?: string;
  style?: CSSProperties;
}

function ensureFilterShape(v?: Partial<FilterGroupValue> | null): FilterGroupValue {
  const logic: LogicOp = v?.logic === '$or' ? '$or' : '$and';
  const items = Array.isArray(v?.items) ? v!.items : [];
  return { logic, items } as FilterGroupValue;
}

/**
 * AntdFilterSelector
 * - antd Form.Item 子组件
 * - 内部用响应式对象驱动 FilterGroup/VariableFilterItem
 * - reaction 桥接所有深层变更为 antd 的 onChange
 */
export const AntdFilterSelector: React.FC<AntdFilterSelectorProps> = ({
  value,
  onChange,
  model,
  rightAsVariable = true,
  className,
  style,
}) => {
  // 初始化内部响应式值（ref 持有，避免 setState 导致重渲染）
  const initial = React.useMemo(() => ensureFilterShape(value), [value]);
  const internalRef = React.useRef(observable(initial));

  // 记住最新的外部值，给 reaction 中的等价判断使用
  const latestValueRef = React.useRef<FilterGroupValue | undefined>(value);
  React.useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // 外部 value 变化时，就地更新内部响应式对象，避免重建 observable
  React.useEffect(() => {
    const next = ensureFilterShape(value);
    const current = toJS(internalRef.current);
    if (!isEqual(current, next)) {
      internalRef.current.logic = next.logic;
      // 注意：items 是数组，直接替换引用即可让 FilterGroup 响应变化
      internalRef.current.items = next.items as any;
    }
  }, [value]);

  // 订阅内部响应式对象变化，上报给 antd 的 onChange（仅一次注册）
  React.useEffect(() => {
    const dispose = reaction(
      () => toJS(internalRef.current),
      (snapshot) => {
        const outer = ensureFilterShape(latestValueRef.current);
        if (!isEqual(snapshot, outer)) {
          onChange?.(snapshot);
        }
      },
    );
    return () => dispose();
  }, [onChange]);

  // 缓存 FilterItem 渲染函数，避免每次渲染产生新函数导致子树重绘
  const renderFilterItem = React.useCallback(
    (p: { value: VariableFilterItemValue }) => (
      <VariableFilterItem {...p} model={model} rightAsVariable={rightAsVariable} />
    ),
    [model, rightAsVariable],
  );

  return (
    <div className={className} style={style}>
      <FilterGroup value={internalRef.current} FilterItem={renderFilterItem} closeIcon={<DeleteOutlined />} />
    </div>
  );
};

AntdFilterSelector.displayName = 'AntdFilterSelector';

export default AntdFilterSelector;
