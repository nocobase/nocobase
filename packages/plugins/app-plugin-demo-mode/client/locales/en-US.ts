import type { LocaleResource } from '@nocobase/i18n';
const resource = {
  authorization: {
    title: 'Demo data',
    read: 'View',
    manage: 'Generate and clear',
    configuration: 'Demo configuration',
    configure: 'Configure',
  },
  menu: {
    label: 'Demo mode',
    switchAccount: 'Switch account',
    title: 'This is a demo environment',
    description: 'Data resets automatically every day. Changes are not saved.',
    accountsDescription:
      'Switch to an account below to see what each role can access.',
    loading: 'Loading accounts…',
  },
  accounts: {
    title: 'Accounts',
    description:
      'Enter the demo as any of these accounts to see what each of them sees.',
    enter: 'Enter',
    current: 'Current',
    entering: 'Entering…',
    failed: 'Could not enter this account.',
    unavailable: 'No accounts can be entered right now.',
    password: 'Sign in with a password',
  },
  refused: {
    title: 'This is a demo. Changes cannot be saved.',
    description: 'Everything else works as usual.',
  },
  settings: {
    title: 'Demo environment',
    refresh: 'Refresh',
    retry: 'Try again',
    busy: 'Demo data is being generated or cleared',
    busyHelp: 'Please wait for the current data operation to finish.',
    disabled: {
      title: 'This application is not a demo',
      help: 'Demo mode is off. A deployment turns it on with NOCOBASE_DEMO_MODE=true.',
    },
    errors: {
      failed: 'The request did not complete. Try again.',
      demoModeRequired: 'This works only while demo mode is on.',
      signedOut: 'Your session has ended. Sign in again.',
      denied: 'You do not have permission to view the demo settings.',
    },
    data: {
      title: 'Demo data',
      state: {
        importing: 'Generating',
        clearing: 'Clearing',
        resetting: 'Resetting',
        failed: 'Failed',
        ready: 'Ready',
        none: 'Not generated',
      },
      presentSummary: 'Generated in {{language}} · {{time}}',
      resettingSummary:
        'Clearing the current data, then generating it again in {{language}}.',
      phase: {
        clearing: 'Clearing',
        generating: 'Generating again',
      },
      absentSummary: 'No demo data has been generated yet.',
      failed: 'The last run did not finish',
      unavailable: 'No demo data',
      unavailableHelp: 'This application does not register a demo dataset.',
    },
    visitors: {
      unavailable: 'No accounts can be entered right now.',
      title: 'Accounts',
      username: 'Username {{username}}',
      copyLink: 'Copy link',
      copyLinkFor: 'Copy the entry link for {{name}}',
      openFor: 'Open the demo as {{name}}',
      copied: 'Copied',
      copyFailed: 'Could not copy. Copy the link from the address bar instead.',
    },
    schedule: {
      title: 'Daily reset',
      description:
        'Demo data resets automatically every day. The schedule is configured through environment variables.',
      time: 'Time',
      language: 'Language',
      timezone: 'Time zone',
      next: 'Next reset: {{time}}',
    },
  },
};
export type DemoModeResource = LocaleResource<typeof resource>;
export default resource;
