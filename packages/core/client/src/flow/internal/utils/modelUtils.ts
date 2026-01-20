/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import { FormItemModel } from '../../models';

export interface CollectionLike {
  getField?: (name: string) => unknown;
  getFields?: () => unknown[];
  dataSourceKey?: string;
  name?: string;
}

export function isToManyAssociationField(field: unknown): boolean {
  if (!field || typeof field !== 'object') return false;
  const f = field as { isAssociationField?: () => boolean; type?: unknown; interface?: unknown };
  if (!f.isAssociationField?.()) return false;
  const relType = f.type;
  const relInterface = f.interface;
  return (
    relType === 'belongsToMany' ||
    relType === 'hasMany' ||
    relType === 'belongsToArray' ||
    relInterface === 'm2m' ||
    relInterface === 'o2m' ||
    relInterface === 'mbm'
  );
}

type ModelWithMaybeCollection = {
  collection?: CollectionLike;
  context?: { collection?: CollectionLike } | null;
};

export function getCollectionFromModel(model: unknown): CollectionLike | undefined {
  if (!model || typeof model !== 'object') return undefined;
  const m = model as ModelWithMaybeCollection;
  return m.collection || m.context?.collection || undefined;
}

function normalizePath(val: unknown): string {
  return typeof val === 'string' ? val.trim() : '';
}

function getFormItemFieldPathCandidates(model: unknown): string[] {
  if (!model || typeof model !== 'object') return [];
  const record = model as Record<string, unknown>;

  const init =
    typeof record.getStepParams === 'function'
      ? (record.getStepParams as (flowKey: string, stepKey: string) => unknown)('fieldSettings', 'init')
      : undefined;
  const initObj = init && typeof init === 'object' ? (init as Record<string, unknown>) : undefined;

  const rawFieldPath = (initObj?.fieldPath as unknown) ?? record.fieldPath;
  const rawAssocPath = (initObj?.associationPathName as unknown) ?? record.associationPathName;

  const fieldPath = normalizePath(rawFieldPath);
  const assocPath = normalizePath(rawAssocPath);

  const paths = new Set<string>();
  if (fieldPath) {
    paths.add(fieldPath);
  }
  if (assocPath) {
    if (!fieldPath) {
      paths.add(assocPath);
    } else if (fieldPath.startsWith(`${assocPath}.`)) {
      paths.add(fieldPath);
    } else {
      paths.add(`${assocPath}.${fieldPath}`);
    }
  }

  return Array.from(paths);
}

function getSubModelItems(model: unknown): unknown[] {
  if (!model || typeof model !== 'object') return [];
  const record = model as Record<string, unknown>;
  const subModels = record.subModels;
  if (!subModels || typeof subModels !== 'object') return [];

  // Support both:
  // - FormBlockModel-like: root.subModels.grid.subModels.items
  // - FormGridModel-like:  root.subModels.items
  const directItems = (subModels as Record<string, unknown>).items;
  if (Array.isArray(directItems)) return directItems;

  const grid = (subModels as Record<string, unknown>).grid;
  if (!grid || typeof grid !== 'object') return [];

  const gridSubModels = (grid as Record<string, unknown>).subModels;
  if (!gridSubModels || typeof gridSubModels !== 'object') return [];

  const items = (gridSubModels as Record<string, unknown>).items;
  return Array.isArray(items) ? items : [];
}

function getChildFormItems(formItemModel: unknown): unknown[] {
  if (!formItemModel || typeof formItemModel !== 'object') return [];
  const record = formItemModel as Record<string, unknown>;
  const subModels = record.subModels;
  if (!subModels || typeof subModels !== 'object') return [];
  const fieldModel = (subModels as Record<string, unknown>).field;
  return getSubModelItems(fieldModel);
}

/**
 * Find a configured FormItemModel by its `fieldSettings.init.fieldPath` (or `fieldPath`) in the current form grid,
 * including nested subform items. Also supports combined path matching when a model stores
 * `associationPathName + fieldPath` separately (e.g. wrapper field children builders).
 */
export function findFormItemModelByFieldPath(root: unknown, targetPath: string): FormItemModel | null {
  const normalizedTargetPath = normalizePath(targetPath);
  if (!normalizedTargetPath) return null;

  const walk = (items: unknown[]): FormItemModel | null => {
    if (!Array.isArray(items)) return null;
    for (const it of items) {
      const candidates = getFormItemFieldPathCandidates(it);
      if (candidates.some((p) => p === normalizedTargetPath)) return it as FormItemModel;
      const hit = walk(getChildFormItems(it));
      if (hit) return hit;
    }
    return null;
  };

  return walk(getSubModelItems(root));
}
