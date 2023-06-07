import actions from '@nocobase/actions';
import { createMiddleware, destroyMiddleware } from './attachments';

export default function ({ app }) {
  app.resourcer.use(createMiddleware);
  app.resourcer.registerActionHandler('upload', actions.create);

  app.resourcer.use(destroyMiddleware);
}
