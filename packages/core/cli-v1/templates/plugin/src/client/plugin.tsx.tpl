import { Plugin } from '@nocobase/client';
import models from './models';

export class {{{pascalCaseName}}}Client extends Plugin {
  async load() {
    this.flowEngine.registerModels(models);
  }
}

export default {{{pascalCaseName}}}Client;
