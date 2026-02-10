/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionField } from '@nocobase/flow-engine';

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
  const fp = itemModel?.fieldPath || itemModel?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
  return typeof fp === 'string' && fp ? fp : undefined;
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

function getLastPathSegment(path: string): string {
  const segs = String(path || '')
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);
  return segs.length ? segs[segs.length - 1] : '';
}

type CollectionLike = {
  getField?: (name: string) => unknown;
  getFields?: () => unknown[];
};

function getCollectionFromFormBlockModel(model: any): CollectionLike | null {
  if (!model || typeof model !== 'object') return null;
  const collection = (model as any)?.collection || (model as any)?.context?.collection;
  return collection && typeof collection === 'object' ? (collection as CollectionLike) : null;
}

function buildRootOptionsFromCollection(
  collection: CollectionLike | null,
  t: (key: string) => string,
): FieldAssignCascaderOption[] {
  const fields = typeof collection?.getFields === 'function' ? collection.getFields() || [] : [];
  const out: FieldAssignCascaderOption[] = [];
  for (const rawField of fields) {
    if (!rawField) continue;
    const f = rawField as {
      name?: unknown;
      title?: unknown;
      interface?: unknown;
      isAssociationField?: () => boolean;
      targetCollection?: any;
    };
    const fieldInterface = typeof f.interface === 'string' ? f.interface : undefined;
    if (!fieldInterface) continue;
    if (fieldInterface === 'formula') continue;

    const name = String(f.name || '');
    if (!name) continue;
    const title = t(typeof f.title === 'string' ? f.title : name);

    const isAssoc = !!f.isAssociationField?.();
    const hasTarget = !!f.targetCollection;

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
  const configuredList = Array.isArray(configured) ? configured : [];
  const allList = Array.isArray(allFields) ? allFields : [];

  const configuredValues = new Set<string>();
  for (const it of configuredList) {
    const v = it?.value ? String(it.value) : '';
    if (v) configuredValues.add(v);
  }

  const extra = allList.filter((it) => {
    const v = it?.value ? String(it.value) : '';
    if (!v) return false;
    return !configuredValues.has(v);
  });

  return [...configuredList, ...extra];
}

export function collectFieldAssignCascaderOptions(options: {
  formBlockModel: any;
  t: (key: string) => string;
  /** 子表单模型递归深度（FormItemModel 层级）；默认不限制（只受实际配置与循环引用约束） */
  maxFormItemDepth?: number;
}): FieldAssignCascaderOption[] {
  const { formBlockModel, t, maxFormItemDepth = Number.POSITIVE_INFINITY } = options;

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

      const seg = getLastPathSegment(targetPath);
      if (!seg) continue;

      const node: FieldAssignCascaderOption = {
        label: itemLabel,
        value: seg,
      };

      const fieldModel = item?.subModels?.field;
      const childItems = fieldModel?.subModels?.grid?.subModels?.items;
      const cf: CollectionField | undefined = fieldModel?.context?.collectionField;
      const isAssociation = !!cf?.isAssociationField?.();
      const hasTargetCollection = !!cf?.targetCollection;

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
        out.push(node);
        continue;
      }

      // 2) record picker 等：允许选择关联记录的属性字段（`user.name`），并支持无限嵌套（含对多/循环引用）
      if (isAssociation && hasTargetCollection) {
        node.isLeaf = false;
      } else {
        // 非关联字段作为叶子节点
        node.isLeaf = true;
      }

      out.push(node);
    }

    return out;
  };

  const configuredOptions = walkItems(rootItems, 1);
  const allFieldOptions = buildRootOptionsFromCollection(rootCollection, t);
  return mergeRootOptions(configuredOptions, allFieldOptions);
}
