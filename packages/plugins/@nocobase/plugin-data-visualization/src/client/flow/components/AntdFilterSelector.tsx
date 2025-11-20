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
import {
  FlowContext,
  FlowViewContextProvider,
  useFlowViewContext,
  createCollectionContextMeta,
  type FlowModel,
} from '@nocobase/flow-engine';
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

  // 当前选择的集合路径：[dataSourceKey, collectionName]
  collectionPath?: string[];

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
  collectionPath,
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

  const viewCtx = useFlowViewContext();
  const enhancedCtx = React.useMemo(() => {
    if (!Array.isArray(collectionPath) || collectionPath.length < 2) return null;
    const [dataSourceKey, collectionName] = collectionPath || [];
    const ctx = new FlowContext();
    ctx.addDelegate(viewCtx);
    ctx.defineProperty('collection', {
      get: () => model.context.dataSourceManager.getCollection(dataSourceKey, collectionName),
      cache: false,
      meta: (() => {
        const baseFactory = createCollectionContextMeta(
          () => model.context.dataSourceManager.getCollection(dataSourceKey, collectionName),
          model.translate('Current collection'),
        );
        return async () => {
          const base = await baseFactory();
          if (!base) return null;
          const raw = typeof base.properties === 'function' ? await base.properties() : base.properties;
          const allow = (await model.getFilterFields?.())?.map((f: any) => f.name) || [];
          const dm = model.context.app?.dataSourceManager;
          const ds = dm?.getDataSource(dataSourceKey);
          const cm = ds?.collectionManager;
          const fim = dm?.collectionFieldInterfaceManager;
          const out: Record<string, any> = {};
          for (const name of allow) {
            const metaProp = raw?.[name];
            if (!metaProp) continue;
            const fieldDef = (cm?.getCollectionFields(collectionName) || []).find((ff: any) => ff.name === name);
            const iface = fieldDef?.interface ? fim?.getFieldInterface(fieldDef.interface) : undefined;
            if (iface?.filterable?.nested && fieldDef?.target) {
              out[name] = metaProp;
            } else {
              const clone: any = { ...metaProp };
              delete clone.properties;
              out[name] = clone;
            }
          }
          return { ...base, properties: out };
        };
      })(),
    });
    return ctx;
  }, [viewCtx, model, collectionPath]);

  React.useEffect(() => {
    if (!Array.isArray(collectionPath) || collectionPath.length < 2) return;
    const [dataSourceKey, collectionName] = collectionPath || [];
    model.context.defineProperty('collection', {
      get: () => model.context.dataSourceManager.getCollection(dataSourceKey, collectionName),
      cache: false,
      meta: (() => {
        const baseFactory = createCollectionContextMeta(
          () => model.context.dataSourceManager.getCollection(dataSourceKey, collectionName),
          model.translate('Current collection'),
        );
        return async () => {
          const base = await baseFactory();
          if (!base) return null;
          const raw = typeof base.properties === 'function' ? await base.properties() : base.properties;
          const allow = (await model.getFilterFields?.())?.map((f: any) => f.name) || [];
          const dm = model.context.app?.dataSourceManager;
          const ds = dm?.getDataSource(dataSourceKey);
          const cm = ds?.collectionManager;
          const fim = dm?.collectionFieldInterfaceManager;
          const out: Record<string, any> = {};
          for (const name of allow) {
            const metaProp = raw?.[name];
            if (!metaProp) continue;
            const fieldDef = (cm?.getCollectionFields(collectionName) || []).find((ff: any) => ff.name === name);
            const iface = fieldDef?.interface ? fim?.getFieldInterface(fieldDef.interface) : undefined;
            if (iface?.filterable?.nested && fieldDef?.target) {
              out[name] = metaProp;
            } else {
              const clone: any = { ...metaProp };
              delete clone.properties;
              out[name] = clone;
            }
          }
          return { ...base, properties: out };
        };
      })(),
    });
    model.context.removeCache?.('collection');
  }, [model, collectionPath]);

  // 缓存 FilterItem 渲染函数，避免每次渲染产生新函数导致子树重绘
  const renderFilterItem = React.useCallback(
    (p: { value: VariableFilterItemValue }) => (
      <VariableFilterItem {...p} model={model} rightAsVariable={rightAsVariable} />
    ),
    [model, rightAsVariable],
  );

  return (
    <FlowViewContextProvider context={enhancedCtx || viewCtx}>
      <div className={className} style={style}>
        <FilterGroup value={internalRef.current} FilterItem={renderFilterItem} closeIcon={<DeleteOutlined />} />
      </div>
    </FlowViewContextProvider>
  );
};

AntdFilterSelector.displayName = 'AntdFilterSelector';

export default AntdFilterSelector;
