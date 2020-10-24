import path from 'path';
import Database, { Model } from '../../../src';

export default (options?: any) => {
  return async (db: Database) => {
    const tables = db.import({
      directory: path.resolve(__dirname, 'tables'),
    });

    await db.sync({ tables });

    const Table = db.getModel('tables');
    const items = await Table.findAll();

    await Promise.all(items.map(async item => {
      const fields: Model[] = await item.getFields();
      const table = db.table({
        ...item.options,
        fields: fields.map(field => field.options),
      });
    }));

    await db.sync({ tables: items.map(item => item.name) });
  }
}