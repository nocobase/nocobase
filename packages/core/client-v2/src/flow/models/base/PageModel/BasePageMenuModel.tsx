/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine, FlowModelContext, FlowModelMeta, ModelConstructor } from '@nocobase/flow-engine';
import {
  NocoBaseDesktopRouteType,
  type NocoBaseDesktopRoute,
  type NocoBaseDesktopRouteTypeValue,
} from '../../../../flow-compat/routeTypes';
import { RootPageModel } from './RootPageModel';

export interface BasePageMenuModelMeta extends FlowModelMeta {
  routeType: NocoBaseDesktopRouteTypeValue;
}

export interface ResolvedPageMenuModel {
  icon?: FlowModelMeta['icon'];
  label?: FlowModelMeta['label'];
  modelClass: string;
  routeType: NocoBaseDesktopRouteTypeValue;
  sort: number;
}

export interface BuildPageMenuRouteOptions {
  icon?: string;
  parentId?: number;
  schemaUid: string;
  title?: string;
}

const pageMenuModelMetas = new WeakMap<ModelConstructor, BasePageMenuModelMeta>();
const builtInRouteTypes = new Set<string>(Object.values(NocoBaseDesktopRouteType));

export class BasePageMenuModel extends RootPageModel {
  static define(meta: BasePageMenuModelMeta) {
    pageMenuModelMetas.set(this as unknown as ModelConstructor, meta);
    super.define(meta);
  }

  static get pageMenuMeta() {
    return pageMenuModelMetas.get(this as unknown as ModelConstructor);
  }

  onInit(options: Parameters<RootPageModel['onInit']>[0]) {
    super.onInit(options);
    this.setProps('showFlowSettings', false);
  }
}

function getPageMenuModelMeta(ModelClass: ModelConstructor) {
  return (ModelClass as typeof BasePageMenuModel).pageMenuMeta;
}

function isHidden(meta: BasePageMenuModelMeta, context: FlowModelContext) {
  return typeof meta.hide === 'function' ? meta.hide(context) : meta.hide === true;
}

export async function resolvePageMenuModels(
  engine: FlowEngine,
  context: FlowModelContext = engine.context,
): Promise<ResolvedPageMenuModel[]> {
  if (!engine.getModelClass('BasePageMenuModel')) {
    return [];
  }
  const modelClasses = await engine.getSubclassesOfAsync('BasePageMenuModel');
  const candidates = Array.from(modelClasses.entries()).map(([modelClass, ModelClass]) => ({
    meta: getPageMenuModelMeta(ModelClass),
    modelClass,
  }));
  const routeTypeCounts = new Map<string, number>();

  candidates.forEach(({ meta }) => {
    const routeType = typeof meta?.routeType === 'string' ? meta.routeType.trim() : '';
    if (routeType) {
      routeTypeCounts.set(routeType, (routeTypeCounts.get(routeType) || 0) + 1);
    }
  });

  const definitions: ResolvedPageMenuModel[] = [];
  for (const { meta, modelClass } of candidates) {
    const routeType = typeof meta?.routeType === 'string' ? meta.routeType.trim() : '';
    if (!meta || !routeType) {
      console.error(`[NocoBase] Page menu model '${modelClass}' must define a non-empty route type.`);
      continue;
    }
    if (builtInRouteTypes.has(routeType)) {
      console.error(`[NocoBase] Page menu route type '${routeType}' conflicts with a built-in route type.`);
      continue;
    }
    if ((routeTypeCounts.get(routeType) || 0) > 1) {
      console.error(`[NocoBase] Page menu route type '${routeType}' is registered more than once.`);
      continue;
    }
    if (await Promise.resolve(isHidden(meta, context))) {
      continue;
    }
    definitions.push({
      icon: meta.icon,
      label: meta.label,
      modelClass,
      routeType,
      sort: meta.sort ?? 0,
    });
  }

  return definitions.sort((a, b) => a.sort - b.sort || a.modelClass.localeCompare(b.modelClass));
}

export async function resolvePageMenuModelByRouteType(
  engine: FlowEngine,
  routeType: string | undefined,
  context: FlowModelContext = engine.context,
) {
  if (!routeType) {
    return undefined;
  }
  const definitions = await resolvePageMenuModels(engine, context);
  return definitions.find((definition) => definition.routeType === routeType);
}

export function buildPageMenuRoute(
  definition: ResolvedPageMenuModel,
  options: BuildPageMenuRouteOptions,
): NocoBaseDesktopRoute {
  const label = typeof definition.label === 'string' ? definition.label : undefined;
  const icon = options.icon ?? (typeof definition.icon === 'string' ? definition.icon : undefined);
  return {
    type: definition.routeType,
    title: options.title ?? label,
    icon,
    parentId: options.parentId,
    schemaUid: options.schemaUid,
    options: {
      pageMenuModelClass: definition.modelClass,
    },
  };
}
