/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input, InputNumber, Select, Space, Switch } from 'antd';
import merge from 'lodash/merge';
import { observer } from '@formily/reactive-react';
import {
  VariableInput,
  type MetaTreeNode,
  type Converters,
  FlowModel,
  useFlowViewContext,
  parseValueToPath,
} from '@nocobase/flow-engine';
import _ from 'lodash';
import { DateFilterDynamicComponent } from '../../../schema-component';
import { NumberPicker } from '@formily/antd-v5';

export interface VariableFilterItemValue {
  path: string;
  operator: string;
  value: string;
}

export interface VariableFilterItemProps {
  /** 筛选条件值对象 */
  value: VariableFilterItemValue;
  model: FlowModel;
  /**
   * 是否启用右侧 VariableInput（变量或静态值二合一）。
   * 默认 false：保持原有行为，右侧仅静态输入组件。
   */
  rightAsVariable?: boolean;
  /**
   * 右侧 VariableInput 的 metaTree 提供器；
   * 默认使用整棵 ctx 的 metaTree：model.context.getPropertyMetaTree()
   */
  rightMetaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
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

/**
 * 上下文筛选项组件
 */
export const VariableFilterItem: React.FC<VariableFilterItemProps> = observer(
  ({ value, model, rightAsVariable, rightMetaTree }) => {
    // 使用 View 上下文，确保可访问 ctx.view 的异步子树
    const ctx = useFlowViewContext();
    const t = model.translate;
    const { path, operator, value: rightValue } = value;

    // 左侧选中的元数据节点
    const [leftMeta, setLeftMeta] = useState<MetaTreeNode | null>(null);

    // 基于字段接口的动态操作符元数据（与原筛选逻辑一致：来源于 collectionFieldInterfaceManager + visible 过滤）
    const operatorMetaList: any[] = useMemo(() => {
      if (!leftMeta?.interface) return [];
      const dm = model.context.app?.dataSourceManager;
      const fi = dm?.collectionFieldInterfaceManager?.getFieldInterface(leftMeta.interface);
      const ops = fi?.filterable?.operators || [];
      return ops.filter((op) => !op.visible || op.visible(leftMeta as any));
    }, [leftMeta, model]);

    useEffect(() => {
      if (operatorMetaList.length > 0 && !_.find(operatorMetaList, (o) => o.value === value.operator)) {
        value.operator = '';
        value.value = '';
      }
    }, [operatorMetaList, value]);

    // Select 的可见选项
    const operatorOptions = useMemo(() => {
      return operatorMetaList.map((op) => ({
        value: op.value,
        label: typeof op.label === 'string' ? t(op.label) : (op.label as any)?.toString?.() || String(op.label),
      }));
    }, [operatorMetaList, t]);

    // 处理左侧值变化（值由 converters 决定如何解析）
    const handleLeftChange = useCallback(
      (variableValue: string, meta?: MetaTreeNode) => {
        value.path = variableValue || '';
        if (meta) {
          setLeftMeta(meta);
        }
      },
      [value],
    );

    // 自定义转换器来捕获 MetaTreeNode，并在选择左值时设置默认操作符
    const customConverters = useMemo((): Converters => {
      return {
        resolveValueFromPath: (metaTreeNode: MetaTreeNode) => {
          setLeftMeta(metaTreeNode);

          // 返回变量路径值（去掉根 ctx.collection 前缀, 仅保留字段路径）
          return metaTreeNode?.paths.slice(1).join('.') || null;
        },
        resolvePathFromValue(v) {
          if (!v) return v;
          return ['collection', ...String(v).split('.')];
        },
      };
    }, []);

    // 处理操作符变化
    const handleOperatorChange = useCallback(
      (operatorValue: string) => {
        value.operator = operatorValue;
        const cur = operatorMetaList.find((op) => op.value === operatorValue);
        if (cur?.noValue) {
          value.value = '';
        }
      },
      [operatorMetaList, value],
    );

    // 使用公共静态输入渲染器（抽取到 utils）

    const currentOpMeta = useMemo(
      () => operatorMetaList.find((op) => op.value === operator),
      [operatorMetaList, operator],
    );

    // 轻量动态输入渲染：使用 formily 动态 schema 渲染 mergedSchema
    const mergedSchema = useMemo(() => {
      const fieldSchema = leftMeta?.uiSchema || {};
      const opSchema = currentOpMeta?.schema || {};
      return merge({}, fieldSchema, opSchema);
    }, [leftMeta, currentOpMeta]);

    // 右侧静态输入（无变量模式）与右侧 VariableInput 的静态渲染组件，统一复用
    // t 可能每次渲染产生新引用，导致 staticInputRenderer 引用不稳定，进而触发右侧输入卸载/重建。
    // 通过 stableT 包装，保持函数引用稳定，同时读取最新的 t。
    const tRef = React.useRef(t);
    React.useEffect(() => {
      tRef.current = t;
    }, [t]);
    const stableT = React.useCallback((s: string) => tRef.current?.(s) ?? s, []);

    const staticInputRenderer = useMemo(
      () => createStaticInputRenderer(mergedSchema, leftMeta, stableT),
      [mergedSchema, leftMeta, stableT],
    );

    //

    const renderRightValueComponent = useCallback(() => {
      const Comp = staticInputRenderer;
      return (
        <div style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}>
          <Comp value={rightValue} onChange={(val: any) => (value.value = val)} />
        </div>
      );
    }, [staticInputRenderer, rightValue, value]);

    // Null 占位组件（仿照 DefaultValue.tsx 的实现）
    const NullComponent = useMemo(() => {
      return function NullValue() {
        return <Input placeholder={`<${t('Null')}>`} readOnly />;
      };
    }, [t]);

    // 右侧变量树：在原有变量上下文前，追加“常量/空值”两个根选项
    const mergedRightMetaTree = useMemo(() => {
      return async () => {
        const base = (
          typeof rightMetaTree === 'function' ? await rightMetaTree() : rightMetaTree || ctx.getPropertyMetaTree()
        ) as MetaTreeNode[];
        return [
          { title: t('Constant'), name: 'constant', type: 'string', paths: ['constant'], render: staticInputRenderer },
          { title: t('Null'), name: 'null', type: 'object', paths: ['null'], render: NullComponent },
          ...(Array.isArray(base) ? base : []),
        ];
      };
    }, [rightMetaTree, ctx, staticInputRenderer, NullComponent, t]);

    // 当启用右侧变量输入时，构造 VariableInput 的 converters：
    // - 变量模式：返回 null 让 VariableInput 渲染 VariableTag
    // - 常量模式/空值：根据所选根节点返回对应输入组件
    // - 路径/值互相解析，保证从值恢复时可定位到 constant/null
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
          return undefined; // 交给默认逻辑格式化变量表达式
        },
        resolvePathFromValue: (val) => {
          if (val === null) return ['null'];
          // 变量表达式：使用内置解析；其他静态值走 constant
          const parsed = parseValueToPath(val as any);
          if (parsed) return parsed;
          return ['constant'];
        },
      };
    }, [NullComponent, staticInputRenderer]);

    return (
      <Space wrap style={{ width: '100%' }}>
        <VariableInput
          value={path}
          metaTree={() => model.context.getPropertyMetaTree('{{ ctx.collection }}')}
          onChange={handleLeftChange}
          converters={customConverters}
          showValueComponent={false}
          style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}
          onlyLeafSelectable={true}
          placeholder={t('Select field')}
        />

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

        {!currentOpMeta?.noValue &&
          (rightAsVariable ? (
            <VariableInput
              value={rightValue}
              onChange={(v) => (value.value = v)}
              metaTree={mergedRightMetaTree}
              converters={rightConverters}
              showValueComponent
              style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}
              placeholder={t('Enter value')}
            />
          ) : (
            // 纯静态输入分支
            renderRightValueComponent()
          ))}
      </Space>
    );
  },
);
