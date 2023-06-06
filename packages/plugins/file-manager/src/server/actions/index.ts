import actions from '@nocobase/actions';
import { templateCollectionCreate } from './attachments';

export default function ({ app }) {
  app.resourcer.use(templateCollectionCreate);
  app.resourcer.registerActionHandler('upload', actions.create);
}
