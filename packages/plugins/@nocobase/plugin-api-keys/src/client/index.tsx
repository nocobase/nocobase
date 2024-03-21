import { Plugin } from '@nocobase/client';
import { NAMESPACE } from '../constants';
import { Configuration } from './Configuration';

class APIKeysPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'KeyOutlined',
      title: '{{t("API keys", {"ns": "api-keys"})}}',
      Component: Configuration,
      aclSnippet: 'pm.api-keys.configuration',
    });
  }
}

export default APIKeysPlugin;
