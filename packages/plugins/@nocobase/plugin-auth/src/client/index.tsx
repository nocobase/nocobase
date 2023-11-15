import { Plugin } from '@nocobase/client';
import { AuthPluginProvider } from './AuthPluginProvider';
import { AuthProvider } from './AuthProvider';
import { NAMESPACE } from './locale';
import { Authenticator } from './settings/Authenticator';

export class AuthPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'LoginOutlined',
      title: `{{t("Authentication", { ns: "${NAMESPACE}" })}}`,
      Component: Authenticator,
      aclSnippet: 'pm.auth.authenticators',
    });
    this.app.providers.unshift([AuthProvider, {}]);
    this.app.use(AuthPluginProvider);
  }
}

export default AuthPlugin;
