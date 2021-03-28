import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  await api.database.getModel('collections').load({ skipExisting: true });
  const database: Database = api.database;
  const [Field] = database.getModels(['fields']);

  const fields = await Field.findAll({
    where: {
      interface: 'multipleSelect',
    },
  });

  for (const field of fields) {
    const M = database.getModel(field.collection_name);
    const models = await M.findAll();
    for (const model of models) {
      let value = model.get(field.name);
      if (!value) {
        continue;
      }
      if (!Array.isArray(value)) {
        value = [value];
      }
      model.set(field.name, value);
      await model.save();
      console.log(field.name, value);
    }
  }
})();
