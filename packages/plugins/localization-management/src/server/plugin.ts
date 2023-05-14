import { InstallOptions, Plugin } from '@nocobase/server';
import path from 'path';
import { textTranslationActions } from './actions/textTranslation';
import { TEXT_TRANSLATION_NAME_SPACE } from './constant';

export class LocalizationManagementPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.app.resourcer.define({
      name: TEXT_TRANSLATION_NAME_SPACE,
      actions: textTranslationActions,
    });

    this.app.acl.allow(TEXT_TRANSLATION_NAME_SPACE, '*', 'loggedIn');
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
