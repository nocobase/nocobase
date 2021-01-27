import afterCreate from './after-create';
import beforeUpdate from './before-update';

export function addAll(Model) {
  console.log(Model);
  Model.addHook('afterCreate', afterCreate);
  // Model.addHook('afterBulkCreate', hooks.afterBulkCreate);
  Model.addHook('beforeUpdate', beforeUpdate);
  // Model.addHook('beforeDestroy', beforeDestroy);
}
