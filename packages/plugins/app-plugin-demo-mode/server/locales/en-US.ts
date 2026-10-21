import type { LocaleResource } from '@nocobase/i18n';
const resource = {
  authorization: {
    title: 'Demo data',
    read: 'View',
    manage: 'Import and clear',
    configuration: 'Demo configuration',
    configure: 'Configure',
  },
  errors: {
    readOnly: 'This is a demo. Changes cannot be saved.',
  },
};
export type DemoModeResource = LocaleResource<typeof resource>;
export default resource;
