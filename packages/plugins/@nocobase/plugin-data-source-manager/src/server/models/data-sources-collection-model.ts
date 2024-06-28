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
import { Transaction } from 'sequelize';

export class DataSourcesCollectionModel extends MagicAttributeModel {
  async load(loadOptions: { app: Application; transaction: Transaction }) {
    const { app, transaction } = loadOptions;

    const collectionFields = await this.getFields({ transaction });

    const collectionOptions = this.get();
    collectionOptions.fields = collectionFields;

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
    } else {
      dataSource.collectionManager.defineCollection(collectionOptions);
    }

    return collection;
  }
}
