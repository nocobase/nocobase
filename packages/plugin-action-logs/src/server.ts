import path from 'path';

import { addAll } from './hooks';

export default async function() {
  const { database } = this;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  // 为所有的表都加上日志的 hooks
  database.addHook('afterTableInit', function (table) {
    if (['action_logs', 'action_changes'].includes(table.options.name)) {
      return;
    }
    const Model = database.getModel(table.options.name);
    addAll(Model);
  });
}
