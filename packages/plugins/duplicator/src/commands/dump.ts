import { Application } from '@nocobase/server';

export default function addDumpCommand(app: Application) {
  app.command('dump').action(async () => {
    const uiCollections = ['uiSchemas', 'uiSchemaTreePath', 'uiSchemaTemplates', 'uiSchemaServerHooks'];

    console.log('uiCollections', uiCollections);

    await app.stop();
  });
}
