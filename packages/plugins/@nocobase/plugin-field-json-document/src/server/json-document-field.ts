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
    const { name, target, targetKey = '__json_index' } = this.options;
    const newValues = model.get(name);
    const oldValues = model.previous(name);

    if (!newValues) {
      return;
    }
    const targetCollection = this.database.getCollection(target);
    if (!targetCollection) {
      return;
    }
    const targetModel = targetCollection.model;
    if (!Array.isArray(newValues)) {
      delete (newValues.dataValues || newValues)[targetKey];
      let instance: Model;
      if (oldValues) {
        delete (oldValues.dataValues || oldValues)[targetKey];
        instance = targetModel.build(oldValues.dataValues || oldValues, { raw: true });
        instance.set(newValues.dataValues || newValues);
      }
      instance = instance || targetModel.build(newValues.dataValues || newValues, { isNewRecord: true });
      // @ts-ignore
      await instance.save(options);
      model.set(name, instance.dataValues);
      return;
    }
    const buildPromises = newValues.map(async (item: any, index: number) => {
      const prev = oldValues?.[index];
      delete (item.dataValues || item)[targetKey];
      let instance: Model;
      if (prev) {
        delete (prev.dataValues || prev)[targetKey];
        instance = targetModel.build(prev.dataValues || prev, { raw: true });
        instance.set(item.dataValues || item);
      }
      instance = instance || targetModel.build(item.dataValues || item, { isNewRecord: true });
      // @ts-ignore
      await instance.save(options);
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
