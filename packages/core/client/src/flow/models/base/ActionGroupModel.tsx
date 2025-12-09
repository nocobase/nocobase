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
} from '@nocobase/flow-engine';
import _ from 'lodash';
import { ActionModel, ActionSceneEnum, ActionSceneType } from './ActionModel';

export class ActionGroupModel extends FlowModel {
  static baseClass?: string | ModelConstructor;
  static scene: ActionSceneType;
  private static _models: Map<string, typeof ActionModel>;

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

    // 获取当前类及其所有父类
    const allParentClasses = this.getAllParentClasses();

    // 遍历所有父类的绑定
    for (const parentClass of allParentClasses) {
      for (const [name, M] of parentClass.currentModels) {
        allModels.set(name, M);
      }
    }

    // 合并当前类的绑定
    for (const [name, M] of this.currentModels) {
      allModels.set(name, M);
    }

    return allModels;
  }

  static registerActionModels(models: Record<string, any>) {
    for (const [name, M] of Object.entries(models)) {
      Object.defineProperty(M, 'name', { value: name });
      this.currentModels.set(name, M);
    }
  }

  static async defineChildren(ctx: FlowModelContext) {
    const children = this.baseClass ? await buildSubModelItems(this.baseClass)(ctx) : [];
    const extra = [];

    const items = children.filter((item) => {
      if (!this.scene) {
        return true;
      }
      const M = ctx.engine.getModelClass(item.useModel) as typeof ActionModel;
      return M._isScene(this.scene);
    });

    for (const [_, M] of this.models) {
      const r = items.find((item) => item.useModel === M.name);
      if (r) {
        continue;
      }
      const item = await buildSubModelItem(M, ctx);
      if (item) {
        extra.push(item);
      }
    }

    return _.sortBy([...items, ...extra], 'sort');
  }
}

export class CollectionActionGroupModel extends ActionGroupModel {
  static baseClass = ActionModel;
  static scene = ActionSceneEnum.collection;
}

export class RecordActionGroupModel extends ActionGroupModel {
  static baseClass = ActionModel;
  static scene = ActionSceneEnum.record;
}
