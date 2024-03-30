import { Plugin } from '@nocobase/client';
import { NAMESPACE } from '../constants';
import { Configuration } from './Configuration';

export class PluginAPIKeysClient extends Plugin {
  async load() {
    this.pluginSettingsManager.add(NAMESPACE, {
      icon: 'KeyOutlined',
      title: this.t('API keys'),
      Component: Configuration,
      aclSnippet: 'pm.api-keys.configuration',
    });
  }
}

export default PluginAPIKeysClient;
