/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Model } from '@nocobase/database';
import { Application } from '@nocobase/server';
import _ from 'lodash';

export const syncExternalJSONCollection = (app: Application, db: Database) => {
  return async (model: Model, { transaction }) => {
    const { interface: fieldInterface, key, fields, dataSourceKey } = model.get();
    if (!['JSONDocObject', 'JSONDocArray'].includes(fieldInterface)) {
      return;
    }
    if (!fields) {
      return;
    }
    model.set('options', _.omit(model.get('options'), ['fields']));
    const target = `${key}_json_collection`;
    const targetKey = '__json_index';
    const repo = db.getRepository('dataSourcesCollections');
    let targetModel = await repo.findOne({
      filterByTk: target,
      transaction,
    });
    if (!targetModel) {
      fields.push({
        interface: 'id',
        title: 'Index',
        type: 'bigInt',
        name: targetKey,
        uiSchema: {
          type: 'number',
          title: '{{t("Index")}}',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      });
      targetModel = await repo.create({
        values: {
          title: target,
          name: target,
          json: true,
          sync: false,
          introspected: true,
          hidden: true,
          fields,
          filterTargetKey: targetKey,
          dataSourceKey,
        },
        transaction,
      });
      await targetModel.load({ app, transaction });
      model.set('options', Object.assign(model.get('options'), { target, targetKey }));
      return;
    }
    const existFields = await targetModel.getFields({ transaction });
    const deletedFields = existFields.filter(
      (field: any) => field.name !== targetKey && !fields.find((f: any) => f.name === field.name),
    );
    for (const field of deletedFields) {
      await field.destroy({ transaction });
    }
    const indexField = existFields.find((field: any) => field.name === targetKey);
    [targetModel] = await repo.update({
      filterByTk: target,
      values: {
        fields: [indexField.dataValues, ...fields],
      },
      updateAssociationValues: ['fields'],
      transaction,
    });
    await targetModel.load({ app, transaction });
  };
};
