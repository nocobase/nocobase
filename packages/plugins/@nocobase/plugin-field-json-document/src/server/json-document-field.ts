/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonField, JsonFieldOptions, Model } from '@nocobase/database';
import { JSONRepository } from './json-repository';

export const elementTypeMap = {
  nanoid: 'string',
  sequence: 'string',
};

export class JSONDocumentField extends JsonField {
  relationRepository = JSONRepository;

  private build = async (model: Model, options: any) => {
    const { values, jsonDocValues, prevJSONDocValues } = options;
    const { name, target, targetKey = '__json_index' } = this.options;
    const newValues = values[name] || jsonDocValues?.[name];
    const oldValues = prevJSONDocValues?.[name] || model._previousDataValues[name] || model.dataValues[name];
    if (!newValues) {
      return;
    }
    const targetCollection = this.database.getCollection(target);
    if (!targetCollection) {
      return;
    }
    const targetModel = targetCollection.model;
    if (!Array.isArray(oldValues)) {
      const document = { ...oldValues, ...newValues };
      delete document[targetKey];
      let instance = targetModel.build(document, { isNewRecord: true });
      instance._previousDataValues = oldValues;
      // @ts-ignore
      instance = await instance.save({ ...options, jsonDocValues: document, prevJSONDocValues: oldValues });
      model.set(name, instance.dataValues);
      return;
    }
    const buildPromises = newValues.map(async (item: any, index: number) => {
      const prev = oldValues[index];
      if (prev) {
        item = { ...prev, ...item };
      }
      delete item[targetKey];
      let instance = targetModel.build(item, { isNewRecord: true });
      if (prev) {
        instance._previousDataValues = prev;
      }
      // @ts-ignore
      instance = await instance.save({ ...options, jsonDocValues: item, prevJSONDocValues: prev });
      return instance.dataValues;
    });
    const documents = await Promise.all(buildPromises);
    model.set(name, documents);
  };

  private appendIndex = async (model: Model, options: any) => {
    const { name, target, targetKey = '__json_index' } = this.options;
    const document = model.get(name);
    if (!document) {
      return;
    }
    const targetCollection = this.database.getCollection(target);
    if (!targetCollection) {
      return;
    }
    const targetModel = targetCollection.model;
    if (!Array.isArray(document)) {
      document[targetKey] = 0;
      const instance = await targetModel.build(document.dataValues || document, { isNewRecord: true }).findAll(options);
      model.set(name, instance);
      return;
    }
    const buildPromises = document.map(async (item: any, index: number) => {
      item[targetKey] = index;
      const instance = await targetModel.build(item.dataValues || item, { isNewRecord: true }).findAll(options);
      return instance;
    });
    const documents = await Promise.all(buildPromises);
    model.set(name, documents);
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.build);
    // @ts-ignore
    this.on('afterFind', async (model: Model | Model[], options) => {
      if (Array.isArray(model)) {
        model.forEach((m) => this.appendIndex(m, options));
      } else {
        this.appendIndex(model, options);
      }
    });
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.build);
    // @ts-ignore
    this.off('afterFind', async (model: Model | Model[], options) => {
      if (Array.isArray(model)) {
        model.forEach((m) => this.appendIndex(m, options));
      } else {
        this.appendIndex(model, options);
      }
    });
  }
}

export interface JSONDocumentFieldOptions extends Omit<JsonFieldOptions, 'type'> {
  type: 'JSONDocument';
  target: string;
  targetKey: string;
}
