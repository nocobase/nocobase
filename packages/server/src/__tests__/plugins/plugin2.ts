import { IPlugin } from '../../plugin';

export default {
  load() {
    this.app.collection({
      name: 'tests',
    });
  },
} as IPlugin;
