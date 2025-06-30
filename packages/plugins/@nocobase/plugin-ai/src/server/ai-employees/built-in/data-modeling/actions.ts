/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import _ from 'lodash';

export const defineCollections = async (ctx: Context, next: Next) => {
  const { collections } = ctx.action.params.values || {};
  const id = {
    name: 'id',
    type: 'bigInt',
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    uiSchema: {
      type: 'number',
      title: '{{t("ID")}}',
      'x-component': 'InputNumber',
      'x-read-pretty': true,
    },
    interface: 'integer',
  };
  const createdAt = {
    name: 'createdAt',
    interface: 'createdAt',
    type: 'date',
    field: 'createdAt',
    uiSchema: {
      type: 'datetime',
      title: '{{t("Created at")}}',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
    },
  };
  const updatedAt = {
    type: 'date',
    field: 'updatedAt',
    name: 'updatedAt',
    interface: 'updatedAt',
    uiSchema: {
      type: 'datetime',
      title: '{{t("Last updated at")}}',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
    },
  };
  for (const options of collections) {
    if (options.name === 'users') {
      continue;
    }
    if (options.autoGenId !== false && !options.isThrough) {
      options.autoGenId = false;
      options.fields.unshift(id);
    }
    if (options.createdAt !== false) {
      options.fields.push(createdAt);
    }
    if (options.updatedAt !== false) {
      options.fields.push(updatedAt);
    }
    const primaryKey = options.fields.find((field: any) => field.primaryKey);
    if (!options.filterTargetKey) {
      options.filterTargetKey = primaryKey?.name || 'id';
    }
    // omit defaultValue
    options.fields = options.fields.map((field: any) => {
      return _.omit(field, ['defaultValue']);
    });
    const transaction = await ctx.app.db.sequelize.transaction();
    try {
      const repo = ctx.db.getRepository('collections');
      const collection = await repo.findOne({
        filter: {
          name: options.name,
        },
        transaction,
      });
      if (!collection) {
        const collection = await repo.create({
          values: options,
          transaction,
          context: ctx,
        });
        // await collection.load({ transaction });
        await transaction.commit();
        continue;
      }
      await repo.update({
        filterByTk: collection.name,
        values: {
          ...options,
          fields: options.fields?.map((f: any) => {
            delete f.key;
            return f;
          }),
        },
        updateAssociationValues: ['fields'],
        transaction,
      });
      await collection.loadFields({
        transaction,
      });
      await collection.load({ transaction, resetFields: true });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  await next();
};
