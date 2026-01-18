/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input } from 'antd';
import {
  FlowModelRenderer,
  VariableInput,
  tExpr,
  isVariableExpression,
  parseValueToPath,
  isRunJSValue,
  type CollectionField,
  useFlowContext,
  EditableItemModel,
  FlowModelContext,
} from '@nocobase/flow-engine';
import { ensureOptionsFromUiSchemaEnumIfAbsent } from '../internal/utils/enumOptionsUtils';
import {
  findFormItemModelByFieldPath,
  getCollectionFromModel,
  isToManyAssociationField,
} from '../internal/utils/modelUtils';
import { RunJSValueEditor } from './RunJSValueEditor';

interface Props {
  /** 赋值目标路径，例如 `title` / `users.nickname` / `user.name` */
  targetPath: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
}

type ResolvedFieldContext = {
  itemModel: any | null;
  collection: any | null;
  dataSource: any | null;
  blockModel: any;
  fieldPath: string | null;
  fieldName: string | null;
  collectionField: CollectionField | null;
};

/**
 * 根据所选字段渲染对应的赋值编辑器：
 * - 使用临时的 VariableFieldFormModel 包裹字段模型，确保常量编辑为真实字段组件
 * - 支持变量引用，并提供 Constant / Null 两种快捷项
 */
export const FieldAssignValueInput: React.FC<Props> = ({ targetPath, value, onChange, placeholder }) => {
  const flowCtx = useFlowContext<FlowModelContext>();
  const normalizeEventValue = React.useCallback((eventOrValue: unknown) => {
    if (!eventOrValue || typeof eventOrValue !== 'object') return eventOrValue;
    if (!('target' in eventOrValue)) return eventOrValue;
    const target = (eventOrValue as { target?: unknown }).target;
    if (!target || typeof target !== 'object') return eventOrValue;
    if (!('value' in target)) return eventOrValue;
    return (target as { value?: unknown }).value;
  }, []);

  // 优先：表单上已配置的字段（含子表单/子表单列表的子字段）
  const itemModel = React.useMemo(() => {
    if (!targetPath) return null;
    return findFormItemModelByFieldPath(flowCtx.model, targetPath);
  }, [flowCtx.model, targetPath]);

  // 兜底：表单上未配置但来自关联字段 target collection 的嵌套属性（如 `user.name`）
  const resolveNestedAssociationField = React.useCallback(
    (
      rootCollection: any,
      path: string,
    ): { collection: any; fieldName: string; collectionField?: CollectionField } | null => {
      if (!rootCollection || typeof path !== 'string' || !path.includes('.')) return null;
      const segs = path.split('.').filter(Boolean);
      if (segs.length < 2) return null;

      let cur = rootCollection;
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        const isLast = i === segs.length - 1;
        const cf = typeof cur?.getField === 'function' ? (cur.getField(seg) as CollectionField | undefined) : undefined;
        if (!cf) return null;
        if (isLast) {
          return { collection: cur, fieldName: seg, collectionField: cf };
        }
        if (!cf?.isAssociationField?.() || !cf?.targetCollection) {
          return null;
        }
        cur = cf.targetCollection;
      }
      return null;
    },
    [],
  );

  const resolved = React.useMemo<ResolvedFieldContext>(() => {
    // 1) 来自表单配置的字段：直接使用 itemModel 上下文
    if (itemModel) {
      const ctx = itemModel.context;
      const { collection: ctxCollection, dataSource: ctxDataSource, blockModel } = ctx;
      const init = itemModel?.getStepParams?.('fieldSettings', 'init') || {};
      const dataSourceManager = itemModel?.context?.dataSourceManager || flowCtx.model?.context?.dataSourceManager;
      const collection =
        ctxCollection ||
        (init?.dataSourceKey && init?.collectionName
          ? dataSourceManager?.getCollection?.(init.dataSourceKey, init.collectionName)
          : undefined);
      const dataSource =
        ctxDataSource || (init?.dataSourceKey ? dataSourceManager?.getDataSource?.(init.dataSourceKey) : undefined);
      const fieldPath: string | undefined = init?.fieldPath;
      const fieldName = fieldPath?.split('.').slice(-1)[0];
      const cf = fieldName ? (collection?.getField?.(fieldName) as CollectionField | undefined) : undefined;
      return {
        itemModel,
        collection: collection || null,
        dataSource: dataSource || null,
        blockModel,
        fieldPath: fieldPath || null,
        fieldName: fieldName || null,
        collectionField: cf || null,
      };
    }

    // 2) 嵌套语义：根据 targetPath 在集合上解析（例如 user.name / user.profile.name）
    const rootCollection = getCollectionFromModel((flowCtx as any).model);
    const blockModel = (flowCtx as any).model?.context?.blockModel || (flowCtx as any).model;
    const empty: ResolvedFieldContext = {
      itemModel: null,
      collection: null,
      dataSource: null,
      blockModel,
      fieldPath: null,
      fieldName: null,
      collectionField: null,
    };
    const nested = resolveNestedAssociationField(rootCollection, targetPath);
    if (!nested) return empty;
    const collection = nested.collection;
    const fieldName = nested.fieldName;
    const dataSourceManager = flowCtx.model?.context?.dataSourceManager;
    const dataSource =
      (collection?.dataSourceKey ? dataSourceManager?.getDataSource?.(collection.dataSourceKey) : undefined) || null;
    return {
      ...empty,
      collection,
      dataSource,
      blockModel,
      fieldPath: fieldName,
      fieldName,
      collectionField: nested.collectionField || null,
    };
  }, [flowCtx.model, itemModel, resolveNestedAssociationField, targetPath]);

  const { collection, dataSource, blockModel, fieldPath, fieldName, collectionField: cf } = resolved;

  const isArrayValueField = React.useMemo(() => {
    if (isToManyAssociationField(cf)) return true;

    // 部分字段组件（如 Cascader / CascadeSelectList）期望 array 值；若 uiSchema 明确声明为 array，则视为 array 值字段
    const schemaType = cf?.uiSchema?.type;
    if (schemaType === 'array') return true;

    return false;
  }, [cf]);

  const coerceEmptyValueForRenderer = React.useCallback(
    (v: any) => {
      // VariableInput 会把 undefined/null 统一传成空字符串，这会导致 array 值组件（如 DynamicCascadeList）崩溃。
      if (isArrayValueField && (v == null || v === '')) return [];
      return v;
    },
    [isArrayValueField],
  );

  // 生成临时根模型 + 子字段模型
  const [tempRoot, setTempRoot] = React.useState<any>(null);
  React.useEffect(() => {
    if (!collection || !fieldPath || !fieldName) return;
    const engine = resolved?.itemModel?.context?.engine || (flowCtx as any).model?.context?.engine;

    const fields = typeof collection.getFields === 'function' ? collection.getFields() || [] : [];
    const f = fields.find((x: any) => x?.name === fieldName);
    const binding = EditableItemModel.getDefaultBindingByField(
      resolved?.itemModel?.context || flowCtx.model?.context,
      f,
    );
    const fieldModelUse: string | undefined = binding?.modelName;

    const subField = itemModel?.subModels?.field;
    const subFieldUse = subField && !Array.isArray(subField) ? subField.use : undefined;
    const effectiveFieldModelUse: string | undefined = fieldModelUse || subFieldUse;
    if (!effectiveFieldModelUse) return;

    const created = engine?.createModel?.({
      use: 'VariableFieldFormModel',
      subModels: {
        fields: [
          {
            use: effectiveFieldModelUse,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection?.dataSourceKey,
                  collectionName: collection?.name,
                  fieldPath,
                },
              },
            },
            props: {
              placeholder,
            },
          },
        ],
      },
    });
    if (!created) return;

    // 注入上下文（集合/数据源/字段/区块/资源）
    created.context?.defineProperty?.('collection', { value: collection });
    if (dataSource) created.context?.defineProperty?.('dataSource', { value: dataSource });
    if (cf) created.context?.defineProperty?.('collectionField', { value: cf });
    if (blockModel) created.context?.defineProperty?.('blockModel', { value: blockModel });
    if (created.context) {
      Object.defineProperty(created.context, 'resource', {
        configurable: true,
        enumerable: true,
        get: () => blockModel?.resource,
      });
    }

    // 字段模型基础属性设定
    const fm = created?.subModels?.fields?.[0];
    const multiple = isToManyAssociationField(cf);
    fm?.setProps?.({
      disabled: false,
      readPretty: false,
      pattern: 'editable',
      updateAssociation: false,
      multiple,
    });
    fm?.dispatchEvent?.('beforeRender', undefined, { sequential: true, useCache: true });
    // 为本地枚举型字段补全可选项（仅在未显式传入 options 时处理）
    ensureOptionsFromUiSchemaEnumIfAbsent(fm, cf);
    if (!fm?.props?.fieldNames && cf?.targetCollection) {
      const targetCol = cf.targetCollection;
      const valueKey = cf?.targetKey || targetCol?.filterTargetKey || 'id';
      const labelKey =
        typeof (targetCol as { titleField?: unknown } | null | undefined)?.titleField === 'string'
          ? (targetCol as { titleField?: string }).titleField
          : undefined;
      fm?.setProps?.({ fieldNames: { label: labelKey, value: valueKey } });
    }

    setTempRoot(created);
    return () => {
      created.subModels.fields.forEach?.((m) => m.remove());
      created.remove();
    };
  }, [collection, dataSource, blockModel, fieldPath, fieldName, flowCtx, placeholder, resolved, cf, itemModel]);

  // 同步 value/onChange 到临时根与字段模型
  React.useEffect(() => {
    if (!tempRoot) return;
    tempRoot.setProps?.({
      value,
      onChange: (ev: any) => onChange?.(normalizeEventValue(ev)),
    });
    const fm = tempRoot?.subModels?.fields?.[0];
    fm?.setProps?.({
      value,
      onChange: (ev: any) => onChange?.(normalizeEventValue(ev)),
    });
  }, [tempRoot, value, onChange, normalizeEventValue]);

  // 常量/空值的两个占位渲染器
  const ConstantValueEditor = React.useMemo(() => {
    const C: React.FC<any> = (inputProps) => {
      React.useEffect(() => {
        const coercedValue = coerceEmptyValueForRenderer(inputProps?.value);
        tempRoot?.setProps?.({
          ...inputProps,
          value: coercedValue,
          onChange: (ev: any) => inputProps?.onChange?.(normalizeEventValue(ev)),
        });
        const fm = tempRoot?.subModels?.fields?.[0];
        fm?.setProps?.({
          value: coercedValue,
          onChange: (ev: any) => inputProps?.onChange?.(normalizeEventValue(ev)),
        });
      }, [inputProps]);

      if (!tempRoot) {
        return (
          <Input
            value={inputProps?.value}
            onChange={(e) => inputProps?.onChange?.(normalizeEventValue(e))}
            placeholder={placeholder}
            style={{ width: '100%' }}
          />
        );
      }

      return (
        <div style={{ flex: 1, minWidth: 0 }}>
          <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
        </div>
      );
    };
    return C;
  }, [placeholder, tempRoot, coerceEmptyValueForRenderer, normalizeEventValue]);

  const NullComponent = React.useMemo(() => {
    const N: React.FC = () => (
      <Input placeholder={`<${flowCtx.t?.('Null') ?? 'Null'}>`} readOnly style={{ width: '100%' }} />
    );
    return N;
  }, [flowCtx]);

  const RunJSComponent = React.useMemo(() => {
    const C: React.FC<any> = (inputProps) => (
      <RunJSValueEditor t={flowCtx.t} value={inputProps?.value} onChange={inputProps?.onChange} />
    );
    return C;
  }, [flowCtx]);

  const metaTree = React.useMemo<() => Promise<any[]>>(() => {
    return async () => {
      const base = (await flowCtx.getPropertyMetaTree?.()) || [];
      return [
        {
          title: tExpr('Constant'),
          name: 'constant',
          type: 'string',
          paths: ['constant'],
          render: ConstantValueEditor,
        },
        { title: tExpr('Null'), name: 'null', type: 'object', paths: ['null'], render: NullComponent },
        { title: tExpr('RunJS'), name: 'runjs', type: 'object', paths: ['runjs'], render: RunJSComponent },
        ...base,
      ];
    };
  }, [flowCtx, ConstantValueEditor, NullComponent, RunJSComponent]);

  if (!fieldPath) {
    // 不可用占位
    return <Input disabled placeholder={flowCtx.t?.('Please select a field') ?? 'Please select a field'} />;
  }

  return (
    <VariableInput
      value={value}
      onChange={onChange}
      metaTree={metaTree}
      style={{ width: '100%' }}
      clearValue={''}
      converters={{
        renderInputComponent: (meta) => {
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return ConstantValueEditor;
          if (firstPath === 'null') return NullComponent;
          if (firstPath === 'runjs') return RunJSComponent;
          return null;
        },
        resolveValueFromPath: (item) => {
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') return '';
          if (firstPath === 'null') return null;
          if (firstPath === 'runjs') return { code: '', version: 'v1' };
          return undefined;
        },
        resolvePathFromValue: (currentValue) => {
          if (currentValue === null) return ['null'];
          if (isRunJSValue(currentValue)) return ['runjs'];
          return isVariableExpression(currentValue) ? parseValueToPath(currentValue) : ['constant'];
        },
      }}
    />
  );
};
