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
import { createForm, onFieldValueChange } from '@formily/core';
import type { Form, GeneralField, Field } from '@formily/core';
import type { ISchema } from '@formily/json-schema';
import {
  VariableInput,
  type MetaTreeNode,
  type Converters,
  FlowModel,
  useFlowViewContext,
  parseValueToPath,
  createEphemeralContext,
  createCollectionContextMeta,
  observer,
} from '@nocobase/flow-engine';
import _ from 'lodash';
import { NumberPicker } from '@formily/antd-v5';
import { lazy } from '../../../lazy-helper';
import { enumToOptions, UiSchemaEnumItem } from '../../internal/utils/enumOptionsUtils';
import { FormProvider, SchemaComponent } from '../../../schema-component/core';
import { resolveOperatorComponent } from '../../internal/utils/operatorSchemaHelper';

const { DateFilterDynamicComponent: DateFilterDynamicComponentLazy } = lazy(
  () => import('../../models/blocks/filter-form/fields/date-time/components/DateFilterDynamicComponent'),
  'DateFilterDynamicComponent',
);

// 简化的本地辅助：按需获取 ctx.collection 的字段树（MetaTreeNode[]）
async function buildCollectionLeftMetaTreeLocal(ctx: any): Promise<MetaTreeNode[]> {
  const resolve = async (sub: any): Promise<MetaTreeNode[]> => {
    if (Array.isArray(sub)) return sub as MetaTreeNode[];
    if (typeof sub === 'function') return await (sub as () => Promise<MetaTreeNode[]>)();
    return [];
  };

  // 1) 若已有 collection meta，直接复用
  if (ctx.getPropertyOptions?.('collection')?.meta) {
    const sub = ctx.getPropertyMetaTree?.('{{ ctx.collection }}');
    return await resolve(sub);
  }

  // 2) 否则在本组件范围内临时构建
  const getCollection = () => (ctx as any)?.collection ?? null;
  const scoped = await createEphemeralContext(ctx, {
    defineProperties: {
      collection: {
        get: getCollection,
        meta: createCollectionContextMeta(getCollection, 'Current collection'),
      },
    },
  });
  const subTree = scoped.getPropertyMetaTree?.('{{ ctx.collection }}');
  return await resolve(subTree);
}

export interface VariableFilterItemValue {
  path: string;
  operator: string;
  // 尽量收敛为常见联合类型，避免到处传播 unknown
  value: string | number | boolean | null | Array<string | number> | Record<string, unknown>;
  /** 操作符是否无右值（用于透传到 transformFilter 等） */
  noValue?: boolean;
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
  ignoreFieldNames?: string[];
}

function createStaticInputRenderer(
  schema: ISchema,
  meta: MetaTreeNode | null,
  t: (s: string) => string,
  app?: any,
): (
  p: { value?: VariableFilterItemValue['value']; onChange?: (v: VariableFilterItemValue['value']) => void } & Record<
    string,
    unknown
  >,
) => JSX.Element {
  const xComp = (schema as ISchema)?.['x-component'] as string | undefined;
  const fieldProps = meta?.uiSchema?.['x-component-props'] || {};
  const opProps = schema?.['x-component-props'] || {};
  const combinedProps = merge({}, fieldProps, opProps);
  const selectOptions = enumToOptions(schema?.enum as any, t) || [];

  // 这里保持 any，避免在不同组件 props 上产生不必要的类型冲突
  const commonProps: any = {
    style: { width: 200, ...(combinedProps?.style || {}) },
    placeholder: combinedProps?.placeholder || t('Enter value'),
    ...combinedProps,
  };

  const resolveNumberValue = (val: VariableFilterItemValue['value']) => {
    if (typeof val === 'number') {
      return val;
    }
    // stringMode 下 InputNumber/NumberPicker 会返回字符串，直接回填以避免被清空
    if (combinedProps?.stringMode === true && typeof val === 'string') {
      return val;
    }
    return undefined;
  };

  return (
    p: { value?: VariableFilterItemValue['value']; onChange?: (v: VariableFilterItemValue['value']) => void } & Record<
      string,
      unknown
    >,
  ) => {
    const { value, onChange, ...rest } = p || {};
    if (xComp === 'InputNumber')
      return (
        <InputNumber
          {...commonProps}
          {...rest}
          value={resolveNumberValue(value)}
          onChange={(v) => onChange?.(v as unknown as VariableFilterItemValue['value'])}
        />
      );
    if (xComp === 'NumberPicker')
      return (
        <NumberPicker
          {...commonProps}
          {...rest}
          value={resolveNumberValue(value)}
          onChange={(v) => onChange?.(v as unknown as VariableFilterItemValue['value'])}
        />
      );
    if (xComp === 'Switch')
      return <Switch {...commonProps} {...rest} checked={!!value} onChange={(checked) => onChange?.(checked)} />;
    if (xComp === 'Select')
      return (
        <Select
          options={selectOptions}
          {...commonProps}
          {...rest}
          value={
            Array.isArray(value) || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? (value as unknown)
              : undefined
          }
          onChange={(v) => onChange?.(v as unknown as VariableFilterItemValue['value'])}
        />
      );
    if (xComp === 'DateFilterDynamicComponent')
      return (
        <DateFilterDynamicComponentLazy
          {...commonProps}
          {...rest}
          value={value as unknown}
          onChange={(v: unknown) => onChange?.(v as VariableFilterItemValue['value'])}
        />
      );
    // 未内置的 x-component：尝试从 app 解析组件
    if (xComp && app?.getComponent) {
      const Comp = app.getComponent(xComp as any);
      if (Comp) {
        return (
          <Comp
            {...commonProps}
            {...rest}
            value={value}
            onChange={(v: any) => onChange?.(v as VariableFilterItemValue['value'])}
            style={{ width: 200, ...(commonProps.style || {}), ...(rest as any)?.style }}
          />
        );
      }
    }
    // 普通文本输入：透传组合输入事件，避免 IME 被中断
    return (
      <Input
        {...commonProps}
        {...rest}
        value={typeof value === 'string' ? value : value == null ? '' : String(value)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
      />
    );
  };
}

function normalizeRightValueInput(input: unknown) {
  if (input && typeof input === 'object') {
    const maybeEvent = input as { target?: { value?: unknown }; nativeEvent?: unknown; preventDefault?: () => void };
    const isEventLike = typeof maybeEvent.preventDefault === 'function' || !!maybeEvent.nativeEvent;
    if (isEventLike || 'target' in maybeEvent) {
      const targetValue = maybeEvent.target?.value;
      return targetValue !== undefined ? targetValue : input;
    }
  }
  return input;
}

/**
 * 上下文筛选项组件
 */
export const VariableFilterItem: React.FC<VariableFilterItemProps> = observer(
  ({ value, model, rightAsVariable, rightMetaTree, ignoreFieldNames }) => {
    // 使用 View 上下文，确保可访问 ctx.view 的异步子树
    const ctx = useFlowViewContext();
    const t = model.translate;
    const { path, operator, value: rightValueRaw } = value;

    // 左侧选中的元数据节点
    const [leftMeta, setLeftMeta] = useState<MetaTreeNode | null>(null);

    type OperatorMeta = {
      value: string;
      label: string | React.ReactNode;
      noValue?: boolean;
      schema?: ISchema;
      visible?: (meta: MetaTreeNode) => boolean;
    };
    type FieldInterfaceDef = {
      filterable?: {
        operators?: OperatorMeta[];
        children?: Array<{ name: string; title?: string; schema?: ISchema; operators?: OperatorMeta[] }>;
      };
    };

    // 基于字段接口的动态操作符元数据（优先使用子菜单 schema 中自定义的 operators，其次再用接口默认 operators）
    const operatorMetaList: OperatorMeta[] = useMemo(() => {
      if (!leftMeta) return [];
      const dm = model.context.app?.dataSourceManager;
      const fi = leftMeta.interface
        ? (dm?.collectionFieldInterfaceManager?.getFieldInterface(leftMeta.interface) as FieldInterfaceDef | undefined)
        : undefined;
      const schemaOps: OperatorMeta[] | undefined = (leftMeta as any)?.uiSchema?.['x-filter-operators'];
      const baseOps = (Array.isArray(schemaOps) && schemaOps.length ? schemaOps : fi?.filterable?.operators) || [];
      return baseOps.filter((op) => !op.visible || op.visible(leftMeta));
    }, [leftMeta, model]);

    useEffect(() => {
      if (!operatorMetaList.length) return;
      const matched = _.find(operatorMetaList, (o) => o.value === value.operator);
      if (!matched) {
        const first = operatorMetaList[0];
        value.operator = first.value;
        value.value = first.noValue ? true : undefined;
        value.noValue = !!first.noValue;
      } else {
        value.noValue = !!matched.noValue;
      }
    }, [operatorMetaList, value]);

    // Select 的可见选项
    const operatorOptions = useMemo(() => {
      return operatorMetaList.map((op) => ({
        value: op.value,
        label: typeof op.label === 'string' ? t(op.label) : op.label,
      }));
    }, [operatorMetaList, t]);

    // 处理左侧值变化（值由 converters 决定如何解析）
    const handleLeftChange = useCallback(
      (variableValue: string, meta?: MetaTreeNode) => {
        const prevPath = value.path || '';
        const nextPath = variableValue || '';
        const changed = nextPath !== prevPath;
        value.path = nextPath;
        // 左侧字段切换时，清空操作符和值，避免跨字段复用旧输入
        if (changed && prevPath) {
          value.operator = '';
          value.value = undefined;
          value.noValue = false;
        }
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
          value.value = true;
          value.noValue = true;
        } else {
          value.value = undefined;
          value.noValue = false;
        }
      },
      [operatorMetaList, value],
    );

    // 使用公共静态输入渲染器（抽取到 utils）

    const currentOpMeta = useMemo(
      () => operatorMetaList.find((op) => op.value === operator),
      [operatorMetaList, operator],
    );

    const resolveFormulaDataType = useCallback((meta?: MetaTreeNode) => {
      return (
        (meta as any)?.options?.dataType || (meta as any)?.dataType || meta?.type || meta?.uiSchema?.type || 'double'
      );
    }, []);

    const getFormulaFilterComponent = useCallback((dataType: string) => {
      switch (dataType) {
        case 'boolean':
          return 'Switch';
        case 'date':
          return 'DateFilterDynamicComponent';
        case 'integer':
        case 'bigInt':
        case 'double':
        case 'decimal':
        case 'number':
          return 'InputNumber';
        case 'string':
        default:
          return 'Input';
      }
    }, []);

    // 轻量动态输入渲染：使用 formily 动态 schema 渲染 mergedSchema
    const mergedSchema: ISchema = useMemo(() => {
      const fieldSchema = leftMeta?.uiSchema || {};
      const opSchema = currentOpMeta?.schema || {};
      const merged = merge({}, fieldSchema, opSchema);
      // 公式字段：在筛选场景下改为可编辑输入组件，并标记筛选上下文
      if (leftMeta?.interface === 'formula') {
        const dataType = resolveFormulaDataType(leftMeta);
        const override: ISchema = {
          'x-read-pretty': false,
          'x-component': getFormulaFilterComponent(dataType),
          'x-component-props': {
            ...(merged['x-component-props'] as Record<string, any>),
          },
        };
        const next = merge({}, merged, override);
        return next;
      }
      return merged;
    }, [leftMeta, currentOpMeta, getFormulaFilterComponent, resolveFormulaDataType]);

    // 仅在组件类型切换且新组件为日期/时间类时，检测不兼容旧值并清空；首渲染保留旧值
    const prevXComponentRef = React.useRef<string | undefined>(mergedSchema?.['x-component'] as string | undefined);
    const xComp = mergedSchema?.['x-component'] as string | undefined;
    const rightValue = useMemo(() => {
      const prev = prevXComponentRef.current;
      prevXComponentRef.current = xComp;

      const switched = prev !== undefined && prev !== xComp; // 首次渲染 prev 为 undefined，不做清空

      // 对于 noValue 操作符（如布尔 isTruly/isFalsy），保留此前在 handleOperatorChange 中写入的占位值
      if (currentOpMeta?.noValue) {
        return rightValueRaw;
      }

      if (switched && rightValueRaw != null) {
        value.value = undefined;
        return undefined;
      }
      return rightValueRaw;
    }, [xComp, rightValueRaw, value, currentOpMeta]);

    const setRightValue = useCallback(
      (next: unknown) => {
        value.value = normalizeRightValueInput(next) as VariableFilterItemValue['value'];
      },
      [value],
    );

    // 右侧静态输入（无变量模式）与右侧 VariableInput 的静态渲染组件，统一复用
    // t 可能每次渲染产生新引用，导致 staticInputRenderer 引用不稳定，进而触发右侧输入卸载/重建。
    // 通过 stableT 包装，保持函数引用稳定，同时读取最新的 t。
    const tRef = React.useRef(t);
    React.useEffect(() => {
      tRef.current = t;
    }, [t]);
    const stableT = React.useCallback((s: string) => tRef.current?.(s) ?? s, []);

    const enumOptions = useMemo(
      () => enumToOptions(mergedSchema?.enum as UiSchemaEnumItem[], stableT) || [],
      [mergedSchema, stableT],
    );

    const staticInputRenderer = useMemo(
      () => createStaticInputRenderer(mergedSchema, leftMeta, stableT, model.context.app),
      [mergedSchema, leftMeta, stableT, model.context.app],
    );

    // 判断是否需要使用 SchemaComponent 动态渲染（支持更多 x-component，如行政区、代码编辑器等）
    const isStaticSupported = useCallback((xComp?: string) => {
      if (!xComp) return true; // 无声明时回落到 Input，静态可处理
      return (
        xComp === 'Input' ||
        xComp === 'InputNumber' ||
        xComp === 'NumberPicker' ||
        xComp === 'Switch' ||
        xComp === 'Select' ||
        xComp === 'DateFilterDynamicComponent'
      );
    }, []);

    const DynamicRightValue = useMemo(() => {
      // 组件类型保持稳定，避免输入过程中重挂载导致失焦
      function Dynamic({ dynValue }: { dynValue: unknown }) {
        const onChangeValueRef = React.useRef<(v: unknown) => void>(() => {});
        // 将外部变更回调保持最新引用
        const onChangeValue = useCallback(
          (v: VariableFilterItemValue['value']) => {
            setRightValue(v);
          },
          [setRightValue],
        );
        useEffect(() => {
          onChangeValueRef.current = onChangeValue;
        }, [onChangeValue]);

        const formRef = React.useRef<Form | null>(null);
        if (!formRef.current) {
          formRef.current = createForm({
            values: { value: dynValue },
            effects() {
              const hasValue = (f: GeneralField): f is Field => 'value' in f;
              onFieldValueChange('value', (field: GeneralField) => {
                if (hasValue(field)) {
                  onChangeValueRef.current(field.value as unknown);
                }
              });
            },
          });
        }
        // 同步外部值到表单，但不重建表单，避免失焦
        useEffect(() => {
          formRef.current?.setValues({ value: dynValue });
        }, [dynValue]);

        const schemaRHS: ISchema = useMemo(
          () =>
            merge(
              {
                name: 'value',
                'x-component': 'Input',
                'x-component-props': {
                  style: { width: 200 },
                  placeholder: stableT('Enter value'),
                },
                'x-read-pretty': false,
                'x-validator': undefined,
                'x-decorator': undefined,
              },
              mergedSchema || {},
            ),
          [mergedSchema, stableT],
        );

        return (
          <FormProvider form={formRef.current!}>
            <div style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}>
              <SchemaComponent schema={schemaRHS} />
            </div>
          </FormProvider>
        );
      }
      return Dynamic;
    }, [mergedSchema, stableT, setRightValue]);

    //

    const renderRightValueComponent = useCallback(() => {
      // 文本类多关键词：优先使用操作符 schema 声明的组件
      const resolved = resolveOperatorComponent(model.context.app, operator, operatorMetaList);
      const supportKeyword = operator === '$in' || operator === '$notIn';
      if (resolved && supportKeyword) {
        const { Comp, props: xProps } = resolved;
        const nextProps = { ...xProps };
        if ((!nextProps?.options || nextProps?.options.length === 0) && enumOptions?.length) {
          nextProps.options = enumOptions;
        }
        const style = {
          flex: '1 1 40%',
          minWidth: 160,
          maxWidth: '100%',
          ...(nextProps?.style || {}),
        };
        const normalized =
          Array.isArray(rightValue) && rightValue.every((v) => typeof v === 'string' || typeof v === 'number')
            ? (rightValue as Array<string | number>)
            : typeof rightValue === 'string'
              ? rightValue
                  .split(/\r?\n/)
                  .map((v) => v.trim())
                  .filter(Boolean)
              : [];
        return (
          <div style={style}>
            <Comp
              {...nextProps}
              style={{ width: '100%', ...(nextProps?.style || {}) }}
              value={normalized}
              onChange={(vals: any) => setRightValue(vals)}
            />
          </div>
        );
      }

      if (isStaticSupported(xComp)) {
        const Comp = staticInputRenderer;
        return (
          <div style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}>
            <Comp value={rightValue} onChange={(val) => setRightValue(val)} />
          </div>
        );
      }
      const DynamicRightInput = DynamicRightValue;
      return <DynamicRightInput dynValue={rightValue} />;
    }, [
      DynamicRightValue,
      isStaticSupported,
      operator,
      operatorMetaList,
      rightValue,
      staticInputRenderer,
      model.context.app,
      setRightValue,
      enumOptions,
    ]);

    // Null 占位组件（仿照 DefaultValue.tsx 的实现）
    const NullComponent = useMemo(() => {
      return function NullValue() {
        return <Input placeholder={`<${t('Null')}>`} readOnly />;
      };
    }, [t]);

    // 右侧变量树：在原有变量上下文前，追加“常量/空值”两个根选项
    const mergedRightMetaTree = useMemo(() => {
      return async () => {
        const raw =
          typeof rightMetaTree === 'function' ? await rightMetaTree() : rightMetaTree ?? ctx.getPropertyMetaTree();
        const nodes: MetaTreeNode[] = Array.isArray(raw)
          ? (raw as MetaTreeNode[])
          : await (raw as () => Promise<MetaTreeNode[]>)();
        return [
          { title: t('Constant'), name: 'constant', type: 'string', paths: ['constant'], render: staticInputRenderer },
          { title: t('Null'), name: 'null', type: 'object', paths: ['null'], render: NullComponent },
          ...nodes,
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
          const parsed = typeof val === 'string' ? parseValueToPath(val) : undefined;
          if (parsed) return parsed;
          return ['constant'];
        },
      };
    }, [NullComponent, staticInputRenderer]);

    // 为 2.0 左侧字段选择器追加“接口 filterable.children”定义（如 chinaRegion 的“省市区名称”子项），
    // 以恢复 1.0 左侧子菜单的能力。
    const enhancedMetaTree = useMemo(() => {
      type MetaTreeProvider = () => MetaTreeNode[] | Promise<MetaTreeNode[]>;
      return async () => {
        const dm = model.context.app?.dataSourceManager;
        const fiMgr = dm?.collectionFieldInterfaceManager;

        // 优先复用已注入 meta；否则在本组件范围内临时构建
        const nodes: MetaTreeNode[] = await buildCollectionLeftMetaTreeLocal(model.context);

        const enhanceNode = async (node: MetaTreeNode): Promise<MetaTreeNode> => {
          const fi = node.interface
            ? (fiMgr?.getFieldInterface(node.interface) as FieldInterfaceDef | undefined)
            : undefined;
          const extraChildren: MetaTreeNode[] = [];
          const filterable = fi?.filterable;
          const childrenDefs = filterable?.children as
            | Array<{ name: string; title?: string; schema?: ISchema; operators?: OperatorMeta[] }>
            | undefined;
          if (Array.isArray(childrenDefs) && childrenDefs.length) {
            for (const c of childrenDefs) {
              extraChildren.push({
                name: c.name,
                title: c.title || c.name,
                type: (c.schema?.type as string) || 'string',
                // 为子项赋予一个可用的接口，以便拿到操作符（使用 input => string operators）
                interface: c.schema?.['x-component'] === 'Select' ? 'select' : 'input',
                // 将子项 operators 注入到 schema 上，供 operatorMetaList 优先读取
                uiSchema: { ...(c.schema || {}), 'x-filter-operators': c.operators },
                paths: [...(node.paths || []), c.name],
                parentTitles: [...(node.parentTitles || []), node.title],
              });
            }
          }
          // 合并原有 children（可能是数组或按需加载函数）与 extraChildren
          if (typeof node.children === 'function') {
            const original = node.children;
            return {
              ...node,
              children: async () => {
                const base = await original();
                const merged = [...(Array.isArray(base) ? base : []), ...extraChildren];
                return _.uniqBy(merged, 'name');
              },
            } as MetaTreeNode;
          }
          const merged = [...(Array.isArray(node.children) ? (node.children as MetaTreeNode[]) : []), ...extraChildren];
          return { ...node, children: merged.length ? merged : node.children } as MetaTreeNode;
        };

        // 逐个节点增强；（当前根层已经是集合字段列表，无需递归处理更深层）
        const out: MetaTreeNode[] = [];
        for (const n of nodes) {
          out.push(await enhanceNode(n));
        }
        return out;
      };
    }, [model]);

    return (
      <Space wrap style={{ width: '100%' }}>
        <VariableInput
          value={path}
          metaTree={enhancedMetaTree}
          onChange={handleLeftChange}
          converters={customConverters}
          showValueComponent={false}
          style={{ flex: '1 1 40%', minWidth: 160, maxWidth: '100%' }}
          onlyLeafSelectable={true}
          placeholder={t('Select field')}
          ignoreFieldNames={ignoreFieldNames}
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
              onChange={(v) => setRightValue(v)}
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
