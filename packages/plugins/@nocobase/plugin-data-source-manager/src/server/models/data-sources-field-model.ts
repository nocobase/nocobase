/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MagicAttributeModel } from '@nocobase/database';
import { Application } from '@nocobase/server';
import _ from 'lodash';
import { mergeOptions } from '../utils';

type LoadOptions = {
  app: Application;
};

export class DataSourcesFieldModel extends MagicAttributeModel {
  load(loadOptions: LoadOptions) {
    const { app } = loadOptions;

    const options = this.toJSON();
    const { collectionName, name, dataSourceKey, field } = options;
    const dataSource = app.dataSourceManager.dataSources.get(dataSourceKey);
    const collection = dataSource.collectionManager.getCollection(collectionName);

    const oldFieldByName = collection.getField(name);
    const oldFieldByField = field ? collection.getFieldByField(field) : null;

    const oldField = oldFieldByField || oldFieldByName;
    const newOptions = mergeOptions(oldField ? oldField.options : {}, options);

    collection.setField(name, newOptions);

    if (oldFieldByField && !oldFieldByName) {
      const filedShouldRemove = collection
        .getFields()
        .filter((f) => f.options.field === field && f.options.name !== name);

      for (const f of filedShouldRemove) {
        collection.removeField(f.options.name);
      }
    }
  }

  unload(loadOptions: LoadOptions) {
    const { app } = loadOptions;
    const options = this.toJSON();
    const { collectionName, name, dataSourceKey } = options;
    const dataSource = app.dataSourceManager.dataSources.get(dataSourceKey);
    if (!dataSource) {
      return;
    }
    const collection = dataSource.collectionManager.getCollection(collectionName);
    if (!collection) {
      return;
    }

    collection.removeField(name);
  }

  toJSON() {
    const json = super.toJSON();
    if (json.interface === 'unixTimestamp' && json.accuracy) {
      _.set(json, 'uiSchema.x-component-props.accuracy', json.accuracy);
    }
    return json;
  }
}
