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

  private build = async (model: Model, { values, transaction }) => {
    const { name, target, targetKey = '__json_index' } = this.options;
    if (!values || values[name] === undefined) {
      return;
    }
    const targetCollection = this.database.getCollection(target);
    if (!targetCollection) {
      return;
    }
    const targetModel = targetCollection.model;
    const document = values[name];
    if (!Array.isArray(document)) {
      let isNewRecord = true;
      if (document[targetKey]) {
        isNewRecord = false;
      } else {
        document[targetKey] = 0;
      }
      const instance = await targetModel.build(document, { isNewRecord }).save({ transaction, hooks: true });
      model.set(name, instance.dataValues);
      return;
    }
    const buildPromises = document.map(async (item: any, index: number) => {
      let isNewRecord = true;
      if (item[targetKey]) {
        isNewRecord = false;
      } else {
        item[targetKey] = index;
      }
      const instance = await targetModel.build(item, { isNewRecord }).save({ transaction, hooks: true });
      return instance.dataValues;
    });
    const documents = await Promise.all(buildPromises);
    model.set(name, documents);
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.build);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.build);
  }
}

export interface JSONDocumentFieldOptions extends Omit<JsonFieldOptions, 'type'> {
  type: 'JSONDocument';
  target: string;
  targetKey: string;
}
