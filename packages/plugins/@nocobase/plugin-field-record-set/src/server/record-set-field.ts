/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, Model, RecordSetAssociation } from '@nocobase/database';

export class RecordSetField extends Field {
  private binded = false;

  get targetCollection() {
    return this.database.getCollection(this.options.target);
  }

  get dataType() {
    const dialect = this.database.sequelize.getDialect();
    const { targetKey } = this.options;
    const targetField = this.targetCollection.getField(targetKey);
    if (dialect === 'postgres') {
      return DataTypes.ARRAY(targetField.dataType);
    }
    return DataTypes.JSON;
  }

  init() {
    super.init();
    const { name, ...opts } = this.options;
    this.collection.model.associations[name] = new RecordSetAssociation({
      db: this.database,
      source: this.collection.model,
      sourceKey: name,
      ...opts,
    }) as any;

    this.listener = async (model: Model) => {
      if (!model.changed(name as any)) {
        return;
      }
      const value: any[] = model.get(name) || [];
      const tks = value
        .map((item) => (typeof item === 'object' ? item[this.options.targetKey] : item))
        .filter((v) => v);
      model.set(name, tks);
    };
  }

  bind() {
    if (this.binded) {
      return;
    }
    this.on('beforeSave', this.listener);
    if (this.targetCollection) {
      super.bind();
      this.binded = true;
      return;
    }
    this.database.on('collection:loaded', async ({ collection }) => {
      if (collection.name === this.options.target) {
        super.bind();
        this.binded = true;
      }
    });
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.listener);
  }
}

export interface RecordSetFieldOptions extends BaseColumnFieldOptions {
  type: 'recordSet';
  target: string;
  targetKey: string;
}
