import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, Database, Model } from '@nocobase/database';

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
  private binded = false;

  get targetCollection() {
    return this.database.getCollection(this.options.target);
  }

  get dataType() {
    const dialect = this.database.sequelize.getDialect();
    const { targetKey } = this.options;
    const targetField = this.targetCollection.getField(targetKey);
    if (dialect === 'postgres') {
      console.log('=====', targetField.dataType);
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
