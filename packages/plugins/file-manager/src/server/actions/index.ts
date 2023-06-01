import { attachmentCreate, templateCollectionCreate } from './attachments';

export default function ({ app }) {
  app.resource({
    name: 'attachments',
    actions: {
      create: attachmentCreate,
    },
  });

  app.resource({
    name: 'storages.attachments',
    actions: {
      create: attachmentCreate,
    },
  });

  app.resourcer.use(templateCollectionCreate);
}
