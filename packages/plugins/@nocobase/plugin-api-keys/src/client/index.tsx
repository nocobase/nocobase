import { Plugin } from '@nocobase/client';
import { Configuration } from './Configuration';
import { NAMESPACE } from '../constants';

class APIKeysPlugin extends Plugin {
  async load() {
    this.app.settingsCenter.add(NAMESPACE, {
      icon: 'EnvironmentOutlined',
      title: '{{t("API keys")}}',
      Component: Configuration,
      aclSnippet: 'pm.api-keys.configuration',
    });
  }
}

export default APIKeysPlugin;
