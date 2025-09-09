/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input, InputNumber, Select, Space, Switch } from 'antd';
import merge from 'lodash/merge';
import { observer } from '@formily/reactive-react';
import {
  VariableInput,
  type MetaTreeNode,
  type Converters,
  useFlowViewContext,
  parseValueToPath,
  FlowModel,
} from '@nocobase/flow-engine';
import { DateFilterDynamicComponent } from '../../../schema-component';
import { NumberPicker } from '@formily/antd-v5';

export interface LinkageFilterItemValue {
  path: string | null;
  operator: string;
  value: any;
}

export interface LinkageFilterItemProps {
  /** 条件值对象（响应式） */
  value: LinkageFilterItemValue;
  model: FlowModel;
}

function createStaticInputRenderer(
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

type OperatorMeta = { value: string; label: string; noValue?: boolean; schema?: any; selected?: boolean };

/**
 * LinkageFilterItem：左/右均为可变量输入，适用于联动规则等“前端逻辑”场景
 */
export const LinkageFilterItem: React.FC<LinkageFilterItemProps> = observer((props) => {
  const { value, model } = props;
  const ctx = useFlowViewContext();
  const t = model.translate;
  const { path: leftValue, operator, value: rightValue } = value || {};

  const [leftMeta, setLeftMeta] = useState<MetaTreeNode | null>(null);

  // 操作符列表：优先使用字段接口提供的 operators（与 VariableFilterItem 一致）
  const operatorMetaList: OperatorMeta[] = useMemo(() => {
    if (leftMeta?.interface) {
      try {
        const dm = (model as any)?.context?.app?.dataSourceManager;
        const fi = dm?.collectionFieldInterfaceManager?.getFieldInterface(leftMeta.interface);
        const ops = (fi?.filterable?.operators || []) as any[];
        const filtered = ops.filter((op) => !op.visible || op.visible(leftMeta as any));
        return filtered.map((op) => ({
          value: op.value,
          label: typeof op.label === 'string' ? t(op.label) : String(op.label),
          noValue: !!op.noValue,
          schema: op.schema,
          selected: !!op.selected,
        }));
      } catch (e) {
        // ignore and fallback
      }
    }
    return [];
  }, [leftMeta, model, t]);

  const operatorOptions = useMemo(() => {
    return operatorMetaList.map((op) => ({ value: op.value, label: op.label }));
  }, [operatorMetaList]);

  useEffect(() => {
    // 仅当有可用操作符列表时才做校验/回填，避免在列表未就绪时覆盖已保存的值
    if (operatorMetaList.length === 0) return;
    const exists = operatorMetaList.some((op) => op.value === operator);
    if (!exists) {
      const fallback = operatorMetaList.find((op) => op.selected) || operatorMetaList[0];
      // 若不存在或无效，则使用 fallback；否则保持现有值
      value.operator = fallback?.value || '';
      if (fallback?.noValue) {
        value.value = '';
      }
    }
  }, [operatorMetaList, operator, value]);

  // 合并 schema：优先使用字段 uiSchema（如果能拿到），右值还会叠加操作符 schema（如有）
  const currentOpMeta = useMemo(
    () => operatorMetaList.find((op) => op.value === operator),
    [operatorMetaList, operator],
  );

  const mergedSchema = useMemo(() => {
    const fieldSchema = leftMeta?.uiSchema || {};
    const opSchema = currentOpMeta?.schema || {};
    return merge({}, fieldSchema, opSchema);
  }, [leftMeta, currentOpMeta]);

  // 稳定翻译函数，避免右侧静态输入频繁卸载
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const stableT = useCallback((s: string) => tRef.current?.(s) ?? s, []);

  const staticInputRenderer = useMemo(
    () => createStaticInputRenderer(mergedSchema, leftMeta, stableT),
    [mergedSchema, leftMeta, stableT],
  );

  const NullComponent = useMemo(() => {
    return function NullValue() {
      return <Input placeholder={`<${t('Null')}>`} readOnly />;
    };
  }, [t]);

  // 右侧变量树：追加 constant/null 根节点
  const mergedRightMetaTree = useMemo(() => {
    return async () => {
      const base = ctx.getPropertyMetaTree() as MetaTreeNode[];
      return [
        { title: t('Constant'), name: 'constant', type: 'string', paths: ['constant'], render: staticInputRenderer },
        { title: t('Null'), name: 'null', type: 'object', paths: ['null'], render: NullComponent },
        ...(Array.isArray(base) ? base : []),
      ];
    };
  }, [ctx, staticInputRenderer, NullComponent, t]);

  // 左侧变量树：默认整棵 ctx（不追加 Constant/Null），确保可获取字段 interface
  const leftMetaTreeProvider = useCallback(() => ctx.getPropertyMetaTree(), [ctx]);

  // 右侧 converters：常量/空值特殊处理；变量沿用默认（表达式）
  const rightConverters = useMemo<Converters>(() => {
    return {
      renderInputComponent: (meta) => {
        const first = meta?.paths?.[0];
        if (first === 'constant') return staticInputRenderer;
        if (first === 'null') return NullComponent;
        return null;
      },
      resolveValueFromPath: (meta) => {
        const first = meta?.paths?.[0];
        if (first === 'constant') return '';
        if (first === 'null') return null;
        return undefined;
      },
      resolvePathFromValue: (val) => {
        if (val === null) return ['null'];
        const parsed = parseValueToPath(val as any);
        if (parsed) return parsed;
        return ['constant'];
      },
    };
  }, [NullComponent, staticInputRenderer]);

  const handleLeftChange = useCallback(
    (variableValue: string, meta?: MetaTreeNode) => {
      value.path = variableValue || '';
      if (meta) setLeftMeta(meta);
    },
    [value],
  );

  const handleOperatorChange = useCallback(
    (op: string) => {
      value.operator = op;
      const cur = operatorMetaList.find((o) => o.value === op);
      if (cur?.noValue) {
        value.value = '';
      }
    },
    [value, operatorMetaList],
  );

  return (
    <Space wrap style={{ width: '100%' }}>
      {/* 左侧：选择任意上下文变量（仅叶子字段） */}
      <VariableInput
        value={leftValue}
        onChange={handleLeftChange}
        metaTree={leftMetaTreeProvider}
        showValueComponent
        style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}
        placeholder={t('Select variable')}
        onlyLeafSelectable
      />

      {/* 操作符 */}
      <Select
        style={{ flex: '0 0 140px', minWidth: 120, maxWidth: '100%' }}
        placeholder={t('Comparison')}
        value={operator || undefined}
        onChange={handleOperatorChange}
      >
        {operatorOptions.map((op) => (
          <Select.Option key={op.value} value={op.value}>
            {op.label}
          </Select.Option>
        ))}
      </Select>

      {/* 右侧：任意上下文变量/常量/空值；无值型操作符不渲染 */}
      {!operatorMetaList.find((o) => o.value === operator)?.noValue && (
        <VariableInput
          value={rightValue}
          onChange={(v) => (value.value = v)}
          metaTree={mergedRightMetaTree}
          converters={rightConverters}
          showValueComponent
          style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}
          placeholder={t('Enter value')}
        />
      )}
    </Space>
  );
});
