import { Plugin } from '@nocobase/server';

export class Duplicator extends Plugin {
  beforeLoad() {
    this.app.command('dump').action(async () => {});

    this.app.command('restore').action(async () => {});
  }
}
