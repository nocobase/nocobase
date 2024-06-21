/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseColumnFieldOptions, BelongsToArrayAssociation, Field, Model, RelationField } from '@nocobase/database';

export class BelongsToArrayField extends RelationField {
  get dataType() {
    return 'BelongsToArray';
  }

  init() {
    super.init();
    const { name, foreignKey, ...opts } = this.options;
    this.collection.model.associations[name] = new BelongsToArrayAssociation({
      db: this.database,
      source: this.collection.model,
      as: name,
      foreignKey,
      ...opts,
    }) as any;

    this.listener = async (model: Model, options) => {
      const { values } = options;
      if (values[name] === undefined) {
        return;
      }
      const value: any[] = values[name] || [];
      const tks = value
        .map((item) => (typeof item === 'object' ? item[this.options.targetKey] : item))
        .filter((v) => v);
      model.set(foreignKey, tks);
    };
  }

  bind() {
    this.on('beforeSave', this.listener);
  }

  unbind() {
    delete this.collection.model.associations[this.name];
    this.off('beforeSave', this.listener);
  }
}

export interface BelongsToArrayFieldOptions extends BaseColumnFieldOptions {
  type: 'belongsToArray';
  foreignKey: string;
  target: string;
  targetKey: string;
}
