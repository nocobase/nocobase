import { Plugin } from '@nocobase/client';
import { NAMESPACE } from '../constants';
import { Configuration } from './Configuration';
import apiKeysCollection from '../collections/api-keys';

class APIKeysPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'KeyOutlined',
      title: '{{t("API keys", {"ns": "api-keys"})}}',
      Component: Configuration,
      aclSnippet: 'pm.api-keys.configuration',
    });

    this.collectionManager.addCollections([apiKeysCollection]);
  }
}

export default APIKeysPlugin;
