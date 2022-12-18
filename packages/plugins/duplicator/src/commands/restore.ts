import { Application } from '@nocobase/server';

export default function addRestoreCommand(app: Application) {
  app.command('restore').action(async () => {});
}
