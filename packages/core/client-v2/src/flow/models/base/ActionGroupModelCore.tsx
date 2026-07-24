/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildSubModelItem,
  buildSubModelItems,
  FlowModel,
  FlowModelContext,
  ModelConstructor,
  type SubModelItem,
} from '@nocobase/flow-engine';
import _ from 'lodash';
import { ActionModel, ActionSceneEnum, ActionSceneType } from './ActionModelCore';
import { areCapabilitiesSupported, getActionCapabilityNamesFromModelClass } from '../../utils/actionCapability';

export interface ActionGroupMenuItemProviderContext {
  groupModelClass: typeof ActionGroupModel;
  ctx: FlowModelContext;
  items: SubModelItem[];
}

export type ActionGroupMenuItemProvider = (
  context: ActionGroupMenuItemProviderContext,
) => SubModelItem | SubModelItem[] | null | undefined | Promise<SubModelItem | SubModelItem[] | null | undefined>;

export class ActionGroupModel extends FlowModel {
  static baseClass?: string | ModelConstructor;
  static scene: ActionSceneType;
  private static _models: Map<string, typeof ActionModel>;
  private static _menuItemProviders: Map<string, ActionGroupMenuItemProvider>;

  static getAllParentClasses(): any[] {
    const parentClasses = [];
    let currentClass: any = this;

    while (currentClass && currentClass !== Object) {
      currentClass = Object.getPrototypeOf(currentClass);
      if (currentClass?.currentModels) {
        parentClasses.push(currentClass);
      }
    }

    return parentClasses;
  }

  static get currentModels() {
    if (!Object.prototype.hasOwnProperty.call(this, '_models') || !this._models) {
      this._models = new Map();
    }
    return this._models;
  }

  static get models() {
    const allModels = new Map();

    for (const parentClass of this.getAllParentClasses()) {
      for (const [name, M] of parentClass.currentModels) {
        allModels.set(name, M);
      }
    }

    for (const [name, M] of this.currentModels) {
      allModels.set(name, M);
    }

    return allModels;
  }

  static get currentMenuItemProviders() {
    if (!Object.prototype.hasOwnProperty.call(this, '_menuItemProviders') || !this._menuItemProviders) {
      this._menuItemProviders = new Map();
    }
    return this._menuItemProviders;
  }

  static get menuItemProviders() {
    const allProviders = new Map<string, ActionGroupMenuItemProvider>();

    for (const parentClass of this.getAllParentClasses()) {
      for (const [key, provider] of parentClass.currentMenuItemProviders) {
        allProviders.set(key, provider);
      }
    }

    for (const [key, provider] of this.currentMenuItemProviders) {
      allProviders.set(key, provider);
    }

    return allProviders;
  }

  static registerMenuItemProvider(key: string, provider: ActionGroupMenuItemProvider): () => void {
    this.currentMenuItemProviders.set(key, provider);
    return () => {
      if (this.currentMenuItemProviders.get(key) === provider) {
        this.currentMenuItemProviders.delete(key);
      }
    };
  }

  static clearMenuItemProviders(): void {
    this.currentMenuItemProviders.clear();
  }

  static registerActionModels(models: Record<string, any>) {
    for (const [name, M] of Object.entries(models)) {
      Object.defineProperty(M, 'name', { value: name });
      this.currentModels.set(name, M);
    }
  }

  static isActionModelVisible(ModelClass: typeof ActionModel, ctx: FlowModelContext) {
    const collection = ctx.collection || ctx.blockModel?.collection;
    const capabilityNames = getActionCapabilityNamesFromModelClass(ModelClass);
    return areCapabilitiesSupported(collection, capabilityNames);
  }

  static async defineChildren(ctx: FlowModelContext) {
    const children = this.baseClass ? await buildSubModelItems(this.baseClass)(ctx) : [];
    const extra = [];

    const items = children.filter((item) => {
      const M = ctx.engine.getModelClass(item.useModel) as typeof ActionModel;
      if (!this.isActionModelVisible(M, ctx)) {
        return false;
      }
      if (!this.scene) {
        return true;
      }
      return M._isScene(this.scene);
    });

    for (const [_, M] of this.models) {
      if (!this.isActionModelVisible(M, ctx)) {
        continue;
      }
      const r = items.find((item) => item.useModel === M.name);
      if (r) {
        continue;
      }
      const item = await buildSubModelItem(M, ctx);
      if (item) {
        extra.push(item);
      }
    }

    const resolvedItems: SubModelItem[] = _.sortBy([...items, ...extra], 'sort');

    for (const [key, provider] of this.menuItemProviders) {
      try {
        const provided = await provider({
          groupModelClass: this,
          ctx,
          items: [...resolvedItems],
        });
        if (Array.isArray(provided)) {
          resolvedItems.push(...provided);
        } else if (provided) {
          resolvedItems.push(provided);
        }
      } catch (error) {
        console.error(`[NocoBase] Failed to resolve action group menu item provider '${key}':`, error);
      }
    }

    return _.sortBy(resolvedItems, (item) => item.sort ?? 1000);
  }
}

export function registerActionGroupMenuItemProvider(key: string, provider: ActionGroupMenuItemProvider): () => void {
  return ActionGroupModel.registerMenuItemProvider(key, provider);
}

export function clearActionGroupMenuItemProviders(): void {
  ActionGroupModel.clearMenuItemProviders();
}

export class CollectionActionGroupModel extends ActionGroupModel {
  static baseClass = ActionModel;
  static scene = ActionSceneEnum.collection;
}

export class RecordActionGroupModel extends ActionGroupModel {
  static baseClass = ActionModel;
  static scene = ActionSceneEnum.record;
}
