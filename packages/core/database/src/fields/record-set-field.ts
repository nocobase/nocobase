import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';
import Database from '../database';
import { Model } from '../model';

export class RecordSetAssociation {
  db: Database;
  associationType: string;
  source: Model;
  sourceKey: string;
  targetName: string;
  targetKey: string;
  identifierField: string;
  as: string;

  constructor(options: { db: Database; source: Model; sourceKey: string; target: string; targetKey: string }) {
    const { db, source, sourceKey, target, targetKey } = options;
    this.associationType = 'RecordSet';
    this.db = db;
    this.source = source;
    this.sourceKey = sourceKey;
    this.targetName = target;
    this.targetKey = targetKey;
    this.identifierField = 'test';
    this.as = sourceKey;
  }

  get target() {
    return this.db.getModel(this.targetName);
  }
}

export class RecordSetField extends Field {
  get dataType() {
    const dialect = this.database.sequelize.getDialect();
    // const { target, targetKey } = this.options;
    // const targetCollection = this.context.database.getCollection(target);
    // const targetField = targetCollection.getField(targetKey);
    if (dialect === 'postgres') {
      return DataTypes.ARRAY(DataTypes.INTEGER);
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
      const tks = value.map((item) => item[this.options.targetKey]);
      model.set(name, tks);
    };
  }

  bind() {
    super.bind();
    this.on('beforeSave', this.listener);
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
