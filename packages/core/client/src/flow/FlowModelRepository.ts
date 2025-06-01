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
    if (!data) return null;
    const json = JSON.parse(data);
    for (const model of this.models.values()) {
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
    return json;
  }

  // 将模型数据保存到本地存储
  async save(model: FlowModel) {
    const data = model.serialize();
    const currentData = _.omit(data, [...model.subModelKeys]);
    localStorage.setItem(`flow-model:${model.uid}`, JSON.stringify(currentData));
    for (const subModelKey of model.subModelKeys) {
      if (!model[subModelKey]) continue;
      if (Array.isArray(model[subModelKey])) {
        model[subModelKey].forEach((subModel: FlowModel) => {
          localStorage.setItem(`flow-model:${subModel.uid}`, JSON.stringify(subModel.serialize()));
        });
      } else if (model[subModelKey] instanceof FlowModel) {
        localStorage.setItem(`flow-model:${model[subModelKey].uid}`, JSON.stringify(model[subModelKey].serialize()));
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
