/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionBlockModel } from '@nocobase/client';
import { FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';

export class FlowUtils {
  static getSubModels(model: FlowModel) {
    return Object.values(model.subModels).flatMap((x) => (_.isArray(x) ? x : [x]));
  }

  static walkthrough(model: FlowModel, callback: (model: FlowModel) => void) {
    const queue: FlowModel[] = FlowUtils.getSubModels(model);
    while (queue.length) {
      const item = queue.shift();
      if (item.subModels) {
        queue.push(...FlowUtils.getSubModels(item));
      }
      callback(item);
    }
  }

  static getCollection(model: CollectionBlockModel) {
    if (!model) {
      return {};
    }
    const fields = model.collection.getFields().map((field) => ({
      readonly: field.readonly,
      name: field.name,
      type: field.type,
      dataType: field.dataType,
      title: field.title,
      enum: field.enum,
      defaultValue: field.defaultValue,
    }));
    return {
      name: model.collection.name,
      title: model.collection.title,
      fields,
    };
  }

  static getResource(model: CollectionBlockModel) {
    if (!model) {
      return null;
    }
    return model.resource.getData();
  }
}
