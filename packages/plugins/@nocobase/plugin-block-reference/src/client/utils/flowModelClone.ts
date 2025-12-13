/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { CreateModelOptions, StepParams } from '@nocobase/flow-engine';
import { FlowModel } from '@nocobase/flow-engine';
import { uid } from '@formily/shared';

function getSubModels(model: FlowModel): Record<string, FlowModel | FlowModel[] | undefined> {
  return ((model as unknown as { subModels?: Record<string, FlowModel | FlowModel[] | undefined> }).subModels ||
    {}) as Record<string, FlowModel | FlowModel[] | undefined>;
}

function replaceUidsDeep(value: unknown, uidMap: Record<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => replaceUidsDeep(v, uidMap));
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      next[k] = replaceUidsDeep(v, uidMap);
    }
    return next;
  }
  if (typeof value === 'string' && uidMap[value]) {
    return uidMap[value];
  }
  return value;
}

function collectModelUids(model: FlowModel, uidMap: Record<string, string>) {
  if (!model || uidMap[model.uid]) return;
  uidMap[model.uid] = uid();
  const subModels = getSubModels(model);
  for (const val of Object.values(subModels)) {
    if (Array.isArray(val)) {
      for (const child of val) {
        if (child instanceof FlowModel) {
          collectModelUids(child, uidMap);
        }
      }
    } else if (val instanceof FlowModel) {
      collectModelUids(val, uidMap);
    }
  }
}

function duplicateTreeLocally(
  source: FlowModel,
  uidMap: Record<string, string>,
  newParentUid?: string,
): CreateModelOptions {
  const data = source.serialize();
  const { subModels: serializedSubModels, ...rest } = data;
  const newUid = uidMap[source.uid] || uid();
  const cloned: CreateModelOptions = { ...(rest as CreateModelOptions), uid: newUid };
  if (newParentUid) cloned.parentId = newParentUid;
  if (cloned.stepParams) {
    cloned.stepParams = replaceUidsDeep(_.cloneDeep(cloned.stepParams), uidMap) as StepParams;
  }

  const children = getSubModels(source);
  const nextSubModels: Record<string, CreateModelOptions | CreateModelOptions[]> = {};
  for (const [subKey, val] of Object.entries(children)) {
    if (!val) continue;
    if (Array.isArray(val)) {
      const arr = val
        .filter((c): c is FlowModel => c instanceof FlowModel)
        .map((c) => {
          return duplicateTreeLocally(c, uidMap, newUid);
        });
      if (arr.length) nextSubModels[subKey] = arr;
    } else if (val instanceof FlowModel) {
      nextSubModels[subKey] = duplicateTreeLocally(val, uidMap, newUid);
    }
  }

  if (Object.keys(nextSubModels).length) {
    cloned.subModels = nextSubModels;
  } else if (serializedSubModels) {
    // fallback to serialized subModels if instance children unavailable
    cloned.subModels = _.cloneDeep(serializedSubModels);
  }
  return cloned;
}

export function duplicateModelTreeLocally(source: FlowModel): {
  duplicated: CreateModelOptions;
  uidMap: Record<string, string>;
} {
  const uidMap: Record<string, string> = {};
  collectModelUids(source, uidMap);
  const duplicated = duplicateTreeLocally(source, uidMap);
  return { duplicated, uidMap };
}
