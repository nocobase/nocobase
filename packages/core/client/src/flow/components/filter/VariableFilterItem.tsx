/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Select, Space } from 'antd';
import merge from 'lodash/merge';
import { observer } from '@formily/reactive-react';
import { VariableInput, type MetaTreeNode, type Converters, FlowModel } from '@nocobase/flow-engine';
import { createStaticInputRenderer } from './utils';
import _ from 'lodash';

export interface VariableFilterItemValue {
  leftValue: string;
  operator: string;
  rightValue: string;
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

/**
 * 上下文筛选项组件
 */
export const VariableFilterItem: React.FC<VariableFilterItemProps> = observer(
  ({ value, model, rightAsVariable, rightMetaTree }) => {
    const t = model.translate;
    const { leftValue, operator, rightValue } = value;

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
        value.rightValue = '';
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
        value.leftValue = variableValue || '';
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
          value.rightValue = '';
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
    const staticInputRenderer = useMemo(
      () => createStaticInputRenderer(mergedSchema, leftMeta, t),
      [createStaticInputRenderer, mergedSchema, leftMeta, t],
    );

    const renderRightValueComponent = useCallback(() => {
      const Comp = staticInputRenderer;
      return <Comp value={rightValue} onChange={(val: any) => (value.rightValue = val)} />;
    }, [staticInputRenderer, rightValue, value]);

    // 当启用右侧变量输入时，构造 VariableInput 的 converters，使其在未选择变量时渲染与 mergedSchema 对应的静态输入
    const rightConverters = useMemo<Converters>(() => {
      return {
        renderInputComponent: () => {
          const isVariable = typeof rightValue === 'string' && /\{\{\s*ctx\b/.test(rightValue);
          if (isVariable) return null;
          return staticInputRenderer;
        },
      };
    }, [staticInputRenderer, rightValue]);

    return (
      <Space>
        <VariableInput
          value={leftValue}
          metaTree={() => model.context.getPropertyMetaTree('{{ ctx.collection }}')}
          onChange={handleLeftChange}
          converters={customConverters}
          showValueComponent={false}
          style={{ width: 200 }}
          onlyLeafSelectable={true}
          placeholder={t('Select field')}
        />

        <Select
          style={{ width: 120 }}
          placeholder={t('Comparition')}
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
              onChange={(v) => (value.rightValue = v)}
              metaTree={rightMetaTree || (() => model.context.getPropertyMetaTree())}
              converters={rightConverters}
              showValueComponent
              style={{ width: 260 }}
              placeholder={t('Enter value')}
            />
          ) : (
            renderRightValueComponent()
          ))}
      </Space>
    );
  },
);
