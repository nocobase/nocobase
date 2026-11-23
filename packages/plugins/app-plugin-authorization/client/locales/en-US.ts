import optionMessages from '../../locales/en-US.js';
import componentMessages from './components-en-US.js';
import settingsMessages from './settings-en-US.js';
import type { LocaleResource } from '@nocobase/i18n';

// Titles the server side registers in this namespace: the catalog's options and sections, and the built-in
// permission sets the seeds create, and the Roles and permissions pages under `settings`.
const messages: {
  readonly settings: typeof settingsMessages;
  readonly permissionSets: {
    readonly builtIn: { readonly root: string; readonly member: string };
  };
} = {
  settings: settingsMessages,
  permissionSets: {
    builtIn: { root: 'System administrator', member: 'Member' },
  },
};

const enUS: typeof messages & typeof componentMessages & typeof optionMessages =
  {
    ...componentMessages,
    ...messages,
    ...optionMessages,
  };

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AuthorizationResource = LocaleResource<typeof enUS>;

export default enUS;
