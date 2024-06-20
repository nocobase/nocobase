/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MagicAttributeModel, Model } from '@nocobase/database';
import { Application } from '@nocobase/server';

export class DataSourcesCollectionModel extends MagicAttributeModel {
  load(loadOptions: { app: Application }) {
    const { app } = loadOptions;

    const collectionOptions = this.get();
    const dataSourceName = this.get('dataSourceKey');
    const dataSource = app.dataSourceManager.dataSources.get(dataSourceName);
    const collection = dataSource.collectionManager.getCollection(collectionOptions.name);

    if (collectionOptions.fields) {
      collectionOptions.fields = collectionOptions.fields.map((field) => {
        if (field instanceof Model) {
          return field.get();
        }

        return field;
      });
    }

    if (collection) {
      collection.updateOptions(collectionOptions);
      if (collectionOptions.fields) {
        collection.setFields(collectionOptions.fields);
      }
    } else {
      dataSource.collectionManager.defineCollection(collectionOptions);
    }

    return collection;
  }
}
