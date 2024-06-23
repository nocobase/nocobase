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
    if (values[name] === undefined) {
      return;
    }
    const value: any[] = values[name] || [];
    const tks = [];
    for (const item of value) {
      if (typeof item !== 'object') {
        tks.push(item);
        continue;
      }
      let tk = item[targetKey];
      if (!tk) {
        const newInstance = await this.database.getRepository(target).create({
          values: item,
          transaction,
        });
        tk = newInstance.get(targetKey);
      }
      tks.push(tk);
    }
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
