import actions from '@nocobase/actions';
import { middleware } from './attachments';

export default function ({ app }) {
  app.resourcer.use(middleware);
  app.resourcer.registerActionHandler('upload', actions.create);
}
