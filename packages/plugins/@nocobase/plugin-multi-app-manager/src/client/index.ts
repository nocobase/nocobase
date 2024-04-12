import { Plugin } from '@nocobase/client';
import { MultiAppManagerProvider } from './MultiAppManagerProvider';
import { AppManager } from './AppManager';
import { NAMESPACE } from '../locale';

export class PluginMultiAppManagerClient extends Plugin {
  async load() {
    this.app.use(MultiAppManagerProvider);

    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Multi-app manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'AppstoreOutlined',
      Component: AppManager,
      aclSnippet: 'pm.multi-app-manager.applications',
    });
  }
}

export default PluginMultiAppManagerClient;
export { formSchema, tableActionColumnSchema } from './settings/schemas/applications';
