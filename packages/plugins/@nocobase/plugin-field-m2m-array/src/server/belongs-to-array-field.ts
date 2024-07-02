/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, BelongsToArrayAssociation, Model, RelationField } from '@nocobase/database';

export class BelongsToArrayField extends RelationField {
  get dataType() {
    return 'BelongsToArray';
  }

  private setForeignKeyArray = async (model: Model, { values, transaction }) => {
    const { name, foreignKey, target, targetKey } = this.options;
    if (!values || values[name] === undefined) {
      return;
    }
    const value: any[] = values[name] || [];
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
    const toCreate = items.filter((item) => !item[targetKey] || !tks.includes(item[targetKey]));
    const m = this.database.getModel(target);
    const newInstances = await m.bulkCreate(toCreate, { transaction });
    tks.push(...newInstances.map((instance: Model) => instance[targetKey]));
    model.set(foreignKey, tks);
  };

  init() {
    super.init();
    const { name, ...opts } = this.options;
    this.collection.model.associations[name] = new BelongsToArrayAssociation({
      db: this.database,
      source: this.collection.model,
      as: name,
      ...opts,
    }) as any;
  }

  bind() {
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
