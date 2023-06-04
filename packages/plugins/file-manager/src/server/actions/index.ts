import { attachmentCreate, templateCollectionCreate } from './attachments';

export default function ({ app }) {
  app.resource({
    name: 'attachments',
    actions: {
      create: attachmentCreate,
      // @Deprecated
      upload: attachmentCreate,
    },
  });

  app.resourcer.use(templateCollectionCreate);
}
