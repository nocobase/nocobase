/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionField } from '@nocobase/flow-engine';
import { getFormItemPreferredFieldPath } from '../internal/utils/modelUtils';

export type FieldAssignCascaderOption = {
  label: string;
  value: string;
  /** antd Cascader lazy-load marker */
  isLeaf?: boolean;
  /** antd Cascader loading marker */
  loading?: boolean;
  children?: FieldAssignCascaderOption[];
};

function getItemFieldPath(itemModel: any): string | undefined {
  return getFormItemPreferredFieldPath(itemModel);
}

function getItemLabel(itemModel: any, t: (key: string) => string): string {
  const normalize = (val: any): string | null => {
    if (val == null) return null;
    if (Array.isArray(val)) {
      const arr = val.map((v) => String(v ?? '')).filter(Boolean);
      if (!arr.length) return null;
      // 对于 namePath/paths 等数组，更符合直觉的是展示最后一段
      return arr[arr.length - 1];
    }
    return String(val);
  };

  // 1) 优先使用 UI 上配置的 label（若存在）
  const explicitLabel = normalize(itemModel?.props?.label);
  if (explicitLabel) return t(explicitLabel);

  // 2) 其次使用 collectionField.title（更接近“原始字段标签”）
  const cf = itemModel?.subModels?.field?.context?.collectionField;
  const cfTitle = normalize(cf?.title);
  if (cfTitle) return t(cfTitle);

  // 3) 回落到 props.name / fieldPath，并对路径字符串做“取最后一段”的可读性优化
  const nameOrPath = normalize(itemModel?.props?.name) || normalize(itemModel?.fieldPath);
  if (nameOrPath) {
    if (nameOrPath.includes('.')) {
      return nameOrPath.split('.').filter(Boolean).slice(-1)[0] || nameOrPath;
    }
    return t(nameOrPath);
  }

  return '';
}

function splitFieldPath(path: string): string[] {
  return String(path || '')
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);
}

type CollectionLike = {
  getField?: (name: string) => unknown;
  getFields?: () => unknown[];
};

type CollectionFieldLike = {
  name?: unknown;
  title?: unknown;
  interface?: unknown;
  target?: unknown;
  isAssociationField?: () => boolean;
  targetCollection?: CollectionLike | null;
};

function getCollectionFromFormBlockModel(model: any): CollectionLike | null {
  if (!model || typeof model !== 'object') return null;
  const collection = (model as any)?.collection || (model as any)?.context?.collection;
  return collection && typeof collection === 'object' ? (collection as CollectionLike) : null;
}

export function buildFieldAssignCascaderOptionsFromCollection(
  collection: CollectionLike | null,
  t: (key: string) => string,
  options: {
    associationDepth?: number;
    maxAssociationFieldDepth?: number;
  } = {},
): FieldAssignCascaderOption[] {
  const { associationDepth = 0, maxAssociationFieldDepth = 2 } = options;
  const fields = typeof collection?.getFields === 'function' ? collection.getFields() || [] : [];
  const out: FieldAssignCascaderOption[] = [];
  for (const rawField of fields) {
    if (!rawField) continue;
    const f = rawField as CollectionFieldLike;
    const fieldInterface = typeof f.interface === 'string' ? f.interface : undefined;
    if (!fieldInterface) continue;
    if (fieldInterface === 'formula') continue;

    const name = String(f.name || '');
    if (!name) continue;
    const title = t(typeof f.title === 'string' ? f.title : name);

    const isAssoc = !!(f.isAssociationField?.() || f.target || f.targetCollection);
    const hasTarget = !!f.targetCollection;
    if (isAssoc && associationDepth >= maxAssociationFieldDepth) {
      continue;
    }

    out.push({
      label: title,
      value: name,
      isLeaf: !(isAssoc && hasTarget),
    });
  }
  return out;
}

function mergeRootOptions(
  configured: FieldAssignCascaderOption[],
  allFields: FieldAssignCascaderOption[],
): FieldAssignCascaderOption[] {
  return mergeCascaderOptions(configured, allFields);
}

function mergeCascaderOptions(
  configured: FieldAssignCascaderOption[],
  allFields: FieldAssignCascaderOption[],
): FieldAssignCascaderOption[] {
  const configuredList = Array.isArray(configured) ? configured : [];
  const allList = Array.isArray(allFields) ? allFields : [];
  const result = configuredList.map((item) => cloneCascaderOption(item));

  for (const item of allList) {
    mergeCascaderOptionInto(result, item);
  }

  return result;
}

function cloneCascaderOption(option: FieldAssignCascaderOption): FieldAssignCascaderOption {
  return {
    ...option,
    children: option.children?.map((child) => cloneCascaderOption(child)),
  };
}

function mergeCascaderOptionInto(options: FieldAssignCascaderOption[], source: FieldAssignCascaderOption) {
  const value = source?.value ? String(source.value) : '';
  if (!value) return;

  const existing = options.find((item) => String(item?.value || '') === value);
  if (!existing) {
    options.push(cloneCascaderOption(source));
    return;
  }

  if (!existing.label && source.label) {
    existing.label = source.label;
  }
  if (source.isLeaf === false || existing.children?.length || source.children?.length) {
    existing.isLeaf = false;
  }
  if (source.loading) {
    existing.loading = source.loading;
  }
  if (source.children?.length) {
    existing.children = mergeCascaderOptions(existing.children || [], source.children);
  }
}

function getCollectionField(collection: CollectionLike | null, name: string): CollectionFieldLike | undefined {
  const field = typeof collection?.getField === 'function' ? collection.getField(name) : undefined;
  return field && typeof field === 'object' ? (field as CollectionFieldLike) : undefined;
}

function isAssociationFieldLike(field?: CollectionFieldLike | null) {
  return !!(field?.isAssociationField?.() || field?.target || field?.targetCollection);
}

function getFieldLabelFromCollection(collection: CollectionLike | null, name: string, t: (key: string) => string) {
  const field = getCollectionField(collection, name);
  const title = typeof field?.title === 'string' && field.title ? field.title : name;
  return t(title);
}

function getAssociationDepthFromFieldPath(
  rootCollection: CollectionLike | null,
  segments: string[],
): number | undefined {
  if (!rootCollection) return undefined;

  let collection: CollectionLike | null = rootCollection;
  let associationDepth = 0;
  for (let index = 0; index < segments.length; index++) {
    const field = getCollectionField(collection, segments[index]);
    if (!field) return undefined;

    if (isAssociationFieldLike(field)) {
      associationDepth += 1;
      collection = field.targetCollection || null;
      continue;
    }

    if (index < segments.length - 1) return undefined;
  }

  return associationDepth;
}

function shouldIncludeConfiguredFieldPath(options: {
  segments: string[];
  rootCollection: CollectionLike | null;
  leafField?: CollectionFieldLike | null;
  maxAssociationFieldDepth: number;
}) {
  const resolvedAssociationDepth = getAssociationDepthFromFieldPath(options.rootCollection, options.segments);
  if (typeof resolvedAssociationDepth === 'number') {
    return resolvedAssociationDepth <= options.maxAssociationFieldDepth;
  }

  const leafIsAssociation = isAssociationFieldLike(options.leafField);
  const maxPathLength = leafIsAssociation ? options.maxAssociationFieldDepth : options.maxAssociationFieldDepth + 1;
  return options.segments.length <= maxPathLength;
}

function buildNestedOptionFromFieldPath(options: {
  targetPath: string;
  leaf: FieldAssignCascaderOption;
  rootCollection: CollectionLike | null;
  t: (key: string) => string;
}): FieldAssignCascaderOption {
  const segments = splitFieldPath(options.targetPath);
  if (segments.length <= 1) {
    return options.leaf;
  }

  const build = (index: number, collection: CollectionLike | null): FieldAssignCascaderOption => {
    const value = segments[index];
    const isLast = index === segments.length - 1;
    if (isLast) {
      return {
        ...options.leaf,
        value,
      };
    }

    const field = getCollectionField(collection, value);
    const nextCollection = field?.targetCollection || null;
    return {
      label: getFieldLabelFromCollection(collection, value, options.t),
      value,
      isLeaf: false,
      children: [build(index + 1, nextCollection)],
    };
  };

  return build(0, options.rootCollection);
}

export function collectFieldAssignCascaderOptions(options: {
  formBlockModel: any;
  t: (key: string) => string;
  /** 子表单模型递归深度（FormItemModel 层级）；默认不限制（只受实际配置与循环引用约束） */
  maxFormItemDepth?: number;
  maxAssociationFieldDepth?: number;
}): FieldAssignCascaderOption[] {
  const { formBlockModel, t, maxFormItemDepth = Number.POSITIVE_INFINITY, maxAssociationFieldDepth = 2 } = options;

  const rootItems = formBlockModel?.subModels?.grid?.subModels?.items || [];
  const rootCollection = getCollectionFromFormBlockModel(formBlockModel);

  const walkItems = (items: any[], depth: number): FieldAssignCascaderOption[] => {
    if (!Array.isArray(items)) return [];
    if (depth > maxFormItemDepth) return [];

    const out: FieldAssignCascaderOption[] = [];

    for (const item of items) {
      if (!item) continue;

      const itemLabel = getItemLabel(item, t);
      const targetPath = getItemFieldPath(item);
      if (!targetPath) continue;

      const segments = splitFieldPath(targetPath);
      const seg = segments[segments.length - 1];
      if (!seg) continue;

      const node: FieldAssignCascaderOption = {
        label: itemLabel,
        value: seg,
      };

      const fieldModel = item?.subModels?.field;
      const childItems = fieldModel?.subModels?.grid?.subModels?.items;
      const cf: (CollectionField & { target?: unknown; targetCollection?: unknown }) | undefined =
        fieldModel?.context?.collectionField;
      const isAssociation = isAssociationFieldLike(cf);
      const hasTargetCollection = !!cf?.targetCollection;
      if (
        !shouldIncludeConfiguredFieldPath({
          segments,
          rootCollection,
          leafField: cf,
          maxAssociationFieldDepth,
        })
      ) {
        continue;
      }

      // 1) 子表单/子表单列表：递归展开已配置字段（支持无限深度）。
      //
      // 对于关联字段，不预先递归/展开 target collection 字段，改为由 Cascader 的 loadData 异步加载，
      // 以支持无限层级（含循环引用）且避免一次性构建巨大树。
      if (Array.isArray(childItems)) {
        if (isAssociation && hasTargetCollection) {
          node.isLeaf = false;
          // children 留空：由 loadData 动态填充（包含已配置与未配置字段）
        } else {
          const configuredChildren = childItems.length ? walkItems(childItems, depth + 1) : [];
          if (configuredChildren.length) {
            node.children = configuredChildren;
            node.isLeaf = false;
          } else {
            node.isLeaf = true;
          }
        }
        mergeCascaderOptionInto(out, buildNestedOptionFromFieldPath({ targetPath, leaf: node, rootCollection, t }));
        continue;
      }

      // 2) record picker 等：允许选择关联记录的属性字段（`user.name`），并支持无限嵌套（含对多/循环引用）
      if (isAssociation && hasTargetCollection) {
        node.isLeaf = false;
      } else {
        // 非关联字段作为叶子节点
        node.isLeaf = true;
      }

      mergeCascaderOptionInto(out, buildNestedOptionFromFieldPath({ targetPath, leaf: node, rootCollection, t }));
    }

    return out;
  };

  const configuredOptions = walkItems(rootItems, 1);
  const allFieldOptions = buildFieldAssignCascaderOptionsFromCollection(rootCollection, t, {
    maxAssociationFieldDepth,
  });
  return mergeRootOptions(configuredOptions, allFieldOptions);
}
