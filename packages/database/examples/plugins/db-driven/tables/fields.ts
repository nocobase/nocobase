import Database, { TableOptions, Table } from '../../../../src';

export default (db: Database) => ({
  name: 'fields',
  tableName: 'nocobase_fields',
  fields: [
    {
      type: 'string',
      name: 'table_name',
    },
    {
      type: 'string',
      name: 'name',
      index: {
        fields: ['table_name', 'name'],
        unique: true,
      },
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'belongsTo',
      name: 'table',
      foreignKey: 'table_name',
      targetKey: 'name',
    },
  ],
  hooks: {
    async afterCreate(model: any) {
      if (!model.table_name) {
        return;
      }
      const table = db.getTable(model.table_name);
      table.addField(model.options);
      // console.log(table);
      await table.sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    },
    async afterUpdate(model: any) {
      if (!model.table_name) {
        return;
      }
      const table = db.getTable(model.table_name);
      table.addField(model.options);
      await table.sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    },
    async afterBulkCreate(models) {
      const tables = new Map<string, Table>();
      for (const model of new Map<string, any>(Object.entries(models)).values()) {
        if (!model.table_name) {
          return;
        }
        const table = db.getTable(model.table_name);
        table.addField(model.options);
        tables.set(table.getName(), table);
      }
      for (const table of tables.values()) {
        await table.sync({
          force: false,
          alter: {
            drop: false,
          }
        });
      }
    },
  }
} as TableOptions);
