import { Plugin } from '../../plugin';

export default class Plugin2 extends Plugin {
  async load() {
    this.app.collection({
      name: 'tests',
    });
  }

  getName(): string {
    return 'Plugin2';
  }
}
