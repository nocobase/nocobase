// Every visible string of the API keys pages, and the titles the server registers in this namespace.
const enUS = {
  navigation: {
    personal: 'API keys',
    system: 'API keys',
  },
  permissions: {
    apiKeys: 'API keys',
    personalApiKeys: 'Personal API keys',
    read: 'Open page (view system keys and members’ personal keys)',
    manage: 'Manage system keys',
    create: 'Create personal API keys',
    humanOnly: 'Keys never manage keys: only a person may do this.',
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
  system: {
    title: 'API keys',
    description: 'Manage system keys for external integrations.',
    more: 'More actions',
    memberReview: 'Review member keys',
    keyRules: 'Key rules',
    newKey: 'New system key',
    search: 'Search keys',
    empty: 'No system keys yet.',
    columns: {
      status: 'Status',
    },
    ownedBy: 'Owner: {{name}}',
    noOwner: 'No owner',
    managedTag: 'Managed · {{title}}',
    statusEnabled: 'Enabled',
    enable: 'Enable',
    disable: 'Disable',
    enabled: 'Key enabled',
    disabled: 'Key disabled',
    delete: 'Delete',
    deleted: 'Key deleted',
    failed: 'Could not save the change.',
    disableTitle: 'Disable “{{name}}”?',
    disableDescription:
      'Calls with this key fail at once until it is enabled again. Its permissions and activity stay.',
    disableManaged:
      'Calls with this key fail at once, and {{title}} is told it was disabled.',
    deleteTitle: 'Delete “{{name}}”?',
    deleteDescription:
      'The key, its service account and its permissions are removed. Whatever uses it stops working. This cannot be undone.',
    deleteManaged:
      'The key, its service account and its permissions are removed, and {{title}} is told. This cannot be undone.',
    create: {
      title: 'New system key',
      breadcrumb: 'New system key',
      namePlaceholder: 'For example: ERP sync',
      descriptionPlaceholder: 'Optional: what calls it, and why',
      owner: 'Owner',
      ownerHint:
        'Receives the expiry reminder and notices about the key. The key does not act as them and keeps working if they leave.',
      expiryHint:
        'Rotate it before it expires; rotating keeps its identity and permissions.',
      dataRules:
        'Records are all or selected ones: a system key is no member, so “mine” and other records relative to a person do not apply. Restriction rules still apply to it.',
    },
    created: {
      title: 'System key created',
      identity: 'Its own service account',
    },
    detail: {
      breadcrumb: 'System key',
      edit: 'Edit',
      check: 'Permission check',
      permissions: 'Permissions',
      activity: 'Activity',
      save: 'Save',
      saved: 'Permissions saved',
      discard: 'Discard changes',
      saveHint:
        'Changes apply at once and are recorded in the activity, before and after.',
      managed:
        'Managed by {{title}}: its permissions and rotation change there. Here you can view, disable or delete it.',
      rotateDescription:
        'The key gets a new value and the old one stops working at once. Its identity, name, permissions and activity stay.',
    },
    activity: {
      create: 'Created',
      update: 'Edited',
      permissions: 'Changed permissions',
      rotate: 'Rotated',
      disable: 'Disabled',
      enable: 'Enabled',
      delete: 'Deleted',
      adopt: 'Imported',
      system: 'System',
      before: 'Before',
      after: 'After',
      nothing: 'Nothing',
    },
  },
  members: {
    hint: 'Every member’s own keys. You see what each can do, never the key itself, and cannot change their permissions; revoke one that is too broad or unused.',
    search: 'Search keys or members',
    filter: 'Show',
    filters: {
      all: 'All',
      sameAsMember: 'Same as member',
      idle: 'Unused for {{count}} days',
    },
    columns: {
      member: 'Member',
    },
    empty: 'No keys match.',
    previous: 'Previous',
    next: 'Next',
    revokeTitle: 'Revoke “{{name}}” of {{member}}?',
    revokeDescription:
      'Whatever uses this key stops working at once, and {{member}} cannot bring it back. This cannot be undone.',
    revoked: 'Key revoked',
  },
  rules: {
    newKeysOnly:
      'These rules apply to keys created or rotated from now on; existing keys keep their expiry. Who may open this page, manage system keys or create personal keys is set on roles.',
    whoMay: 'Roles and permissions',
    sameAsMe: {
      title: 'Personal key permissions',
      description:
        'Anyone with such a key may be able to sign in as its owner. When this option is off, members must choose permissions for each new personal key.',
      allow: 'Allow members to create keys with all their permissions',
    },
    maxDays: {
      title: 'Longest personal key lifetime',
      description: 'Personal keys with chosen permissions cannot live longer.',
    },
    defaultDays: {
      title: 'Default lifetime of a new personal key',
      description: 'What the expiry starts at when a member creates a key.',
    },
    idle: {
      title: 'Disable keys unused for',
      description:
        'Applies to personal and system keys created or rotated from now on; keys made before keep the rule they had. The owner is notified a week before.',
      off: 'Off',
    },
    noLimit: 'No limit',
    readOnly: 'Only someone who manages system keys can change the rules.',
    saved: 'Rules saved',
    failed: 'Could not save the rules.',
  },
  check: {
    systemKey: 'System key',
    personalKey: 'Personal key',
    systemIdentity: 'System key',
    search: 'Search',
    change: 'Change',
    none: 'Nothing found.',
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
    moreRecords: 'Show more',
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
      SYSTEM_KEY_SCOPE:
        'A system key acts as no member: give it all records or selected records, not records relative to a person.',
      INVALID_OWNER: 'Choose an active member as the owner.',
      SYSTEM_KEY_MANAGED:
        'This key is managed elsewhere: change its permissions and rotate it there.',
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
