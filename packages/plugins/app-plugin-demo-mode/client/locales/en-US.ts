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
  settings: {
    title: 'Demo environment',
    refresh: 'Refresh',
    retry: 'Try again',
    busy: 'Demo data is being generated or cleared',
    busyHelp: 'Settings can be saved again once it finishes.',
    disabled: {
      title: 'This application is not a demo',
      help: 'Demo mode is off. A deployment turns it on with NOCOBASE_DEMO_MODE.',
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
    mode: {
      readOnly: 'Read-only',
      observe: 'Observe',
      readOnlyHelp:
        'Visitors can open every page, but changes are not saved unless an exception below allows them.',
      observeHelp:
        'Nothing is refused: writes that read-only mode would refuse are only logged, to find what to allow.',
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
        failed: 'Failed',
        ready: 'Ready',
        none: 'Not generated',
      },
      presentSummary: 'Generated in {{language}} · {{time}}',
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
      title: 'Visitor entry',
      description:
        'Visitors enter any of these accounts without a password and can switch between them from the corner of every page.',
      off: 'Quick sign-in is turned off for this deployment (NOCOBASE_DEMO_QUICK_SIGN_IN=false).',
      noData: 'Generate the demo data first; its accounts appear here.',
      credentials: 'Username {{username}} · password {{password}}',
      copyLink: 'Copy link',
      copyLinkFor: 'Copy the entry link for {{name}}',
      openFor: 'Open the demo as {{name}}',
      copied: 'Copied',
      copyFailed: 'Could not copy. Copy the link from the address bar instead.',
      embed: 'Embed in a web page',
      copyEmbed: 'Copy the embed code',
      embedHelp:
        'The page must be on the same site as this demo, such as another subdomain of its domain; otherwise the browser does not keep visitors signed in inside the frame.',
    },
    schedule: {
      title: 'Daily reset',
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
        'In read-only mode every change is refused. Open only what visitors need to try, and only for records the demo owns; business permissions still apply.',
      allow: 'Allow',
      revoke: 'Refuse again',
      scope: 'Scope',
      confirmTitle: 'Change what visitors may write?',
      confirmDescription:
        'Visitors’ changes to these become real and stay until the next reset.',
      operation: {
        insert: 'Create',
        update: 'Edit',
        delete: 'Delete',
      },
      capabilities: {
        title: 'Business operations',
        description:
          'Operations the application marked as safe to open, each limited to a scope.',
        empty: 'No operations registered',
        emptyHelp:
          'The application has not registered any operation that may be opened in a demo.',
      },
      tables: {
        title: 'Tables',
        description:
          'Any authorized request may write these tables. Use it for state nobody can misuse, such as view preferences.',
        label: 'Tables visitors may write',
        placeholder: 'Search tables',
        noMatch: 'No matching table',
        fixed: 'Always writable',
        fixedHelp:
          'Sign-in sessions and the deployment’s own exceptions (NOCOBASE_DEMO_ALLOW_TABLES); they cannot be changed here.',
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
