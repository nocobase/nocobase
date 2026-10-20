import optionMessages from '../../locales/en-US.js';
import type { LocaleResource } from '@nocobase/i18n';

// Titles the server side registers in this namespace: the catalog's options and sections, and the built-in
// permission sets the seeds create. The plugin ships no pages, so nothing else is translated on the client.
const messages = {
  permissionSets: {
    builtIn: { root: 'System administrator', member: 'Member' },
  },
};

const enUS: typeof messages & typeof optionMessages = {
  ...messages,
  ...optionMessages,
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AuthorizationResource = LocaleResource<typeof enUS>;

export default enUS;
