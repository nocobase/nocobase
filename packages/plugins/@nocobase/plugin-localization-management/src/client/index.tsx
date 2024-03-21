import { Plugin } from '@nocobase/client';
import { Localization } from './Localization';
import { NAMESPACE } from './locale';

export class LocalizationManagementPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Localization", { ns: "${NAMESPACE}" })}}`,
      icon: 'GlobalOutlined',
      Component: Localization,
      aclSnippet: 'pm.localization-management.localization',
    });
  }
}

export default LocalizationManagementPlugin;
