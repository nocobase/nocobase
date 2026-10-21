import type { LocaleResource } from '@nocobase/i18n';
const resource = {
  authorization: {
    title: 'Demo data',
    read: 'View',
    manage: 'Import and clear',
    configuration: 'Demo configuration',
    configure: 'Configure',
  },
  refused: {
    title: 'This is a demo. Changes cannot be saved.',
    description: 'Everything else works as usual.',
  },
};
export type DemoModeResource = LocaleResource<typeof resource>;
export default resource;
