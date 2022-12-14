import { Plugin } from '@nocobase/server';

export class AppDump extends Plugin {
  beforeLoad() {
    this.app.command('dump').action(async () => {});

    this.app.command('restore').action(async () => {});
  }
}
