import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { NumberToWordsField } from './numberToWordsFields';

export class PluginFieldNumberToWordsServer extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.db.registerFieldTypes({
      numberToWords: NumberToWordsField,
    });
  }

  async load() {}

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldNumberToWordsServer;
