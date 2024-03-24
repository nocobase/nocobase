import actions from '@nocobase/actions';
import { createMiddleware, destroyMiddleware } from './attachments';

export default function ({ app }) {
  app.resourcer.use(createMiddleware, { tag: 'createMiddleware', after: 'auth' });
  app.resourcer.registerActionHandler('upload', actions.create);

  app.resourcer.use(destroyMiddleware);
}
