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
import {
  VariableInput,
  type MetaTreeNode,
  type Converters,
  useFlowViewContext,
  parseValueToPath,
  FlowModel,
  observer,
} from '@nocobase/flow-engine';
import { NumberPicker } from '@formily/antd-v5';
import { enumToOptions, translateOptions } from '../../internal/utils/enumOptionsUtils';
import { lazy } from '../../../lazy-helper';
import { mergeItemMetaTreeForAssignValue } from '../FieldAssignValueInput';

const { DateFilterDynamicComponent: DateFilterDynamicComponentLazy } = lazy(
  () => import('../../models/blocks/filter-form/fields/date-time/components/DateFilterDynamicComponent'),
  'DateFilterDynamicComponent',
);

export interface LinkageFilterItemValue {
  path: string | null;
  operator: string;
  value: any;
  noValue?: boolean;
}

export interface LinkageFilterItemProps {
  /** 条件值对象（响应式） */
  value: LinkageFilterItemValue;
  model: FlowModel;
  /** 向变量树额外注入节点（置于根部） */
  extraMetaTree?: MetaTreeNode[];
}

function createStaticInputRenderer(
  schema: any,
  fieldMeta: MetaTreeNode | null,
  t: (s: string) => string,
): (inputProps: { value?: any; onChange?: (v: any) => void } & Record<string, any>) => JSX.Element {
  const xComponent = schema?.['x-component'];
  const fieldComponentProps = fieldMeta?.uiSchema?.['x-component-props'] || {};
  const operatorComponentProps = schema?.['x-component-props'] || {};
  const combinedProps = merge({}, fieldComponentProps, operatorComponentProps);

  // 来自字段定义的本地枚举（uiSchema.enum），归一化为 antd Select 可识别的 options
  const enumFromField = Array.isArray(fieldMeta?.uiSchema?.enum) ? (fieldMeta?.uiSchema?.enum as any) : undefined;
  const optionsFromEnum = enumToOptions(enumFromField, t);

  const commonProps: any = {
    style: { width: 200, ...(combinedProps?.style || {}) },
    placeholder: combinedProps?.placeholder || t('Enter value'),
    ...combinedProps,
  };

  return (inputProps: any) => {
    const { value, onChange, ...rest } = inputProps || {};
    if (xComponent === 'InputNumber')
      return <InputNumber {...commonProps} {...rest} value={value} onChange={onChange} />;
    if (xComponent === 'NumberPicker')
      return <NumberPicker {...commonProps} {...rest} value={value} onChange={onChange} />;
    if (xComponent === 'Switch') return <Switch {...commonProps} {...rest} checked={!!value} onChange={onChange} />;
    if (xComponent === 'Select') {
      // 若操作符或字段 props 未显式传入 options，则使用枚举兜底
      let finalProps: any = commonProps;
      const hasOptions = Array.isArray((finalProps as any)?.options) && (finalProps as any).options.length > 0;
      if (hasOptions) {
        finalProps = { ...finalProps, options: translateOptions((finalProps as any).options, t) };
      } else if (optionsFromEnum) {
        finalProps = { ...finalProps, options: optionsFromEnum };
      }
      return <Select {...finalProps} {...rest} value={value} onChange={onChange} />;
    }
    if (xComponent === 'DateFilterDynamicComponent')
      return <DateFilterDynamicComponentLazy {...commonProps} {...rest} value={value} onChange={onChange} />;
    // 普通文本输入：透传组合输入事件，避免 IME 被中断
    return <Input {...commonProps} {...rest} value={value} onChange={(e) => onChange?.(e?.target?.value)} />;
  };
}

type OperatorMeta = { value: string; label: string; noValue?: boolean; schema?: any; selected?: boolean };

// 当左侧变量不是 collection field（无 interface）时，按字符串类型推断操作符
const fallbackStringOperators: OperatorMeta[] = [
  { value: '$includes', label: 'contains', selected: true },
  { value: '$notIncludes', label: 'does not contain' },
  { value: '$eq', label: 'is' },
  { value: '$ne', label: 'is not' },
  { value: '$empty', label: 'is empty', noValue: true },
  { value: '$notEmpty', label: 'is not empty', noValue: true },
];

export function mergeExtraMetaTreeWithBase(
  baseMetaTree: MetaTreeNode[] | undefined,
  extraMetaTree?: MetaTreeNode[],
): MetaTreeNode[] {
  const base = Array.isArray(baseMetaTree) ? baseMetaTree : [];
  const extra = Array.isArray(extraMetaTree) ? extraMetaTree : [];
  if (!extra.length) return base;

  const extraItem = extra.find((node) => node?.name === 'item');
  if (!extraItem) {
    return [...extra, ...base];
  }

  const mergedBase = mergeItemMetaTreeForAssignValue(base, [extraItem]);
  const extraNonItem = extra.filter((node) => node?.name !== 'item');
  return [...extraNonItem, ...mergedBase];
}

/**
 * LinkageFilterItem：左/右均为可变量输入，适用于联动规则等“前端逻辑”场景
 */
export const LinkageFilterItem: React.FC<LinkageFilterItemProps> = observer((props) => {
  const { value, model, extraMetaTree } = props;
  const ctx = useFlowViewContext();
  const t = model.translate;
  const { path: leftPath, operator: selectedOperator, value: rightOperandValue } = value || {};

  // 左侧选中的字段元信息
  const [leftFieldMeta, setLeftFieldMeta] = useState<MetaTreeNode | null>(null);
  // 左侧变更后是否需要默认选择第一个操作符
  const shouldDefaultOperatorRef = useRef(false);
  // 操作符列表：优先使用字段接口提供的 operators（与 VariableFilterItem 一致）
  const leftFieldSignature = useMemo(() => {
    if (!leftFieldMeta) return '';
    const interfaceName = leftFieldMeta.interface || '';
    const fieldPath = Array.isArray(leftFieldMeta.paths) ? leftFieldMeta.paths.join('.') : '';
    return `${interfaceName}|${fieldPath}`;
  }, [leftFieldMeta]);

  const operatorMetadataList: OperatorMeta[] = useMemo(() => {
    if (leftFieldMeta?.interface) {
      const dataSourceManager = model.context.app.dataSourceManager;
      const fieldInterface = dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
        leftFieldMeta.interface,
      );
      const operatorList = fieldInterface.filterable.operators || [];
      const visibleOperators = operatorList.filter(
        (operatorItem) => !operatorItem.visible || operatorItem.visible(leftFieldMeta),
      );
      const mappedList = visibleOperators.map((operatorItem) => ({
        value: operatorItem.value,
        // 使用原始 label（或字符串化），避免因翻译函数引用变化导致不必要的重建
        label: typeof operatorItem.label === 'string' ? operatorItem.label : String(operatorItem.label),
        noValue: !!operatorItem.noValue,
        schema: operatorItem.schema,
        selected: !!operatorItem.selected,
      }));
      return mappedList;
    }
    // 无 interface：按字符串类型兜底，保证可用性
    return leftFieldMeta ? fallbackStringOperators : [];
  }, [leftFieldSignature, model]);

  const operatorSelectOptions = useMemo(() => {
    // 在展示阶段再做翻译，且依赖 operatorMetadataList 值；避免翻译函数进入 operatorMetadataList 的依赖链
    return operatorMetadataList.map((operatorItem) => ({ value: operatorItem.value, label: t(operatorItem.label) }));
  }, [operatorMetadataList, t]);

  useEffect(() => {
    // 仅当有可用操作符列表时才做校验/回填，避免在列表未就绪时覆盖已保存的值
    if (operatorMetadataList.length === 0) return;
    // 未选择操作符：按需默认选择第一个
    if (!selectedOperator) {
      if (shouldDefaultOperatorRef.current) {
        const fallback = operatorMetadataList.find((op) => op.selected) || operatorMetadataList[0];
        value.operator = fallback?.value || '';
        if (fallback?.noValue) {
          value.value = true;
          value.noValue = true;
        } else {
          value.noValue = false;
        }
        shouldDefaultOperatorRef.current = false;
      }
      return;
    }
    // 已选择操作符但不在当前列表中，回落到第一个
    const exists = operatorMetadataList.some((op) => op.value === selectedOperator);
    if (!exists) {
      const fallback = operatorMetadataList.find((op) => op.selected) || operatorMetadataList[0];
      value.operator = fallback?.value || '';
      if (fallback?.noValue) {
        value.value = true;
        value.noValue = true;
      } else {
        value.noValue = false;
      }
    }
  }, [operatorMetadataList, selectedOperator, value]);

  // 合并 schema：优先使用字段 uiSchema（如果能拿到），右值还会叠加操作符 schema（如有）
  const currentOperatorMeta = useMemo(
    () => operatorMetadataList.find((op) => op.value === selectedOperator),
    [operatorMetadataList, selectedOperator],
  );

  const mergedSchema = useMemo(() => {
    const fieldSchema = leftFieldMeta?.uiSchema || {};
    const opSchema = currentOperatorMeta?.schema || {};
    return merge({}, fieldSchema, opSchema);
  }, [leftFieldMeta, currentOperatorMeta]);

  // 稳定翻译函数，避免右侧静态输入频繁卸载
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const stableT = useCallback((s: string) => tRef.current?.(s) ?? s, []);

  const staticInputRenderer = useMemo(
    () => createStaticInputRenderer(mergedSchema, leftFieldMeta, stableT),
    [mergedSchema, leftFieldMeta, stableT],
  );

  const NullComponent = useMemo(() => {
    return function NullValue() {
      return <Input placeholder={`<${t('Null')}>`} readOnly />;
    };
  }, [t]);

  // 右侧变量树：动态函数获取，保证能拿到最新的 ctx（含 view.record 等）
  const rightMetaTreeGetter = useMemo(() => {
    return async () => {
      const baseMetaTree = (model?.context.getPropertyMetaTree() || ctx.getPropertyMetaTree()) as MetaTreeNode[];
      const mergedMetaTree = mergeExtraMetaTreeWithBase(baseMetaTree, extraMetaTree);
      return [
        { title: t('Constant'), name: 'constant', type: 'string', paths: ['constant'] },
        { title: t('Null'), name: 'null', type: 'object', paths: ['null'] },
        ...mergedMetaTree,
      ];
    };
  }, [ctx, model, t, extraMetaTree]);

  // 左侧变量树：默认整棵 ctx（不追加 Constant/Null），确保可获取字段 interface
  const leftMetaTreeGetter = useCallback(() => {
    const tree = model?.context?.getPropertyMetaTree?.() || ctx.getPropertyMetaTree();
    const base = Array.isArray(tree) ? tree : [];
    return mergeExtraMetaTreeWithBase(base, extraMetaTree);
  }, [ctx, model, extraMetaTree]);

  // 右侧 converters：常量/空值特殊处理；变量沿用默认（表达式）
  const rightSideConverters = useMemo<Converters>(() => {
    return {
      renderInputComponent: (metaNode) => {
        const firstPathSegment = metaNode?.paths?.[0];
        if (firstPathSegment === 'constant') return staticInputRenderer;
        if (firstPathSegment === 'null') return NullComponent;
        return null;
      },
      resolveValueFromPath: (metaNode) => {
        const firstPathSegment = metaNode?.paths?.[0];
        if (firstPathSegment === 'constant') return '';
        if (firstPathSegment === 'null') return null;
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

  const handleLeftPathChange = useCallback(
    (variableValue: string, metaNode?: MetaTreeNode) => {
      const prevPath = value.path || '';
      const nextPath = variableValue || '';
      const changed = nextPath !== prevPath;
      value.path = nextPath;
      // 仅当此前已有选择（prevPath 非空）且新旧不同，才清空中间与右侧
      // 避免“初次回填/恢复”时误清空已保存的 operator/value
      if (changed && prevPath) {
        value.operator = '';
        value.value = '';
        shouldDefaultOperatorRef.current = true;
      }
      // 首次选择（prevPath 为空），且没有已保存 operator 时，默认选择第一个
      if (!prevPath && nextPath && !value.operator) {
        shouldDefaultOperatorRef.current = true;
      }
      if (metaNode) setLeftFieldMeta(metaNode);
    },
    [value],
  );

  const handleOperatorChange = useCallback(
    (operatorValue: string) => {
      value.operator = operatorValue;
      const selectedOperatorMeta = operatorMetadataList.find((o) => o.value === operatorValue);
      if (selectedOperatorMeta?.noValue) {
        value.value = true;
        value.noValue = true;
      } else {
        value.noValue = false;
      }
    },
    [value, operatorMetadataList],
  );

  return (
    <Space wrap style={{ width: '100%' }}>
      {/* 左侧：选择任意上下文变量（仅叶子字段） */}
      <VariableInput
        value={leftPath}
        onChange={handleLeftPathChange}
        metaTree={leftMetaTreeGetter}
        showValueComponent
        style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}
        placeholder={t('Select variable')}
        onlyLeafSelectable
      />

      {/* 操作符 */}
      <Select
        style={{ flex: '0 0 140px', minWidth: 120, maxWidth: '100%' }}
        placeholder={t('Comparison')}
        value={selectedOperator || undefined}
        onChange={handleOperatorChange}
      >
        {operatorSelectOptions.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>

      {/* 右侧：任意上下文变量/常量/空值；无值型操作符不渲染 */}
      {!operatorMetadataList.find((o) => o.value === selectedOperator)?.noValue && (
        <VariableInput
          value={rightOperandValue}
          onChange={(v) => (value.value = v)}
          metaTree={rightMetaTreeGetter}
          converters={rightSideConverters}
          showValueComponent
          style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}
          placeholder={t('Enter value')}
          clearValue=""
        />
      )}
    </Space>
  );
});
