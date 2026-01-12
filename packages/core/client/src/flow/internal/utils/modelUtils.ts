/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';

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

function getFormItemFieldPath(model: unknown): string | undefined {
  if (!model || typeof model !== 'object') return undefined;
  const record = model as Record<string, unknown>;
  const direct = record.fieldPath;
  if (typeof direct === 'string' && direct) return direct;

  const getStepParams = record.getStepParams;
  if (typeof getStepParams === 'function') {
    const init = (getStepParams as (flowKey: string, stepKey: string) => unknown)('fieldSettings', 'init');
    if (init && typeof init === 'object') {
      const fp = (init as { fieldPath?: unknown }).fieldPath;
      if (typeof fp === 'string' && fp) return fp;
    }
  }

  return undefined;
}

function getSubModelItems(model: unknown): unknown[] {
  if (!model || typeof model !== 'object') return [];
  const record = model as Record<string, unknown>;
  const subModels = record.subModels;
  if (!subModels || typeof subModels !== 'object') return [];

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
 * including nested subform items.
 */
export function findFormItemModelByFieldPath(root: unknown, targetPath: string): FlowModel | null {
  if (!targetPath) return null;

  const walk = (items: unknown[]): FlowModel | null => {
    if (!Array.isArray(items)) return null;
    for (const it of items) {
      const fp = getFormItemFieldPath(it);
      if (fp && String(fp) === String(targetPath)) return it as FlowModel;

      const hit = walk(getChildFormItems(it));
      if (hit) return hit;
    }
    return null;
  };

  return walk(getSubModelItems(root));
}
