import { InstallOptions, Plugin } from '@nocobase/server';
import path from 'path';
import { textTranslationActions } from './actions/textTranslation';
import { TRANSLATION_ALIAS } from './constant';

export class LocalizationManagementPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.app.resourcer.define({
      name: TRANSLATION_ALIAS,
      actions: textTranslationActions,
    });

    this.app.acl.allow(TRANSLATION_ALIAS, '*', 'loggedIn');
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.providers`,
      actions: ['localization_management_providers:*'],
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default LocalizationManagementPlugin;
