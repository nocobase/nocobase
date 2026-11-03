import {
  defineMailersConfig,
  mailerEnvironment,
} from '@nocobase/app-server/mailers/config';

// These mappings are explicit and discoverable through `nocobase config env`.
// An empty section leaves email unavailable until an operator configures a named service.
export default defineMailersConfig({
  defaults: {},
  env: { ...mailerEnvironment('system', 'MAILERS_SYSTEM') },
});
