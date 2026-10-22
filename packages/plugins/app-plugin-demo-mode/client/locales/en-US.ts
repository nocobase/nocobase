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
    menu: 'Demo account: {{name}}',
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
  settings: {
    title: 'Demo environment',
    refresh: 'Refresh',
    retry: 'Try again',
    busy: 'Demo data is being generated or cleared',
    busyHelp: 'Settings can be saved again once it finishes.',
    disabled: {
      title: 'This application is not a demo',
      help: 'Demo mode is off. A deployment turns it on with NOCOBASE_DEMO_MODE=true.',
    },
    cancel: 'Cancel',
    save: 'Save',
    apply: 'Apply changes',
    unsaved: 'Unsaved changes',
    discardAndReload: 'Discard my changes and reload',
    switch: {
      on: 'On',
      off: 'Off',
    },
    status: {
      enabled: 'Demo enabled',
      help: 'Visitors can open every page, but changes are not saved unless an exception below allows them.',
    },
    tabs: {
      overview: 'Overview',
      schedule: 'Daily reset',
      writes: 'Visitor writes',
      simulation: 'Simulation & AI',
    },
    leave: {
      title: 'Leave without saving?',
      description: 'Changes you have not saved on this page will be lost.',
      stay: 'Keep editing',
      discard: 'Discard changes',
    },
    errors: {
      failed: 'The request did not complete. Try again.',
      conflict: 'Another administrator saved this setting first.',
      busy: 'Demo data is being generated or cleared. Try again when it finishes.',
      exists: 'Demo data is already generated. Reset it instead.',
      demoModeRequired: 'This works only while demo mode is on.',
      accountConflict:
        'A demo username belongs to an account the demo does not own.',
      unavailable: 'This application provides no demo data.',
      signedOut: 'Your session has ended. Sign in again.',
      denied: 'You do not have permission to manage the demo.',
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
      absentSummary:
        'Generate the demo data to fill the application with a story visitors can explore.',
      language: 'Language',
      clear: 'Clear',
      reset: 'Reset',
      generate: 'Generate',
      failed: 'The last run did not finish',
      readOnly:
        'You can view the demo data; generating, resetting and clearing need the manage permission.',
      unavailable: 'No demo data',
      unavailableHelp: 'This application does not register a demo dataset.',
      cleared: 'Demo data cleared',
      resetStarted: 'Resetting the demo data',
      importStarted: 'Generating the demo data',
      confirm: {
        import: {
          title: 'Generate the demo data?',
          description:
            'The demo data is generated in {{language}}, and its demo accounts are turned on.',
        },
        reset: {
          title: 'Reset the demo data?',
          description:
            'All business data in this instance is deleted, including what visitors added, and the demo data is generated again in {{language}}.',
        },
        clear: {
          title: 'Clear the demo data?',
          description:
            'All business data in this instance is deleted, including what visitors added, and the demo accounts are turned off. Settings and administrators stay.',
        },
      },
    },
    visitors: {
      title: 'Demo accounts',
      off: 'Quick sign-in is turned off for this deployment.',
      pending: 'The accounts appear here once the demo data is ready.',
      noData: 'Generate the demo data first; its accounts appear here.',
      credentials: 'Username {{username}} · password {{password}}',
      copyLink: 'Copy link',
      copyLinkFor: 'Copy the entry link for {{name}}',
      openFor: 'Open the demo as {{name}}',
      copied: 'Copied',
      copyFailed: 'Could not copy. Copy the link from the address bar instead.',
    },
    schedule: {
      description:
        'Once a day, delete what visitors changed and generate the demo data again.',
      confirmTitle: 'Save the daily reset?',
      confirmDescription:
        'At the time below, all business data in this instance is deleted and generated again.',
      summary: 'Every day at {{time}} ({{timezone}}), in {{language}}',
      off: 'Not scheduled',
      enabled: 'Reset every day',
      enabledHelp: 'Uses the administrator who generated the demo data last.',
      time: 'Time',
      hour: 'Hour',
      minute: 'Minute',
      language: 'Language',
      timezone: 'Time zone',
      noTimezone: 'No matching time zone',
      invalidTimezone: 'Choose a time zone from the list.',
      next: 'Next reset: {{time}}',
    },
    writes: {
      intro:
        'When Demo Mode is enabled, writes are refused by default. Select the collections visitors need to write; application permissions control operations and record access.',
      allow: 'Allow',
      revoke: 'Refuse again',
      confirmTitle: 'Change what visitors may write?',
      confirmDescription:
        'Visitors’ changes to these become real and stay until the next reset.',
      collections: {
        title: 'Collections',
        description:
          'Requests authorized by the application may write these collections.',
        label: 'Collections visitors may write',
        placeholder: 'Search collections',
        noMatch: 'No matching collection',
        fixed: 'Always writable',
        fixedHelp:
          'Sign-in sessions and the deployment’s own exceptions (NOCOBASE_DEMO_WRITABLE_COLLECTIONS); they cannot be changed here.',
      },
    },
    simulation: {
      kind: {
        model: 'Model',
        tool: 'Tool',
        runner: 'Runner',
      },
      mocks: {
        title: 'Simulations',
        description: 'What answers instead of outside services in this demo.',
        confirmTitle: 'Change the simulations?',
        confirmDescription:
          'A simulation turned off makes that work fail; it is never sent to the real service.',
        empty: 'No simulations registered',
        emptyHelp: 'The application has not registered any simulated service.',
        onHelp: 'Answers with simulated results.',
        offHelp: 'Turned off: the work is refused.',
      },
      chat: {
        title: 'Online chat',
        description: 'Lets visitors talk to the application’s AI.',
        confirmTitle: 'Save the online chat settings?',
        confirmDescription:
          'Visitors’ conversations follow these settings from their next message.',
        confirmLive:
          'A real model answers visitors and every conversation is charged to its model service.',
        enabled: 'Visitors can chat',
        enabledHelp: 'Off: the chat refuses visitors’ messages.',
        model: 'Replies from',
        simulated: 'Simulated model',
        live: 'A real model',
        simulatedHelp: 'Scripted answers; nothing is charged.',
        liveHelp:
          'An existing model service answers; its credentials stay there.',
        service: 'Model service',
        modelId: 'Model',
        cost: 'Every visitor conversation uses this service’s tokens.',
        tools: 'Tools',
        noTools: 'The application declares no chat tools.',
        policy: {
          deny: 'Refuse',
          read: 'Read data',
          mock: 'Simulate',
        },
      },
    },
  },
};
export type DemoModeResource = LocaleResource<typeof resource>;
export default resource;
