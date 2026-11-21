// Every visible string of the API keys pages, and the titles the server registers in this namespace.
const enUS = {
  navigation: {
    personal: 'API keys',
  },
  permissions: {
    apiKeys: 'API keys',
    personalApiKeys: 'Personal API keys',
    read: 'Open page (view system keys and members’ personal keys)',
    manage: 'Manage system keys',
    create: 'Create personal API keys',
    humanOnly: 'Keys never manage keys: only a person may do this.',
  },
  roles: {
    personalKeyCreators: 'Personal API key creators',
  },
  templates: {
    readOnly: 'Read only',
  },
  common: {
    sameAsMe: 'Same as me',
    custom: 'Custom',
    never: 'Never expires',
    neverUsed: 'Never used',
    expired: 'Expired',
    disabled: 'Disabled',
    daysLeft_one: '{{count}} day left',
    daysLeft_other: '{{count}} days left',
    expiresSoon_one: 'Expires in {{count}} day',
    expiresSoon_other: 'Expires in {{count}} days',
    createdOn: 'Created {{date}}',
    permissionsCount_one: '{{count}} permission',
    permissionsCount_other: '{{count}} permissions',
    objectsCount_one: 'on {{count}} object',
    objectsCount_other: 'on {{count}} objects',
    recordsLimited_one: '{{count}} selected record',
    recordsLimited_other: '{{count}} selected records',
    cancel: 'Cancel',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Could not copy. Select the text and copy it yourself.',
    loadFailed: 'Could not load. Try again.',
    retry: 'Try again',
    notFound: 'This key does not exist, or it is not yours.',
  },
  personal: {
    title: 'API keys',
    description:
      'A personal key calls the API as you, and never does more than you can do today. When you leave or are disabled, your keys stop working. For an integration that should outlive any member, ask an administrator for a system key.',
    myKeys: 'My keys',
    count_one: '{{count}} key',
    count_other: '{{count}} keys',
    newKey: 'New key',
    empty: 'You have no API keys yet.',
    emptyCannotCreate:
      'You have no API keys, and your role does not let you create one.',
    cannotCreate:
      'Your role does not let you create keys. You can still view and revoke the ones you have.',
    columns: {
      name: 'Name',
      scope: 'What it can do',
      expiry: 'Expiry',
      lastUsed: 'Last used',
    },
    rotate: 'Rotate',
    revoke: 'Revoke',
    open: 'Open',
    reminderSameAsMe:
      '“{{name}}” has the same permissions as you: if it leaks, someone can act as you, account included. Revoke it unless a trusted local script needs it.',
    reminderIdle:
      '“{{name}}” has not been used for {{days}} days. Revoke it if nothing needs it.',
    revokeTitle: 'Revoke “{{name}}”?',
    revokeDescription:
      'Whatever uses this key stops working at once. This cannot be undone.',
    revoked: 'Key revoked',
    revokeFailed: 'Could not revoke the key.',
    rotateTitle: 'Rotate “{{name}}”?',
    rotateDescription:
      'The key gets a new value and the old value stops working at once. Its name, permissions and lifetime stay.',
    rotateFailed: 'Could not rotate the key.',
    rotated: 'New value for “{{name}}”',
  },
  create: {
    title: 'New personal key',
    breadcrumb: 'New key',
    name: 'Name',
    namePlaceholder: 'For example: report sync',
    description: 'Description',
    descriptionPlaceholder: 'Optional: which machine or pipeline uses it',
    scope: 'Permissions',
    custom: 'Custom (recommended)',
    customHint:
      'Pick from what you can do today. Everything you can do is selected; narrow it with a template, quick settings or one by one. Permissions cannot change once the key is made.',
    sameAsMe: 'Same as me',
    sameAsMeHint:
      'Exactly what you can do, including permissions you get later and account endpoints.',
    sameAsMeOff:
      'Turned off by your administrator: a key must say what it may do.',
    sameAsMeWarning:
      'A key with the same permissions as you can obtain your sign-in: if it leaks, your account is taken over, and it gains whatever permissions you get later. Use it only in a trusted script on your own machine.',
    expiry: 'Expires in',
    days: '{{count}} days',
    never: 'Never',
    neverDiscouraged: 'Never expiring is not recommended.',
    maxDays: 'Your administrator allows at most {{count}} days.',
    riskyTemplateTitle: 'Turn on high-risk permissions?',
    riskyTemplate:
      'This template turns on {{actions}}, which are high risk. A key that leaks can do them in your name.',
    riskyTemplateApply: 'Apply template',
    template: 'Start from a template…',
    quick: 'Quick settings',
    everything: 'Everything I can do',
    readOnly: 'Read only',
    clear: 'Clear',
    dataRules:
      'Which records the key finally sees also depends on data rules (default access, sharing and restriction rules), exactly as for you.',
    records: 'Records:',
    allRecords: 'All',
    selectedRecords_one: '{{count}} selected',
    selectedRecords_other: '{{count}} selected',
    noneSelected: 'None selected yet',
    pickRecords: 'Limit to some records',
    searchRecords: 'Search',
    noRecords: 'No records you can choose.',
    useAll: 'All records',
    nothingSelected: 'Choose at least one permission.',
    pickRequired: 'Choose the records for {{name}}.',
    submit: 'Create key',
    submitting: 'Creating…',
    failed: 'Could not create the key.',
    errors: {
      API_KEY_CREATION_FORBIDDEN: 'Your role does not let you create keys.',
      SAME_AS_ME_DISABLED:
        'Keys with the same permissions as you are turned off. Choose what the key may do.',
      KEY_SCOPE_EXCEEDS_YOURS:
        'The key would do more than you can do now. Reload and choose again.',
      KEY_ACTION_HUMAN_ONLY: 'Only a person may take one of these actions.',
      EXPIRY_REQUIRED: 'Choose when the key expires.',
      INVALID_EXPIRY: 'Choose an expiry your administrator allows.',
      INVALID_NAME: 'Give the key a name of at most 100 characters.',
      EMPTY_SCOPE: 'Choose at least one permission.',
    },
  },
  created: {
    title: 'Key created',
    onceOnly:
      'This is the only time the key is shown. Copy it now: once you leave, it cannot be seen again, only rotated.',
    secret: 'Key',
    name: 'Name',
    identity: 'Acts as',
    you: 'You ({{name}})',
    expires: 'Expires',
    example: 'Try it',
    done: 'I have saved it',
  },
  detail: {
    breadcrumb: 'Key',
    key: 'Key',
    expires: 'Expires',
    lastUsed: 'Last used',
    description: 'Description',
    what: 'What it can do',
    sameAsMe:
      'This key can do everything you can do, including what you are given later.',
    lapsed_one:
      '{{count}} permission no longer works: you no longer have it, so the key lost it too. It comes back when you get it again.',
    lapsed_other:
      '{{count}} permissions no longer work: you no longer have them, so the key lost them too. They come back when you get them again.',
    fixed:
      'A personal key’s permissions cannot change. To give it more, create a new key and revoke this one.',
    records: 'Records: {{records}}',
  },
} as const;

export default enUS;
