import type { AppConfigFactory } from '@nocobase/app-server/config';
import {
  defineSecretsConfig,
  type SecretsConfig,
} from '@nocobase/app-server/secrets';

// The master keys, current first, come from config.yml or SECRETS_KEYS; nothing is defaulted here.
const secrets: AppConfigFactory<SecretsConfig> = defineSecretsConfig();

export default secrets;
