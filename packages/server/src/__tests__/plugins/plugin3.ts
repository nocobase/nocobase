import { Plugin } from '../../plugin';

export default class Plugin3 extends Plugin {
  async load() {
    this.app.collection({
      name: 'tests',
    });
  }
}
