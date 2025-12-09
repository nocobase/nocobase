/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, BelongsToArrayAssociation, Model, RelationField } from '@nocobase/database';
import _ from 'lodash';

export const elementTypeMap = {
  nanoid: 'string',
  sequence: 'string',
  uid: 'string',
};

export class BelongsToArrayField extends RelationField {
  get dataType() {
    return 'BelongsToArray';
  }

  private setForeignKeyArray = async (model: Model, { values, transaction, inputValues }) => {
    const { type, name, foreignKey, target, targetKey } = this.options;
    if (type !== 'belongsToArray') {
      return;
    }
    let value: any[] | undefined;
    const valuesInParams = (inputValues ?? values ?? {})[name];
    if (valuesInParams !== undefined) {
      value = _.castArray(valuesInParams || []);
    } else {
      return;
    }

    if (value.length === 0) {
      model.set(foreignKey, []);
      return;
    }

    const tks = [];
    const items = [];
    for (const item of value) {
      if (typeof item !== 'object') {
        tks.push(item);
        continue;
      }
      items.push(item);
    }
    const repo = this.database.getRepository(target);
    const itemTks = items.map((item) => item[targetKey]).filter((tk) => tk);
    const instances = await repo.find({
      filter: {
        [targetKey]: itemTks,
      },
      transaction,
    });
    tks.push(...instances.map((instance: Model) => instance[targetKey]));

    const m = this.database.getModel(target);

    const toCreate = items.filter((item) => !item[targetKey] || !tks.includes(item[targetKey]));
    const newInstances = await m.bulkCreate(toCreate, { transaction });
    tks.push(...newInstances.map((instance: Model) => instance[targetKey]));

    const toUpdate = items.filter((item) => item[targetKey] && tks.includes(item[targetKey]));
    for (const item of toUpdate) {
      await m.update(item, {
        where: {
          [targetKey]: item[targetKey],
        },
        transaction,
      });
    }

    model.set(foreignKey, tks);
  };

  checkTargetCollection() {
    const { target } = this.options;
    if (!target) {
      throw new Error('Target is required in the options of many to many (array) field.');
    }
    const targetCollection = this.database.getCollection(target);
    if (!targetCollection) {
      this.database.addPendingField(this);
      return false;
    }
    return true;
  }

  checkAssociationKeys() {
    const { foreignKey, target, targetKey } = this.options;

    if (!targetKey) {
      throw new Error('Target key is required in the options of many to many (array) field.');
    }

    const targetField = this.database.getModel(target).getAttributes()[targetKey];
    const foreignField = this.collection.model.getAttributes()[foreignKey];
    if (!foreignField || !targetField) {
      return;
    }
    const foreignType = foreignField.type.constructor.toString();
    if (!['ARRAY', 'JSONTYPE', 'JSON', 'JSONB'].includes(foreignType)) {
      throw new Error(
        `The type of foreign key "${foreignKey}" in collection "${this.collection.name}" must be ARRAY, JSON or JSONB`,
      );
    }

    if (this.database.sequelize.getDialect() !== 'postgres') {
      return;
    }

    const targetType = targetField.type.constructor.toString();
    const elementType = (foreignField.type as any).type.constructor.toString();
    if (foreignType === 'ARRAY' && elementType !== targetType) {
      throw new Error(
        `The element type "${elementType}" of foreign key "${foreignKey}" does not match the type "${targetType}" of target key "${targetKey}" in collection "${target}"`,
      );
    }
  }

  bind() {
    if (!this.checkTargetCollection()) {
      return false;
    }
    this.checkAssociationKeys();
    const { name, ...opts } = this.options;
    this.collection.model.associations[name] = new BelongsToArrayAssociation({
      db: this.database,
      source: this.collection.model,
      as: name,
      ...opts,
    }) as any;
    this.on('beforeSave', this.setForeignKeyArray);
  }

  unbind() {
    delete this.collection.model.associations[this.name];
    this.off('beforeSave', this.setForeignKeyArray);
  }
}

export interface BelongsToArrayFieldOptions extends BaseColumnFieldOptions {
  type: 'belongsToArray';
  foreignKey: string;
  target: string;
  targetKey: string;
}
