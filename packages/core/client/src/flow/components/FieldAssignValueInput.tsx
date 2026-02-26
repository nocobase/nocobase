/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { css } from '@emotion/css';
import { Divider, Input, InputNumber, Select, Space, theme } from 'antd';
import { dayjs } from '@nocobase/utils/client';
import {
  FlowModelRenderer,
  VariableInput,
  tExpr,
  isVariableExpression,
  parseValueToPath,
  isRunJSValue,
  isCtxDateExpression,
  parseCtxDateExpression,
  serializeCtxDateValue,
  type CollectionField,
  type MetaTreeNode,
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
import { resolveOperatorComponent } from '../internal/utils/operatorSchemaHelper';
import { InputFieldModel } from '../models/fields/InputFieldModel';
import { normalizeFilterValueByOperator } from '../models/blocks/filter-form/valueNormalization';
import { FieldAssignExactDatePicker, type ExactDatePickerMode } from './FieldAssignExactDatePicker';

const DATE_FIELD_INTERFACES = new Set(['date', 'datetime', 'datetimeNoTz', 'createdAt', 'updatedAt', 'unixTimestamp']);

const TZ_AWARE_DATE_INTERFACES = new Set(['datetime', 'createdAt', 'updatedAt', 'unixTimestamp']);

const DATE_ONLY_OUTPUT_FORMAT = 'YYYY-MM-DD';
const DATETIME_NO_TZ_OUTPUT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export type DateVariableExactNormalizeMode = 'none' | 'date' | 'datetimeNoTz' | 'iso';

const DATE_DYNAMIC_OPTION_KEYS = [
  'exact',
  'past',
  'next',
  'today',
  'yesterday',
  'tomorrow',
  'thisWeek',
  'lastWeek',
  'nextWeek',
  'thisMonth',
  'lastMonth',
  'nextMonth',
  'thisQuarter',
  'lastQuarter',
  'nextQuarter',
  'thisYear',
  'lastYear',
  'nextYear',
] as const;

type DateDynamicOptionValue = (typeof DATE_DYNAMIC_OPTION_KEYS)[number] | 'now';

const DATE_DYNAMIC_OPTION_LABELS: Record<(typeof DATE_DYNAMIC_OPTION_KEYS)[number], string> = {
  exact: 'Exact day',
  past: 'Past',
  next: 'Next',
  today: 'Today',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  nextWeek: 'Next Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  nextMonth: 'Next Month',
  thisQuarter: 'This Quarter',
  lastQuarter: 'Last Quarter',
  nextQuarter: 'Next Quarter',
  thisYear: 'This Year',
  lastYear: 'Last Year',
  nextYear: 'Next Year',
};

function buildDateDynamicOptions(t?: (key: string) => string, includeNow = false) {
  const options: Array<{ value: DateDynamicOptionValue; label: string }> = DATE_DYNAMIC_OPTION_KEYS.map((key) => ({
    value: key,
    label: t?.(DATE_DYNAMIC_OPTION_LABELS[key]) ?? DATE_DYNAMIC_OPTION_LABELS[key],
  }));

  if (includeNow) {
    options.splice(3, 0, { value: 'now', label: t?.('Now') ?? 'Now' });
  }

  return options;
}

function parseDateByFormat(value: string, format: string): dayjs.Dayjs | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  if (hasTimezone) {
    const parsed = dayjs(raw);
    if (parsed.isValid()) {
      return parsed;
    }
  }

  if (format) {
    const strict = dayjs(raw, format, true);
    if (strict.isValid()) {
      return strict;
    }
  }

  const fallback = dayjs(raw);
  if (fallback.isValid()) {
    return fallback;
  }

  if (format) {
    const loose = dayjs(raw, format);
    if (loose.isValid()) {
      return loose;
    }
  }

  return null;
}

function parseDateFromRawValue(value: unknown, format: string): dayjs.Dayjs | null {
  if (dayjs.isDayjs(value)) {
    return value;
  }

  if (value instanceof Date) {
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate : null;
  }

  if (typeof value === 'string') {
    return parseDateByFormat(value, format);
  }

  return null;
}

function normalizeExactDateValue(
  value: unknown,
  options: {
    format: string;
    showTime: boolean;
    exactNormalizeMode: DateVariableExactNormalizeMode;
  },
): unknown {
  const parsed = parseDateFromRawValue(value, options.format);
  if (!parsed?.isValid()) {
    return value;
  }

  switch (options.exactNormalizeMode) {
    case 'date':
      return parsed.format(DATE_ONLY_OUTPUT_FORMAT);
    case 'datetimeNoTz':
      return parsed.format(options.showTime ? DATETIME_NO_TZ_OUTPUT_FORMAT : DATE_ONLY_OUTPUT_FORMAT);
    case 'iso':
      return parsed.toISOString();
    default:
      return value;
  }
}

function toExactPickerSingleValue(rawValue: unknown, format: string): dayjs.Dayjs | null {
  const parsed = parseDateFromRawValue(rawValue, format);
  return parsed?.isValid() ? parsed : null;
}

function toExactPickerRangeValue(rawValue: unknown, format: string): [dayjs.Dayjs, dayjs.Dayjs] | null {
  if (!Array.isArray(rawValue)) return null;
  const left = toExactPickerSingleValue(rawValue[0], format);
  const right = toExactPickerSingleValue(rawValue[1], format);
  if (!left || !right) return null;
  return [left, right];
}

export function toExactPickerDisplayValue(
  rawValue: unknown,
  options: {
    format: string;
    isRange: boolean;
  },
): dayjs.Dayjs | [dayjs.Dayjs, dayjs.Dayjs] | null {
  if (options.isRange) {
    return toExactPickerRangeValue(rawValue, options.format);
  }
  return toExactPickerSingleValue(rawValue, options.format);
}

function getDateVariableExactNormalizeMode(fieldInterface: string): DateVariableExactNormalizeMode {
  if (fieldInterface === 'date') {
    return 'date';
  }

  if (fieldInterface === 'datetimeNoTz') {
    return 'datetimeNoTz';
  }

  if (TZ_AWARE_DATE_INTERFACES.has(fieldInterface)) {
    return 'iso';
  }

  return 'none';
}

export function normalizeDateVariableExactValue(
  rawValue: any,
  options: {
    exactNormalizeMode: DateVariableExactNormalizeMode;
    format: string;
    showTime: boolean;
  },
): any {
  if (options.exactNormalizeMode === 'none') {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    return normalizeExactDateValue(rawValue, options);
  }

  if (dayjs.isDayjs(rawValue) || rawValue instanceof Date) {
    return normalizeExactDateValue(rawValue, options);
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => {
      if (typeof item === 'string' || dayjs.isDayjs(item) || item instanceof Date) {
        return normalizeExactDateValue(item, options);
      }
      return item;
    });
  }

  return rawValue;
}

type DateVariableComponentProps = {
  picker: ExactDatePickerMode;
  showTime: boolean;
  timeFormat: string;
  format: string;
  exactNormalizeMode: DateVariableExactNormalizeMode;
};

function normalizeExactDatePickerMode(value: unknown): ExactDatePickerMode {
  if (value === 'year' || value === 'quarter' || value === 'month' || value === 'date') {
    return value;
  }

  return 'date';
}

const DEFAULT_DATE_VARIABLE_COMPONENT_PROPS: DateVariableComponentProps = {
  picker: 'date',
  showTime: false,
  timeFormat: 'HH:mm:ss',
  format: 'YYYY-MM-DD',
  exactNormalizeMode: 'none',
};

function getFieldInterface(field: any): string {
  return typeof field?.interface === 'string' ? field.interface : '';
}

function getFieldComponentProps(field: any): Record<string, any> {
  return (
    (typeof field?.getComponentProps === 'function' ? field.getComponentProps() : null) ||
    field?.uiSchema?.['x-component-props'] ||
    {}
  );
}

export function normalizeDateVariableOutput(rawValue: any, options: DateVariableComponentProps): any {
  if (rawValue === null || isRunJSValue(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string' && isVariableExpression(rawValue) && !isCtxDateExpression(rawValue)) {
    return rawValue;
  }

  if (rawValue === '' || typeof rawValue === 'undefined') {
    return '';
  }

  const normalized = normalizeDateVariableExactValue(rawValue, {
    exactNormalizeMode: options.exactNormalizeMode,
    format: options.format || 'YYYY-MM-DD HH:mm:ss',
    showTime: options.showTime,
  });

  const serialized = serializeCtxDateValue(normalized);
  return serialized || normalized;
}

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
   * 在日期字段场景下，用日期变量编辑器替换 Constant 位。
   * 默认 false，保持历史行为。
   */
  enableDateVariableAsConstant?: boolean;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function pickStyle(value: unknown): React.CSSProperties | undefined {
  return isPlainObject(value) ? (value as React.CSSProperties) : undefined;
}

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
  enableDateVariableAsConstant = false,
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
  }, [flowCtx.model, itemModel, resolveNestedAssociationField, targetPath]);

  const { collection, dataSource, blockModel, fieldPath, fieldName, collectionField: cf } = resolved;
  const itemCollectionField = (resolved?.itemModel as any)?.context?.collectionField;

  const sourceInterface = React.useMemo(() => {
    return getFieldInterface(cf) || getFieldInterface(itemCollectionField);
  }, [cf, itemCollectionField]);

  const sourceCollectionField = (cf as any) || itemCollectionField;

  const isArrayValueField = React.useMemo(() => {
    if (isToManyAssociationField(cf)) return true;

    // 部分字段组件（如 Cascader / CascadeSelectList）期望 array 值；若 uiSchema 明确声明为 array，则视为 array 值字段
    const fieldInterface = getFieldInterface(cf);
    if (fieldInterface === 'multipleSelect' || fieldInterface === 'checkboxGroup') return true;

    const schemaType = cf?.uiSchema?.type;
    if (schemaType === 'array') return true;

    return false;
  }, [cf]);

  const isDateLikeField = React.useMemo(() => {
    if (sourceInterface && DATE_FIELD_INTERFACES.has(sourceInterface)) {
      return true;
    }

    const leaf =
      (typeof fieldName === 'string' && fieldName) ||
      (typeof targetPath === 'string' ? targetPath.split('.').filter(Boolean).slice(-1)[0] : '');

    return leaf === 'createdAt' || leaf === 'updatedAt';
  }, [fieldName, sourceInterface, targetPath]);

  const useDateVariableConstant = enableDateVariableAsConstant && isDateLikeField;

  const dateVariableComponentProps = React.useMemo(() => {
    if (!useDateVariableConstant) {
      return DEFAULT_DATE_VARIABLE_COMPONENT_PROPS;
    }

    const componentProps = getFieldComponentProps(sourceCollectionField);

    const picker = normalizeExactDatePickerMode(componentProps?.picker);
    const inferredShowTime = ['datetime', 'datetimeNoTz', 'createdAt', 'updatedAt', 'unixTimestamp'].includes(
      sourceInterface,
    );
    const showTime = typeof componentProps?.showTime === 'boolean' ? componentProps.showTime : inferredShowTime;

    const dateFormat =
      typeof componentProps?.dateFormat === 'string' && componentProps.dateFormat
        ? componentProps.dateFormat
        : typeof componentProps?.format === 'string' && componentProps.format
          ? componentProps.format.split(' ')[0]
          : 'YYYY-MM-DD';
    const timeFormat =
      typeof componentProps?.timeFormat === 'string' && componentProps.timeFormat
        ? componentProps.timeFormat
        : 'HH:mm:ss';

    const format =
      typeof componentProps?.format === 'string' && componentProps.format
        ? componentProps.format
        : showTime
          ? `${dateFormat} ${timeFormat}`
          : dateFormat;

    return {
      picker,
      showTime,
      timeFormat,
      format,
      exactNormalizeMode: getDateVariableExactNormalizeMode(sourceInterface),
    };
  }, [sourceCollectionField, sourceInterface, useDateVariableConstant]);

  const dateVariableDisplayProps = React.useMemo(() => {
    const { exactNormalizeMode, ...rest } = dateVariableComponentProps;
    return rest;
  }, [dateVariableComponentProps]);

  const dateVariableDisplayPropsRef = React.useRef(dateVariableDisplayProps);
  dateVariableDisplayPropsRef.current = dateVariableDisplayProps;

  const dateVariableTranslateRef = React.useRef(flowCtx.t);
  dateVariableTranslateRef.current = flowCtx.t;

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
    if (!collection || !fieldPath || !fieldName) return;
    const engine = resolved?.itemModel?.context?.engine || (flowCtx as any).model?.context?.engine;

    const fields = typeof collection.getFields === 'function' ? collection.getFields() || [] : [];
    const f =
      fields.find((x: any) => x?.name === fieldName) ||
      (typeof collection.getField === 'function' ? (collection.getField(fieldName) as any) : undefined) ||
      cf;

    const binding = f
      ? EditableItemModel.getDefaultBindingByField(resolved?.itemModel?.context || flowCtx.model?.context, f)
      : null;
    const fieldModelUse: string | undefined = binding?.modelName;

    const subField = itemModel?.subModels?.field;
    const subFieldUse = subField && !Array.isArray(subField) ? subField.use : undefined;
    const effectiveFieldModelUse: string | undefined = preferFormItemFieldModel
      ? subFieldUse || fieldModelUse
      : fieldModelUse || subFieldUse;
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
    const nextStyle = withFullWidthStyle(pickStyle((fm as any)?.props?.style));
    const overrideLabel =
      typeof associationFieldNamesOverride?.label === 'string' && associationFieldNamesOverride.label
        ? associationFieldNamesOverride.label
        : undefined;
    if (overrideLabel && typeof fm?.setStepParams === 'function') {
      fm.setStepParams('selectSettings', 'fieldNames', { label: overrideLabel });
    }
    fm?.setProps?.({
      disabled: false,
      readPretty: false,
      pattern: 'editable',
      updateAssociation: false,
      multiple,
      style: nextStyle,
    });
    fm?.dispatchEvent?.('beforeRender', undefined, { sequential: true, useCache: true });
    // 为本地枚举型字段补全可选项（仅在未显式传入 options 时处理）
    ensureOptionsFromUiSchemaEnumIfAbsent(fm, cf);
    // multipleSelect 接口的字段需要显式开启 antd Select 的多选模式
    // 仅当未显式传入 mode 时设置，避免覆盖外部自定义
    const modePropExists = typeof (fm as any)?.props?.mode !== 'undefined';
    const modeFromSchema = (cf?.uiSchema as any)?.['x-component-props']?.mode;
    const nextMode =
      cf?.interface === 'multipleSelect'
        ? typeof modeFromSchema === 'string'
          ? modeFromSchema
          : 'multiple'
        : typeof modeFromSchema === 'string'
          ? modeFromSchema
          : undefined;
    if (!modePropExists && nextMode) {
      fm?.setProps?.({ mode: nextMode });
    }
    if (cf?.targetCollection) {
      const targetCol = cf.targetCollection;
      const prevFieldNames = (fm?.props?.fieldNames as { label?: unknown; value?: unknown } | undefined) || {};
      const valueKey =
        (typeof associationFieldNamesOverride?.value === 'string' && associationFieldNamesOverride.value) ||
        (typeof prevFieldNames?.value === 'string' && prevFieldNames.value) ||
        cf?.targetKey ||
        targetCol?.filterTargetKey ||
        'id';
      const inheritedLabel =
        typeof prevFieldNames?.label === 'string' && prevFieldNames.label ? prevFieldNames.label : undefined;
      const collectionTitleField =
        typeof (targetCol as { titleField?: unknown } | null | undefined)?.titleField === 'string'
          ? (targetCol as { titleField?: string }).titleField
          : undefined;
      const labelKey =
        (typeof associationFieldNamesOverride?.label === 'string' && associationFieldNamesOverride.label) ||
        inheritedLabel ||
        collectionTitleField;
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
    preferFormItemFieldModel,
    associationFieldNamesOverride?.label,
    associationFieldNamesOverride?.value,
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
          style={{ width: '100%', ...(fieldModel.props as any)?.style, ...xProps?.style }}
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
  }, [placeholder, tempRoot, coerceEmptyValueForRenderer, normalizeEventValue]);

  const DateVariableConstantEditor = React.useMemo(() => {
    const C: React.FC<any> = (inputProps) => {
      const wrapperStyle = pickStyle(inputProps?.style);
      const raw = inputProps?.value;
      const parsed = isCtxDateExpression(raw) ? parseCtxDateExpression(raw) : raw;
      const parsedValue = typeof parsed === 'undefined' ? undefined : parsed;
      const { token } = theme.useToken();
      const [open, setOpen] = React.useState(false);
      const t = dateVariableTranslateRef.current;
      const datePickerProps = dateVariableDisplayPropsRef.current;
      const options = React.useMemo(() => buildDateDynamicOptions(t, true), [t]);

      const dynamicType =
        parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
          ? (parsedValue as any)?.type
          : undefined;
      const selectedType = typeof dynamicType === 'string' && dynamicType ? dynamicType : 'exact';
      const isRange = Array.isArray(parsedValue);
      const exactSingleValue = toExactPickerDisplayValue(parsedValue, {
        format: datePickerProps.format,
        isRange: false,
      });
      const exactRangeValue = toExactPickerDisplayValue(parsedValue, {
        format: datePickerProps.format,
        isRange: true,
      });

      const handleSelect = (val: string) => {
        setOpen(false);
        if (val === 'exact') {
          inputProps?.onChange?.('');
          return;
        }
        const next: any = { type: val };
        if (val === 'past' || val === 'next') {
          next.number = 1;
          next.unit = 'day';
        }
        inputProps?.onChange?.(next);
      };

      const handleExactSingleChange = (nextValue: any) => {
        inputProps?.onChange?.(nextValue || '');
      };

      const handleExactRangeChange = (nextValue: any) => {
        inputProps?.onChange?.(nextValue || '');
      };

      const dropdownRender = () => {
        const firstPart = options.slice(0, 3);
        const secondPart = options.slice(3);
        const optionStyle = css`
          padding: 3px 10px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          &:hover {
            background-color: ${token.colorFillSecondary};
          }
        `;
        return (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {firstPart.map((opt) => (
              <div key={opt.value} role="option" onClick={() => handleSelect(opt.value)} className={optionStyle}>
                {opt.label}
              </div>
            ))}
            <Divider style={{ margin: '4px 0' }} />
            {secondPart.map((opt) => (
              <div
                key={opt.value}
                role="option"
                className={optionStyle}
                onClick={() => handleSelect(opt.value)}
                title={opt.label}
              >
                {opt.label}
              </div>
            ))}
          </div>
        );
      };

      return (
        <Space.Compact style={withFullWidthStyle(wrapperStyle)}>
          <Select
            options={options}
            open={open}
            onDropdownVisibleChange={setOpen}
            allowClear={false}
            style={{
              width: '100%',
              minWidth: 100,
              maxWidth: ['past', 'next', 'exact', undefined].includes(dynamicType) ? 100 : null,
            }}
            value={selectedType}
            onChange={handleSelect}
            dropdownRender={dropdownRender}
          />
          {['past', 'next'].includes(selectedType) && [
            <InputNumber
              key="number"
              style={{ flex: 1 }}
              value={(parsedValue as any)?.number}
              onChange={(nextNumber) => {
                inputProps?.onChange?.({
                  ...(parsedValue as any),
                  type: selectedType,
                  number: nextNumber,
                  unit: (parsedValue as any)?.unit || 'day',
                });
              }}
            />,
            <Select
              key="unit"
              value={(parsedValue as any)?.unit}
              style={{ minWidth: 130, maxWidth: 140 }}
              onChange={(nextUnit) => {
                inputProps?.onChange?.({
                  ...(parsedValue as any),
                  type: selectedType,
                  unit: nextUnit,
                  number: (parsedValue as any)?.number || 1,
                });
              }}
              options={[
                { value: 'day', label: t?.('Day') ?? 'Day' },
                { value: 'week', label: t?.('Calendar week') ?? 'Calendar week' },
                { value: 'month', label: t?.('Calendar Month') ?? 'Calendar Month' },
                { value: 'year', label: t?.('Calendar Year') ?? 'Calendar Year' },
              ]}
              popupMatchSelectWidth
            />,
          ]}
          {(selectedType === 'exact' || !selectedType) && (
            <FieldAssignExactDatePicker
              {...datePickerProps}
              isRange={isRange}
              value={isRange ? exactRangeValue : exactSingleValue}
              onChange={isRange ? handleExactRangeChange : handleExactSingleChange}
              style={{ flex: 1 }}
            />
          )}
        </Space.Compact>
      );
    };

    return C;
  }, []);

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

  const ConstantEditor = useDateVariableConstant ? DateVariableConstantEditor : ConstantValueEditor;

  const metaTree = React.useMemo<() => Promise<any[]>>(() => {
    return async () => {
      const base = (await flowCtx.getPropertyMetaTree?.()) || [];
      const extra = extraMetaTreeRef.current;
      const extraTree = Array.isArray(extra) ? extra : [];
      const mergedBase = mergeItemMetaTreeForAssignValue(base as MetaTreeNode[], extraTree as MetaTreeNode[]);
      return [
        {
          title: tExpr('Constant'),
          name: 'constant',
          type: 'string',
          paths: ['constant'],
          render: ConstantEditor,
        },
        { title: tExpr('Null'), name: 'null', type: 'object', paths: ['null'], render: NullComponent },
        { title: tExpr('RunJS'), name: 'runjs', type: 'object', paths: ['runjs'], render: RunJSComponent },
        ...mergedBase,
      ];
    };
  }, [flowCtx, ConstantEditor, NullComponent, RunJSComponent]);

  const displayValue = React.useMemo(() => {
    if (!useDateVariableConstant) {
      return value;
    }

    if (isCtxDateExpression(value)) {
      const parsed = parseCtxDateExpression(value);
      return typeof parsed === 'undefined' ? '' : parsed;
    }

    return value;
  }, [useDateVariableConstant, value]);

  const handleVariableInputChange = React.useCallback(
    (nextValue: any) => {
      if (!useDateVariableConstant) {
        onChange(nextValue);
        return;
      }

      onChange(normalizeDateVariableOutput(nextValue, dateVariableComponentProps));
    },
    [dateVariableComponentProps, onChange, useDateVariableConstant],
  );

  if (!fieldPath) {
    // 不可用占位
    return <Input disabled placeholder={flowCtx.t?.('Please select a field') ?? 'Please select a field'} />;
  }

  return (
    <VariableInput
      value={displayValue}
      onChange={handleVariableInputChange}
      metaTree={metaTree}
      style={{ width: '100%' }}
      clearValue={''}
      converters={{
        renderInputComponent: (meta) => {
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return ConstantEditor;
          if (firstPath === 'null') return NullComponent;
          if (firstPath === 'runjs') return RunJSComponent;
          return null;
        },
        resolveValueFromPath: (item) => {
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') {
            return useDateVariableConstant ? { type: 'today' } : '';
          }
          if (firstPath === 'null') return null;
          if (firstPath === 'runjs') return { code: '', version: 'v1' };
          return undefined;
        },
        resolvePathFromValue: (currentValue) => {
          if (currentValue === null) return ['null'];
          if (isRunJSValue(currentValue)) return ['runjs'];
          if (useDateVariableConstant && isCtxDateExpression(currentValue)) {
            return ['constant'];
          }
          return isVariableExpression(currentValue) ? parseValueToPath(currentValue) : ['constant'];
        },
      }}
    />
  );
};
