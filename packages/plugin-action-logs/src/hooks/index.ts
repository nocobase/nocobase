import afterCreate from './after-create';
import afterUpdate from './after-update';
import afterDestroy from './after-destroy';

export function addAll(Model) {
  Model.addHook('afterCreate', afterCreate);
  // Model.addHook('afterBulkCreate', hooks.afterBulkCreate);
  Model.addHook('afterUpdate', afterUpdate);
  Model.addHook('afterDestroy', afterDestroy);
}
