import { IPlugin } from '../../plugin';

export default {
  load() {
    this.app.db.table({
      name: 'tests',
    });
  }
} as IPlugin;
