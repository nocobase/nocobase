import { hookFactory } from './factory';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';

async function remove({ schemaInstance, options, db }) {
  const uiSchemaRepository: UiSchemaRepository = db.getRepository('ui_schemas');
  await uiSchemaRepository.remove(schemaInstance.get('uid'));
}

export default hookFactory('onCollectionDestroy', 'remove', remove);
