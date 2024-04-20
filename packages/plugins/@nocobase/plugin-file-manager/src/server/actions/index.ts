import actions from '@nocobase/actions';
import { createMiddleware, destroyMiddleware } from './attachments';
import * as storageActions from './storages';

export default function ({ app }) {
  app.resourcer.define({
    name: 'storages',
    actions: storageActions,
  });
  app.resourcer.use(createMiddleware, { tag: 'createMiddleware', after: 'auth' });
  app.resourcer.registerActionHandler('upload', actions.create);

  app.resourcer.use(destroyMiddleware);
}
