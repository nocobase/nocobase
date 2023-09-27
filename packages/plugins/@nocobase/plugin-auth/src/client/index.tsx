import { Plugin } from '@nocobase/client';
import { AuthProvider } from './AuthProvider';
import { Authenticator } from './settings/Authenticator';
import { NAMESPACE } from './locale';

export class AuthPlugin extends Plugin {
  async load() {
    this.app.use(AuthProvider);

    this.app.settingsCenter.add(NAMESPACE, {
      icon: 'LoginOutlined',
      title: `{{t("Authentication", { ns: "${NAMESPACE}" })}}`,
      Component: Authenticator,
      aclSnippet: 'pm.auth.authenticators',
    });
  }
}

export default AuthPlugin;
