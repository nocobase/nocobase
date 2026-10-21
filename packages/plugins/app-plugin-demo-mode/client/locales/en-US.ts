import type { LocaleResource } from '@nocobase/i18n';
const resource = {
  authorization: {
    title: 'Demo data',
    read: 'View',
    manage: 'Generate and clear',
    configuration: 'Demo configuration',
    configure: 'Configure',
  },
  accounts: {
    title: 'Demo accounts',
    description:
      'Enter the demo as any of these accounts to see what each of them sees.',
    enter: 'Enter',
    signedInAs: 'Signed in as {{name}} · Switch',
    current: 'Current',
    entering: 'Entering…',
    failed: 'Could not enter this demo account.',
    unavailable: 'No demo accounts can be entered right now.',
    password: 'Sign in with a password',
  },
  refused: {
    title: 'This is a demo. Changes cannot be saved.',
    description: 'Everything else works as usual.',
  },
};
export type DemoModeResource = LocaleResource<typeof resource>;
export default resource;
