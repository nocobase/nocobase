import { FindOrCreateOptions } from 'sequelize';
import Database, { TableOptions, Model } from '../../../../src';

export class Table extends Model {
  
}

export default (db: Database) => ({
  name: 'tables',
  tableName: 'nocobase_tables',
  model: Table,
  fields: [
    {
      type: 'string',
      name: 'name',
      unique: true,
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'hasMany',
      name: 'fields',
      sourceKey: 'name',
      foreignKey: 'table_name',
    },
  ],
  hooks: {
    async afterCreate(model: Table) {
      const fields: Model[] = await model.getFields();
      const table = db.table({...model.options, fields: fields.map(field => field.options)});
      await table.sync();
    },
    async afterUpdate(model: Table) {
      const fields: Model[] = await model.getFields();
      const table = db.table({...model.options, fields: fields.map(field => field.options)});
      await table.sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    },
    async afterBulkCreate(models: Table[]) {
      await Promise.all(models.map(async (model: any) => {
        const fields: Model[] = await model.getFields();
        const table = db.table({...model.options, fields: fields.map(field => field.options)});
        await table.sync();
      }));
    },
  },
} as TableOptions);
