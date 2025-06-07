/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, IFlowModelRepository } from '@nocobase/flow-engine';
import _ from 'lodash';

export class MockFlowModelRepository implements IFlowModelRepository<FlowModel> {
  get models() {
    const models = new Map();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flow-model:')) {
        const data = localStorage.getItem(key);
        if (data) {
          const model = JSON.parse(data);
          models.set(model.uid, model);
        }
      }
    }
    return models;
  }

  // 从本地存储加载模型数据
  async load(uid: string) {
    const data = localStorage.getItem(`flow-model:${uid}`);
    if (!data) {
      console.warn(`Model with uid ${uid} not found in localStorage.`);
      return null;
    }
    const json = JSON.parse(data);
    for (const model of [...this.models.values()]) {
      if (model.parentId === uid) {
        if (model.subType === 'array') {
          json[model.subKey] = json[model.subKey] || [];
          const subModel = await this.load(model.uid);
          json[model.subKey].push(subModel);
        } else if (model.subType === 'object') {
          const subModel = await this.load(model.uid);
          json[model.subKey] = subModel;
        }
      }
    }
    console.log('Loading model:', uid, JSON.stringify(json, null, 2));
    return json;
  }

  // 将模型数据保存到本地存储
  async save(model: FlowModel) {
    const data = model.serialize();
    const currentData = _.omit(data, [...Object.keys(model.subModels)]);
    localStorage.setItem(`flow-model:${model.uid}`, JSON.stringify(currentData));
    console.log('Saving model:', model.uid, currentData);
    for (const subModelKey of Object.keys(model.subModels)) {
      const subModelValue = model.subModels[subModelKey];
      if (!subModelValue) continue;
      if (Array.isArray(subModelValue)) {
        for (const subModel of subModelValue) {
          await this.save(subModel);
        }
      } else if (subModelValue instanceof FlowModel) {
        await this.save(subModelValue);
      }
    }
    return data;
  }

  // 从本地存储中删除模型数据
  async destroy(uid: string) {
    localStorage.removeItem(`flow-model:${uid}`);
    return true;
  }
}
