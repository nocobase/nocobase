/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function normalizeScenes(input?: string | string[]) {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  return list.map((scene) => String(scene).trim()).filter(Boolean);
}

const MODEL_CLASS_SCENE_MAP: Record<string, string[]> = {
  DetailsItemModel: ['detailFieldEvent'],
  DetailsCustomItemModel: ['detailFieldEvent'],
  TableColumnModel: ['tableFieldEvent'],
  TableCustomColumnModel: ['tableFieldEvent'],
  SubTableColumnModel: ['tableFieldEvent'],
  FormItemModel: ['formFieldEvent'],
  FilterFormItemModel: ['formFieldEvent'],
};

export function inferRunJSScenesFromContext(hostCtx: any, explicitScene?: string | string[]) {
  const explicitScenes = normalizeScenes(explicitScene);
  if (!explicitScenes.includes('eventFlow')) return undefined;
  const modelClassName = hostCtx?.model?.constructor?.name;
  if (!modelClassName || typeof modelClassName !== 'string') return undefined;
  const inferred = MODEL_CLASS_SCENE_MAP[modelClassName];
  return inferred?.length ? [...inferred] : undefined;
}

export function mergeRunJSScenes(explicitScene?: string | string[], autoScenes?: string[]) {
  const merged = [...normalizeScenes(explicitScene), ...normalizeScenes(autoScenes)];
  const deduped = Array.from(new Set(merged));
  return deduped.length ? deduped : undefined;
}
