import { Plugin } from '@nocobase/client';
import { VerificationProviders } from './VerificationProviders';
import { NAMESPACE } from './locale';

export class VerificationPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'CheckCircleOutlined',
      title: `{{t("Verification", { ns: "${NAMESPACE}" })}}`,
      Component: VerificationProviders,
      aclSnippet: 'pm.verification.providers',
    });
  }
}

export default VerificationPlugin;
