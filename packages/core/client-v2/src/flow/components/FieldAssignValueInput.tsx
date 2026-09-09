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
  type CollectionField,
  type MetaTreeNode,
  type VariableInputProps,
  useFlowContext,
  EditableItemModel,
  FlowModelContext,
} from '@nocobase/flow-engine';
import { ensureOptionsFromUiSchemaEnumIfAbsent } from '../internal/utils/enumOptionsUtils';
import {
  CUSTOM_FIELD_TARGET_PATH_PREFIX,
  findFormItemModelByFieldPath,
  getCollectionFromModel,
  getFormItemPreferredFieldPath,
  isToManyAssociationField,
} from '../internal/utils/modelUtils';
import { RunJSValueEditor } from './RunJSValueEditor';
import { pickOperatorStyle as pickStyle, resolveOperatorComponent } from '../internal/utils/operatorSchemaHelper';
import { InputFieldModel } from '../models/fields/InputFieldModel';
import { normalizeFilterValueByOperator } from '../models/blocks/filter-form/valueNormalization';
import { limitAssociationMetaTree } from './filter/metaTreeAssociationDepth';
import {
  DEFAULT_DATE_VARIABLE_COMPONENT_PROPS,
  FieldValueVariableInput,
  getFieldInterface,
  isDateLikeField as isDateLikeCollectionField,
  resolveDateVariableComponentProps,
} from './field-value-variable';

export {
  normalizeDateVariableExactValue,
  normalizeDateVariableOutput,
  toExactPickerDisplayValue,
  type DateVariableExactNormalizeMode,
} from './field-value-variable';

interface Props {
  /** 赋值目标路径，例如 `title` / `users.nickname` / `user.name` */
  targetPath: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  /** 额外变量树（置于 Constant/Null/RunJS 与 base metaTree 之间） */
  extraMetaTree?: MetaTreeNode[];
  /** 可选：当前字段的筛选操作符，用于在默认值/赋值编辑器中按 operator schema 适配输入组件 */
  operator?: string;
  /** 可选：操作符元数据列表（通常来自 collectionField.filterable.operators） */
  operatorMetaList?: Array<any>;
  /** 可选：当字段已存在于表单时，优先复用表单字段的模型（用于筛选表单默认值等场景） */
  preferFormItemFieldModel?: boolean;
  /** 可选：关系字段显示映射覆盖（用于值编辑器内预览 title field） */
  associationFieldNamesOverride?: {
    label?: string;
    value?: string;
  };
  /**
   * @deprecated Date 已作为独立一级变量提供，此参数仅为调用兼容保留。
   */
  enableDateVariableAsConstant?: boolean;
  /** 是否允许在变量选择器中使用 RunJS。默认 true，保持历史行为。 */
  allowRunJS?: boolean;
  maxAssociationFieldDepth?: number;
  disabled?: boolean;
  variableConverters?: VariableInputProps['converters'];
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

function withFullWidthStyle(style?: React.CSSProperties): React.CSSProperties {
  return { ...style, width: '100%', minWidth: 0 };
}

function rewrapReactiveRender(fieldModel: any) {
  if (!fieldModel) return;
  fieldModel._reactiveWrapperCache = undefined;
  fieldModel.setupReactiveRender?.();
}

function remapMetaTreePaths(node: MetaTreeNode, fromPrefix: string[], toPrefix: string[]): MetaTreeNode {
  const src = Array.isArray(node?.paths) ? node.paths.map((p) => String(p)) : [];
  let nextPaths = src;
  if (fromPrefix.length && src.length >= fromPrefix.length && fromPrefix.every((seg, idx) => src[idx] === seg)) {
    nextPaths = [...toPrefix, ...src.slice(fromPrefix.length)];
  }

  const remapChildren = (children: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>)) => {
    if (Array.isArray(children)) {
      return children.map((child) => remapMetaTreePaths(child, fromPrefix, toPrefix));
    }
    if (typeof children === 'function') {
      return async () => {
        const loaded = await children();
        return Array.isArray(loaded) ? loaded.map((child) => remapMetaTreePaths(child, fromPrefix, toPrefix)) : [];
      };
    }
    return children;
  };

  return {
    ...node,
    paths: nextPaths,
    children: node?.children ? remapChildren(node.children as any) : undefined,
  };
}

function attachBaseItemAsParent(extraItem: MetaTreeNode, baseItem: MetaTreeNode | undefined): MetaTreeNode {
  if (!baseItem) return extraItem;
  const mappedBaseItem = remapMetaTreePaths(baseItem, ['item'], ['item', 'parentItem']);
  const mappedBase: MetaTreeNode = {
    ...mappedBaseItem,
    name: 'parentItem',
    title: mappedBaseItem.title?.replace('Current item', 'Parent item') || 'Parent item',
  };
  const rewrite = (node: MetaTreeNode): MetaTreeNode => {
    const children = Array.isArray(node.children) ? node.children : [];
    const hasParent = children.some((child) => child?.name === 'parentItem');
    if (!hasParent) {
      return {
        ...node,
        children: [...children, mappedBase],
      };
    }

    const nextChildren = children.map((child) => {
      if (child?.name !== 'parentItem') return child;
      return rewrite(child);
    });
    return {
      ...node,
      children: nextChildren,
    };
  };

  return rewrite(extraItem);
}

export function mergeItemMetaTreeForAssignValue(baseTree: MetaTreeNode[], extraTree: MetaTreeNode[]): MetaTreeNode[] {
  const base = Array.isArray(baseTree) ? baseTree : [];
  const extra = Array.isArray(extraTree) ? extraTree : [];
  if (!extra.length) return base;

  const baseItem = base.find((node) => node?.name === 'item');
  const extraItem = extra.find((node) => node?.name === 'item');
  if (!extraItem) {
    return base;
  }

  const mergedItem = attachBaseItemAsParent(extraItem, baseItem);
  const out: MetaTreeNode[] = [];
  let itemReplaced = false;
  for (const node of base) {
    if (!itemReplaced && node?.name === 'item') {
      out.push(mergedItem);
      itemReplaced = true;
      continue;
    }
    out.push(node);
  }
  if (!itemReplaced) {
    out.push(mergedItem);
  }
  return out;
}

export function resolveAssignValueFieldPath(itemModel: any): string | undefined {
  if (!itemModel) return undefined;
  const init = itemModel?.getStepParams?.('fieldSettings', 'init') || {};
  return init?.fieldPath || getFormItemPreferredFieldPath(itemModel);
}

function getAssignValueSubField(itemModel: any) {
  const subField = itemModel?.subModels?.field;
  return subField && !Array.isArray(subField) ? subField : undefined;
}

type AssignValueFieldSettingsInit = {
  dataSourceKey?: string;
  collectionName?: string;
  fieldPath?: string;
};

type AssignValueFieldSource = {
  originFieldModel?: any;
  originProps: Record<string, any>;
  customFieldName?: string;
  customFieldProps: Record<string, any>;
  currentAllowMultiple?: boolean;
  currentFieldModelUse?: string;
};

const ASSIGN_VALUE_IGNORED_PROP_KEYS = new Set([
  'value',
  'defaultValue',
  'hidden',
  'onChange',
  'onClick',
  'open',
  'searchText',
  'dropdownRender',
  'popupRender',
  'optionRender',
]);

const ASSIGN_VALUE_ASSOCIATION_FIELD_MODEL_USE = 'RecordSelectFieldModel';
const ASSIGN_VALUE_ASSOCIATION_WRAPPER_MODEL_USES = new Set([
  'FieldModel',
  'SubFormFieldModel',
  'SubFormListFieldModel',
  'SubTableFieldModel',
  'PopupSubTableFieldModel',
  'RecordPickerFieldModel',
]);

function getAssignValueOriginFieldModel(itemModel: any) {
  return itemModel?.customFieldModelInstance || getAssignValueSubField(itemModel);
}

function pickAssignValueString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && !!value);
}

function pickAssignValueBoolean(...values: unknown[]) {
  return values.find((value): value is boolean => typeof value === 'boolean');
}

function isAssignValueAssociationWrapperModelUse(use?: string): boolean {
  return !!use && ASSIGN_VALUE_ASSOCIATION_WRAPPER_MODEL_USES.has(use);
}

function isAssignValueAssociationSelectModelUse(use?: string): boolean {
  return use?.endsWith('RecordSelectFieldModel') ?? false;
}

function resolveAssignValueFieldSource(itemModel: any): AssignValueFieldSource {
  const subField = getAssignValueSubField(itemModel);
  const customFieldSettings = itemModel?.getStepParams?.('formItemSettings', 'fieldSettings') ?? {};
  const originFieldModel = getAssignValueOriginFieldModel(itemModel);
  const originProps = (originFieldModel?.props ?? {}) as Record<string, any>;
  const customFieldProps = (itemModel?.customFieldProps ?? customFieldSettings?.fieldModelProps ?? {}) as Record<
    string,
    any
  >;

  return {
    originFieldModel,
    originProps,
    customFieldName: pickAssignValueString(customFieldSettings?.name),
    customFieldProps,
    currentAllowMultiple: pickAssignValueBoolean(
      originFieldModel?.getStepParams?.('selectSettings', 'allowMultiple')?.allowMultiple,
      originFieldModel?.stepParams?.selectSettings?.allowMultiple?.allowMultiple,
      originProps?.allowMultiple,
      originProps?.multiple,
      customFieldProps?.allowMultiple,
      customFieldProps?.multiple,
    ),
    currentFieldModelUse: pickAssignValueString(
      subField?.stepParams?.fieldBinding?.use,
      subField?.use,
      customFieldSettings?.fieldModel,
      itemModel?.customFieldModelInstance?.use,
    ),
  };
}

function resolveAssignValueFieldSettingsInit(options: {
  collection?: { dataSourceKey?: string; name?: string } | null;
  customFieldName?: string;
  fieldPath?: string | null;
  fieldName?: string | null;
}): AssignValueFieldSettingsInit | undefined {
  const { collection, customFieldName, fieldPath, fieldName } = options;
  if (!collection?.name || !fieldPath) {
    return undefined;
  }

  const normalizedFieldPath = fieldPath.startsWith(`${CUSTOM_FIELD_TARGET_PATH_PREFIX}:`)
    ? customFieldName || fieldName || fieldPath
    : fieldPath;

  return {
    dataSourceKey: collection.dataSourceKey,
    collectionName: collection.name,
    fieldPath: normalizedFieldPath,
  };
}

function sanitizeAssignValueInheritedProps(props?: Record<string, any>) {
  const nextProps: Record<string, any> = {};
  for (const [key, value] of Object.entries(props ?? {})) {
    if (ASSIGN_VALUE_IGNORED_PROP_KEYS.has(key) || /^on[A-Z]/.test(key)) {
      continue;
    }
    nextProps[key] = value;
  }
  return nextProps;
}

function resolveAssignValueFieldProps(options: {
  placeholder?: string;
  originProps?: Record<string, any>;
  customFieldProps?: Record<string, any>;
  collectionField?: Pick<CollectionField, 'isAssociationField'> | null;
}) {
  const { placeholder, originProps, customFieldProps, collectionField } = options;
  const sanitizedOriginProps = sanitizeAssignValueInheritedProps(originProps);
  const sanitizedCustomFieldProps = sanitizeAssignValueInheritedProps(customFieldProps);
  const nextProps: Record<string, any> = {
    placeholder,
    ...sanitizedOriginProps,
    ...sanitizedCustomFieldProps,
  };

  if (collectionField?.isAssociationField?.()) {
    delete nextProps.mode;
    nextProps.quickCreate = 'none';
  }

  return nextProps;
}

function normalizeAssignValueAssociationFieldModelUse(use?: string) {
  return isAssignValueAssociationWrapperModelUse(use) ? undefined : use;
}

function resolveAssignValueAssociationFieldModelUse(options: {
  currentFieldModelUse?: string;
  defaultBindingUse?: string;
  preferFormItemFieldModel?: boolean;
}): string | undefined {
  const { currentFieldModelUse, defaultBindingUse, preferFormItemFieldModel } = options;
  const normalizedCurrentFieldModelUse = normalizeAssignValueAssociationFieldModelUse(currentFieldModelUse);
  const normalizedDefaultBindingUse = normalizeAssignValueAssociationFieldModelUse(defaultBindingUse);

  if (isAssignValueAssociationWrapperModelUse(currentFieldModelUse)) {
    return normalizedDefaultBindingUse ?? ASSIGN_VALUE_ASSOCIATION_FIELD_MODEL_USE;
  }

  if (preferFormItemFieldModel) {
    return normalizedCurrentFieldModelUse ?? normalizedDefaultBindingUse ?? ASSIGN_VALUE_ASSOCIATION_FIELD_MODEL_USE;
  }

  return normalizedDefaultBindingUse ?? normalizedCurrentFieldModelUse ?? ASSIGN_VALUE_ASSOCIATION_FIELD_MODEL_USE;
}

function resolveAssignValueFieldMode(options: {
  fieldModelUse?: string;
  collectionField?: Pick<CollectionField, 'isAssociationField' | 'interface' | 'uiSchema'> | null;
}): string | undefined {
  const { fieldModelUse, collectionField } = options;
  const modeFromSchema = collectionField?.uiSchema?.['x-component-props']?.mode as string | undefined;

  if (collectionField?.isAssociationField?.() && isAssignValueAssociationSelectModelUse(fieldModelUse)) {
    return 'Select';
  }

  if (collectionField?.interface === 'multipleSelect') {
    return modeFromSchema ?? 'multiple';
  }

  return modeFromSchema;
}

export function resolveAssignValueFieldModelConfig(options: {
  itemModel: any;
  defaultBindingUse?: string;
  collectionField?: Pick<CollectionField, 'isAssociationField'> | null;
  fieldSource?: AssignValueFieldSource;
  preferFormItemFieldModel?: boolean;
  fieldSettingsInit?: AssignValueFieldSettingsInit;
}): { use?: string; stepParams: Record<string, any> } {
  const { itemModel, defaultBindingUse, collectionField, preferFormItemFieldModel, fieldSettingsInit } = options;
  const fieldSource = options.fieldSource ?? resolveAssignValueFieldSource(itemModel);
  const { currentFieldModelUse, originFieldModel } = fieldSource;
  const use = collectionField?.isAssociationField?.()
    ? resolveAssignValueAssociationFieldModelUse({
        currentFieldModelUse,
        defaultBindingUse,
        preferFormItemFieldModel,
      })
    : preferFormItemFieldModel
      ? currentFieldModelUse ?? defaultBindingUse
      : defaultBindingUse ?? currentFieldModelUse;

  // 赋值编辑器直接创建最终字段模型，避免 FieldModel.resolveUse 再次根据继承的 fieldBinding.use
  // 跳回 SubForm/SubTable/PopupSubTable 等原表单组件。
  const { fieldBinding: _ignoredFieldBinding, ...restStepParams } = (originFieldModel?.stepParams ?? {}) as Record<
    string,
    any
  >;
  const stepParams: Record<string, any> = {
    ...restStepParams,
  };

  if (fieldSettingsInit) {
    stepParams.fieldSettings = {
      ...stepParams.fieldSettings,
      init: {
        ...stepParams.fieldSettings?.init,
        ...fieldSettingsInit,
      },
    };
  }

  return {
    use,
    stepParams,
  };
}

/**
 * 根据所选字段渲染对应的赋值编辑器：
 * - 使用临时的 VariableFieldFormModel 包裹字段模型，确保常量编辑为真实字段组件
 * - 支持变量引用，并提供 Constant / Null 两种快捷项
 */
export const FieldAssignValueInput: React.FC<Props> = ({
  targetPath,
  value,
  onChange,
  placeholder,
  extraMetaTree,
  operator,
  operatorMetaList,
  preferFormItemFieldModel,
  associationFieldNamesOverride,
  allowRunJS = true,
  maxAssociationFieldDepth = 2,
  disabled = false,
  variableConverters,
}) => {
  const flowCtx = useFlowContext<FlowModelContext>();
  const normalizeEventValue = React.useCallback((eventOrValue: unknown) => {
    if (!eventOrValue || typeof eventOrValue !== 'object') return eventOrValue;
    if (!('target' in eventOrValue)) return eventOrValue;
    const target = (eventOrValue as { target?: unknown }).target;
    if (!target || typeof target !== 'object') return eventOrValue;
    if (!('value' in target)) return eventOrValue;
    return (target as { value?: unknown }).value;
  }, []);

  // extraMetaTree 可能来自父组件动态构造（引用不稳定），这里用 ref 保持 metaTree getter 稳定，避免 VariableInput 频繁刷新。
  const extraMetaTreeRef = React.useRef(extraMetaTree);
  React.useEffect(() => {
    extraMetaTreeRef.current = extraMetaTree;
  }, [extraMetaTree]);

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
      const itemModelAny = itemModel as any;
      const ctx = itemModel.context;
      const { collection: ctxCollection, dataSource: ctxDataSource, blockModel } = ctx;
      const init = itemModel?.getStepParams?.('fieldSettings', 'init') || {};
      const dataSourceManager = itemModel?.context?.dataSourceManager || flowCtx.model?.context?.dataSourceManager;
      const rootCollectionFallback = getCollectionFromModel(flowCtx.model);
      const collection =
        ctxCollection ||
        (init?.dataSourceKey && init?.collectionName
          ? dataSourceManager?.getCollection?.(init.dataSourceKey, init.collectionName)
          : undefined) ||
        rootCollectionFallback;
      const dataSource =
        ctxDataSource ||
        (init?.dataSourceKey ? dataSourceManager?.getDataSource?.(init.dataSourceKey) : undefined) ||
        (collection?.dataSourceKey ? dataSourceManager?.getDataSource?.(collection.dataSourceKey) : undefined);
      const fieldPath = resolveAssignValueFieldPath(itemModel);
      const fieldName = fieldPath?.split('.').slice(-1)[0];
      const collectionFieldFromModel = fieldName
        ? (collection?.getField?.(fieldName) as CollectionField | undefined)
        : undefined;
      const customCollectionField = itemModelAny?.customFieldModelInstance?.context?.collectionField as
        | CollectionField
        | undefined;
      const cf = collectionFieldFromModel || customCollectionField;
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

    // 2) 未配置字段：优先按根集合解析顶层字段（例如 foo / user）
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

    const topLevelField =
      typeof rootCollection?.getField === 'function' ? (rootCollection.getField(targetPath) as CollectionField) : null;
    if (topLevelField) {
      const fieldName = String((topLevelField as any)?.name || targetPath || '');
      const dataSourceManager = flowCtx.model?.context?.dataSourceManager;
      const dataSource =
        (rootCollection?.dataSourceKey
          ? dataSourceManager?.getDataSource?.(rootCollection.dataSourceKey)
          : undefined) || null;
      return {
        ...empty,
        collection: rootCollection,
        dataSource,
        blockModel,
        fieldPath: fieldName,
        fieldName,
        collectionField: topLevelField || null,
      };
    }

    // 3) 兜底：表单上未配置但来自关联字段 target collection 的嵌套属性（如 `user.name`）
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
  }, [flowCtx, itemModel, resolveNestedAssociationField, targetPath]);

  const { collection, dataSource, blockModel, fieldPath, fieldName, collectionField: cf } = resolved;
  const itemCollectionField = (resolved?.itemModel as any)?.context?.collectionField;
  const fieldSource = React.useMemo(() => resolveAssignValueFieldSource(itemModel), [itemModel]);
  const currentAllowMultiple = React.useMemo(() => {
    const effectiveCollectionField = (cf as CollectionField | null) || itemCollectionField || null;
    if (!effectiveCollectionField?.isAssociationField?.() || !isToManyAssociationField(effectiveCollectionField)) {
      return undefined;
    }
    return fieldSource.currentAllowMultiple;
  }, [cf, fieldSource.currentAllowMultiple, itemCollectionField]);

  const sourceInterface = React.useMemo(() => {
    return getFieldInterface(cf) || getFieldInterface(itemCollectionField);
  }, [cf, itemCollectionField]);

  const sourceCollectionField = (cf as any) || itemCollectionField;

  const isArrayValueField = React.useMemo(() => {
    if ((cf as any)?.isAssociationField?.() || (itemCollectionField as any)?.isAssociationField?.()) {
      const effectiveCollectionField = (cf as CollectionField | null) || itemCollectionField || null;
      if (effectiveCollectionField && isToManyAssociationField(effectiveCollectionField)) {
        return currentAllowMultiple ?? true;
      }
    }

    // 部分字段组件（如 Cascader / CascadeSelectList）期望 array 值；若 uiSchema 明确声明为 array，则视为 array 值字段
    const fieldInterface = getFieldInterface(cf);
    if (fieldInterface === 'multipleSelect' || fieldInterface === 'checkboxGroup') return true;

    const schemaType = cf?.uiSchema?.type;
    if (schemaType === 'array') return true;

    return false;
  }, [cf, currentAllowMultiple, itemCollectionField]);

  const isDateLikeField = React.useMemo(() => {
    const leaf =
      (typeof fieldName === 'string' && fieldName) ||
      (typeof targetPath === 'string' ? targetPath.split('.').filter(Boolean).slice(-1)[0] : '');

    return isDateLikeCollectionField(sourceCollectionField, leaf, sourceInterface);
  }, [fieldName, sourceCollectionField, sourceInterface, targetPath]);

  const dateVariableComponentProps = React.useMemo(() => {
    return isDateLikeField
      ? resolveDateVariableComponentProps(sourceCollectionField, sourceInterface)
      : DEFAULT_DATE_VARIABLE_COMPONENT_PROPS;
  }, [isDateLikeField, sourceCollectionField, sourceInterface]);

  const coerceEmptyValueForRenderer = React.useCallback(
    (v: any) => {
      let out = v;
      // operator 驱动的值形态（筛选默认值场景）：例如 $in 期望数组、$dateBetween 期望 [start,end]
      if (operator) {
        out = normalizeFilterValueByOperator(operator, out);
      }
      // VariableInput 会把 undefined/null 统一传成空字符串，这会导致 array 值组件（如 DynamicCascadeList）崩溃。
      if (isArrayValueField) {
        if (out == null || out === '') return [];
        // 兼容历史配置：部分 array 值字段曾以单值保存（例如 multipleSelect 被渲染为单选），这里统一包装为数组以避免组件报错。
        if (!Array.isArray(out)) return [out];
      }
      return out;
    },
    [isArrayValueField, operator],
  );

  // 生成临时根模型 + 子字段模型
  const [tempRoot, setTempRoot] = React.useState<any>(null);
  React.useEffect(() => {
    if (!fieldPath || !fieldName) return;
    const itemModelAny = itemModel as any;
    const engine = resolved?.itemModel?.context?.engine || (flowCtx as any).model?.context?.engine;
    if (!engine) return;
    const dataSourceManager = itemModelAny?.context?.dataSourceManager || flowCtx.model?.context?.dataSourceManager;
    const effectiveCollection =
      collection || getCollectionFromModel(itemModelAny) || getCollectionFromModel(flowCtx.model);
    const { customFieldName, customFieldProps, currentAllowMultiple, originFieldModel, originProps } = fieldSource;
    const originCollectionField = (originFieldModel as any)?.context?.collectionField as CollectionField | undefined;
    const effectiveCollectionField = (cf as CollectionField | null) || originCollectionField || undefined;
    const effectiveDataSource =
      dataSource ||
      (effectiveCollection?.dataSourceKey
        ? dataSourceManager?.getDataSource?.(effectiveCollection.dataSourceKey)
        : null);

    const fields = typeof effectiveCollection?.getFields === 'function' ? effectiveCollection.getFields() || [] : [];
    const f =
      fields.find((x: any) => x?.name === fieldName) ||
      (typeof effectiveCollection?.getField === 'function'
        ? (effectiveCollection.getField(fieldName) as any)
        : undefined) ||
      effectiveCollectionField;

    const binding = f
      ? EditableItemModel.getDefaultBindingByField(resolved?.itemModel?.context || flowCtx.model?.context, f)
      : null;
    const defaultBindingUse: string | undefined = binding?.modelName;
    const fieldSettingsInit = resolveAssignValueFieldSettingsInit({
      collection: effectiveCollection,
      customFieldName,
      fieldPath,
      fieldName,
    });
    const { use: effectiveFieldModelUse, stepParams: tempFieldStepParams } = resolveAssignValueFieldModelConfig({
      itemModel,
      defaultBindingUse,
      collectionField: effectiveCollectionField,
      fieldSource,
      preferFormItemFieldModel,
      fieldSettingsInit,
    });
    if (!effectiveFieldModelUse) return;

    const tempFieldProps = resolveAssignValueFieldProps({
      placeholder,
      originProps,
      customFieldProps,
      collectionField: effectiveCollectionField,
    });

    const sourceContext = resolved?.itemModel?.context || flowCtx.model?.context;
    const created = engine?.createModel?.(
      {
        use: 'VariableFieldFormModel',
        subModels: {
          fields: [
            {
              use: effectiveFieldModelUse,
              stepParams: tempFieldStepParams,
              props: tempFieldProps,
            },
          ],
        },
      },
      sourceContext ? { delegate: sourceContext } : undefined,
    );
    if (!created) return;

    // 注入上下文（集合/数据源/字段/区块/资源）
    if (effectiveCollection) created.context?.defineProperty?.('collection', { value: effectiveCollection });
    if (effectiveDataSource) created.context?.defineProperty?.('dataSource', { value: effectiveDataSource });
    if (effectiveCollectionField)
      created.context?.defineProperty?.('collectionField', { value: effectiveCollectionField });
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
    const allowMultiple =
      effectiveCollectionField?.isAssociationField?.() && isToManyAssociationField(effectiveCollectionField)
        ? currentAllowMultiple ?? true
        : undefined;
    const multiple =
      allowMultiple ??
      (effectiveCollectionField?.isAssociationField?.()
        ? isToManyAssociationField(effectiveCollectionField)
        : undefined);
    const nextStyle = withFullWidthStyle(pickStyle((fm as any)?.props?.style));
    const overrideLabel = associationFieldNamesOverride?.label;
    if (overrideLabel && typeof fm?.setStepParams === 'function') {
      fm.setStepParams('selectSettings', 'fieldNames', { label: overrideLabel });
    }
    fm?.setProps?.({
      disabled,
      readPretty: false,
      pattern: 'editable',
      updateAssociation: false,
      style: nextStyle,
      ...(multiple !== undefined ? { multiple } : {}),
      ...(allowMultiple !== undefined ? { allowMultiple } : {}),
    });
    fm?.dispatchEvent?.('beforeRender', undefined, { sequential: true, useCache: true });
    // 为本地枚举型字段补全可选项（仅在未显式传入 options 时处理）
    ensureOptionsFromUiSchemaEnumIfAbsent(fm, effectiveCollectionField);
    const nextMode = resolveAssignValueFieldMode({
      fieldModelUse: effectiveFieldModelUse,
      collectionField: effectiveCollectionField,
    });
    const shouldForceMode =
      effectiveCollectionField?.isAssociationField?.() &&
      isAssignValueAssociationSelectModelUse(effectiveFieldModelUse);
    if ((shouldForceMode || (fm as any)?.props?.mode === undefined) && nextMode) {
      fm?.setProps?.({ mode: nextMode });
    }
    if (effectiveCollectionField?.targetCollection) {
      const targetCol = effectiveCollectionField.targetCollection;
      const prevFieldNames = (fm?.props?.fieldNames as { label?: unknown; value?: unknown } | undefined) || {};
      const valueKey =
        associationFieldNamesOverride?.value ??
        prevFieldNames?.value ??
        effectiveCollectionField?.targetKey ??
        targetCol?.filterTargetKey ??
        'id';
      const labelKey =
        associationFieldNamesOverride?.label ??
        prevFieldNames?.label ??
        effectiveCollectionField?.targetCollectionTitleFieldName;
      fm?.setProps?.({
        fieldNames: {
          ...prevFieldNames,
          ...(labelKey ? { label: labelKey } : {}),
          value: valueKey,
        },
      });
    }

    setTempRoot(created);
    return () => {
      created.subModels.fields.forEach?.((m) => m.remove());
      created.remove();
    };
  }, [
    collection,
    dataSource,
    blockModel,
    fieldPath,
    fieldName,
    flowCtx,
    placeholder,
    resolved,
    cf,
    itemModel,
    fieldSource,
    preferFormItemFieldModel,
    associationFieldNamesOverride?.label,
    associationFieldNamesOverride?.value,
    disabled,
  ]);

  // 当传入 operator / operatorMetaList 时，按 operator schema 适配临时字段的输入组件与 props。
  // 典型场景：筛选表单的“默认值”配置需要与筛选字段当前 operator 的输入体验一致（如 multi-keywords、日期动态筛选等）。
  React.useEffect(() => {
    const fieldModel = tempRoot?.subModels?.fields?.[0];
    if (!fieldModel || !operator || !Array.isArray(operatorMetaList) || operatorMetaList.length === 0) {
      return;
    }

    // 1) 先应用 schema 的 x-component-props（例如 DateFilterDynamicComponent 的 isRange）
    const meta = operatorMetaList.find((op) => op?.value === operator);
    const xComponentProps = meta?.schema?.['x-component-props'];
    if (xComponentProps && typeof fieldModel?.setProps === 'function') {
      const style = withFullWidthStyle(
        pickStyle((xComponentProps as any)?.style) || pickStyle((fieldModel as any)?.props?.style),
      );
      fieldModel.setProps({ ...xComponentProps, style });
    }

    // 2) 文本类多关键词：若 operator schema 声明了输入组件，则覆写 InputFieldModel.render
    const app = (resolved as any)?.itemModel?.context?.app || (flowCtx as any)?.model?.context?.app;
    const resolvedComponent = resolveOperatorComponent(app, operator, operatorMetaList);
    if (resolvedComponent && fieldModel instanceof InputFieldModel) {
      const originalRender = fieldModel['__originalRender'] || fieldModel.render;
      fieldModel['__originalRender'] = originalRender;
      const { Comp, props: xProps } = resolvedComponent;
      fieldModel.render = () => (
        <Comp
          {...fieldModel.props}
          {...xProps}
          style={{
            width: '100%',
            ...pickStyle((fieldModel.props as Record<string, unknown>)?.style),
            ...pickStyle(xProps?.style),
          }}
        />
      );
      rewrapReactiveRender(fieldModel);
    } else if (typeof fieldModel['__originalRender'] === 'function') {
      fieldModel.render = fieldModel['__originalRender'];
      rewrapReactiveRender(fieldModel);
    }
  }, [operator, operatorMetaList, tempRoot, flowCtx, resolved]);

  // 常量/空值的两个占位渲染器
  const ConstantValueEditor = React.useMemo(() => {
    const C: React.FC<any> = (inputProps) => {
      const wrapperStyle = pickStyle(inputProps?.style);
      React.useEffect(() => {
        const coercedValue = coerceEmptyValueForRenderer(inputProps?.value);
        const handleChange = (ev: any) => {
          if (inputProps?.disabled) {
            return;
          }
          const nextRaw = normalizeEventValue(ev);
          const normalizedForStore = operator ? normalizeFilterValueByOperator(operator, nextRaw) : nextRaw;
          const nextValue = coerceEmptyValueForRenderer(normalizedForStore);
          // 关键：同步更新临时字段的受控 value，避免每次输入都“先渲染旧值、effect 再写新值”导致光标跳到末尾
          tempRoot?.setProps?.({ value: nextValue });
          const fmInner = tempRoot?.subModels?.fields?.[0];
          fmInner?.setProps?.({ value: nextValue });
          inputProps?.onChange?.(normalizedForStore);
        };
        const fm = tempRoot?.subModels?.fields?.[0];
        fm?.setProps?.({
          value: coercedValue,
          onChange: handleChange,
          onCompositionStart: inputProps?.onCompositionStart,
          onCompositionUpdate: inputProps?.onCompositionUpdate,
          onCompositionEnd: inputProps?.onCompositionEnd,
        });
        // 将 VariableInput 的受控属性透传到临时根模型上，兼容部分字段组件依赖 blockModel.props 的场景
        tempRoot?.setProps?.({
          ...inputProps,
          value: coercedValue,
          onChange: handleChange,
        });
      }, [inputProps]);

      if (!tempRoot) {
        return (
          <Input
            value={inputProps?.value}
            onChange={(e) => inputProps?.onChange?.(normalizeEventValue(e))}
            placeholder={placeholder}
            disabled={inputProps?.disabled}
            style={withFullWidthStyle(wrapperStyle)}
          />
        );
      }

      return (
        <div style={{ ...withFullWidthStyle(wrapperStyle), flex: 1 }}>
          <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
        </div>
      );
    };
    return C;
  }, [placeholder, tempRoot, coerceEmptyValueForRenderer, normalizeEventValue, operator]);

  const NullComponent = React.useMemo(() => {
    const N: React.FC = () => (
      <Input placeholder={`<${flowCtx.t?.('Null') ?? 'Null'}>`} readOnly style={{ width: '100%' }} />
    );
    return N;
  }, [flowCtx]);

  const RunJSComponent = React.useMemo(() => {
    const C: React.FC<any> = (inputProps) => (
      <RunJSValueEditor
        t={flowCtx.t}
        value={inputProps?.value}
        onChange={inputProps?.onChange}
        disabled={inputProps?.disabled}
      />
    );
    return C;
  }, [flowCtx]);

  const baseMetaTree = React.useMemo<() => Promise<MetaTreeNode[]>>(() => {
    return async () => {
      const base = (await flowCtx.getPropertyMetaTree?.()) || [];
      const extra = extraMetaTreeRef.current;
      const extraTree = Array.isArray(extra) ? extra : [];
      const mergedBase = mergeItemMetaTreeForAssignValue(base as MetaTreeNode[], extraTree as MetaTreeNode[]);
      return limitAssociationMetaTree(mergedBase, { maxAssociationDepth: maxAssociationFieldDepth });
    };
  }, [flowCtx, maxAssociationFieldDepth]);

  if (!fieldPath) {
    // 不可用占位
    return <Input disabled placeholder={flowCtx.t?.('Please select a field') ?? 'Please select a field'} />;
  }

  return (
    <FieldValueVariableInput
      value={value}
      onChange={onChange}
      baseMetaTree={baseMetaTree}
      constantComponent={ConstantValueEditor}
      nullComponent={NullComponent}
      runJSComponent={RunJSComponent}
      isDateLikeField={isDateLikeField}
      dateComponentProps={dateVariableComponentProps}
      style={{ width: '100%' }}
      clearValue={''}
      allowRunJS={allowRunJS}
      disabled={disabled}
      converters={variableConverters}
    />
  );
};
