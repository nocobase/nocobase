import { Model } from 'sequelize';
import { MetaCollectionOptions } from './meta-collection-options';
import { Database } from '@nocobase/database';
import { FieldOptions } from './collection-manager';

export class CollectionModel {
  model: Model;
  db: Database;

  options: MetaCollectionOptions;
  constructor(model: Model, db: Database) {
    this.model = model;
    this.db = db;
    this.options = new MetaCollectionOptions(model.get('options'));
  }

  async load() {
    const fields = await this.getFields();

    return this.db.collection({
      name: this.options.name,
      fields: fields.map((field) => {
        return { type: field.type, name: field.name };
      }),
    });
  }

  // add field to meta collection
  async addField(fieldSchema: FieldOptions) {
    // @ts-ignore
    await this.model.createField(fieldSchema);
  }

  async getFields() {
    // @ts-ignore
    return await this.model.getFields();
  }
}
