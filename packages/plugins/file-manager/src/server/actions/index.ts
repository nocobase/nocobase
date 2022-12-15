import { multipart, create } from './attachments';



export default function ({ app }) {
  app.resource({
    name: 'attachments',
    actions: {
      create: {
        middleware: multipart,
        handler: create
      }
    }
  });

  app.resource({
    name: 'storages.attachments',
    actions: {
      create: {
        middleware: multipart,
        handler: create
      }
    }
  });
}
