const authorizationOverview = {
  currentHint:
    'A configured plugin does not establish that users have been granted access. Inspect permission sets, user assignments and effective rules in application permission management. This view does not read personal permissions or rule contents.',
  layersTitle: 'Start with the business responsibility',
  layers: {
    pages: {
      title: 'Pages',
      description:
        'Which pages can this person open? Opening a page does not authorize its business operations.',
    },
    actions: {
      title: 'Operations',
      description:
        'Which tasks can they perform, such as viewing, editing, submitting or approving? Assign each independently where responsibilities differ.',
    },
    fields: {
      title: 'Fields and related data',
      description:
        'Which values may they read or change, and which related records may an operation use?',
    },
    records: {
      title: 'Record scope',
      description:
        'On which customers, projects or documents may each operation act?',
    },
  },
  rolesTitle: 'How the four plugins work together',
  roles: {
    authorization: {
      title: 'Authorization',
      description:
        'Define pages, business operations, fields and record scopes. Assign permission sets to the intended people or teams.',
      example: 'Example: sales staff can view and edit the customers they own.',
    },
    defaultAccess: {
      title: 'Default data scopes',
      description:
        'Add a common record range for everyone who already holds an operation. This adds to their own range; it is not a fallback used only when their range is empty.',
      example:
        'Example: everyone allowed to view customers can also view the public customer pool.',
    },
    sharing: {
      title: 'Sharing rules',
      description:
        'Give selected collaborators additional records for operations they already hold. Related records and extra fields are not shared automatically.',
      example:
        'Example: a colleague can view a particular customer while helping with a handover.',
    },
    restriction: {
      title: 'Restriction rules',
      description:
        'Keep only the records that satisfy the restrictions applying to the person and operation. Define what remains allowed; multiple matching restrictions all apply.',
      example:
        'Example: a temporary collaborator may access only non-confidential customers, including among shared records.',
    },
  },
  combinationTitle: 'How access is decided',
  combination: {
    operation:
      'First, the person must hold the business operation. A default or sharing rule cannot create a missing operation permission.',
    expand:
      'For the same operation and record scope, combine the records allowed by permission sets, default data scopes and applicable sharing rules.',
    restrict:
      'Then keep only records satisfying all applicable restriction rules. Page access, field permissions and related-data checks still apply separately.',
  },
  exampleTitle: 'Example: viewing customers during a handover',
  exampleHint:
    'Illustration only, not this application’s current permissions. Assume an ordinary salesperson may view owned customers, also receives the public pool and two shared customers, and is restricted to non-confidential records.',
  exampleHeaders: {
    record: 'Customer',
    source: 'Why it is in scope',
    result: 'Can view?',
  },
  exampleRows: {
    own: {
      record: 'A · owned customer',
      source: 'Permission-set scope',
      result: 'Yes',
    },
    public: {
      record: 'B · public customer',
      source: 'Default data scope',
      result: 'Yes',
    },
    shared: {
      record: 'C · handover customer',
      source: 'Sharing rule',
      result: 'Yes',
    },
    confidential: {
      record: 'D · confidential handover',
      source: 'Shared, but excluded by the restriction',
      result: 'No',
    },
    other: {
      record: 'E · unrelated customer',
      source: 'No permission source includes it',
      result: 'No',
    },
  },
  exampleNote:
    'Without the view operation, none of these record rules grants viewing. Being able to view does not grant editing or expose restricted fields.',
  configureTitle: 'How to set up business permissions',
  agentTab: 'Development request',
  manualTab: 'Configuration steps',
  promptHint:
    'Describe real responsibilities, then give this request to your development Agent. The guide does not change anyone’s permissions.',
  promptLabel: 'Editable request',
  copy: 'Copy request',
  copied: 'Copied',
  copyFailed: 'Copy failed. Select the request above and copy it manually.',
  prompt:
    'Design and configure authorization for [business application].\n\nResponsibilities: [people or jobs, pages, operations, records, readable/editable fields].\nCommon records: [what every holder of an operation should receive, if any].\nCollaboration: [who receives which records, for which operations].\nRestrictions: [who must remain limited to which allowed records].\n\nRead the installed authorization Skill and the relevant default-access, sharing-rules and restriction-rules Skills. Inspect the existing permission model, plugin integration and management entries. If a required capability is missing, explain the gap; do not assume it is active or widen access to work around it.\n\nReuse supported operations and scopes. Develop any missing business model or enforcement first, then provide editable permission sets, rules and intended assignments. Ask about unspecified recipients or access decisions rather than guessing. Preserve unrelated administrator choices.\n\nDefaults and sharing may add records only for existing operations; restrictions keep only allowed records. Do not implicitly grant related records, fields or additional operations.\n\nVerify allowed and denied requests with ordinary accounts, including page entry, direct operations, field and related-record boundaries, multiple permission sources, confidential shared records and revocation. Report the actual changes and results.',
  steps: {
    responsibility:
      'List who does what: pages, operations, readable and writable fields, record scopes and collaboration exceptions. Decide separately who administers these assignments.',
    model:
      'Check whether the business feature already exposes the required operations and scopes. If not, ask the development Agent to add the permission model and enforcement before configuring it.',
    grant:
      'Use the application’s permission management entry to configure permission sets and assign them to the intended people or teams. If no entry exists, have the development Agent provide it.',
    rules:
      'Add default scopes only for genuinely common records, sharing rules for selected collaborators, and restrictions for records that must remain allowed. Configure viewing, editing and other operations separately.',
    verify:
      'Test with ordinary accounts, including direct requests. Check both allowed and denied records, restricted fields and related data. Unrestricted administrators bypass these record rules and are not suitable acceptance accounts.',
    revoke:
      'Remove a sharing rule or assignment and check the next request. Removing one source does not remove access still allowed by another permission set, default scope or sharing rule.',
  },
  configurationTitle: 'Where the configuration belongs',
  configurationHint:
    'Business permissions belong in editable permission sets, assignments and rules. config.yml controls integration settings; it is not the place to maintain individual customer-sharing rules. A rule plugin in the dependency list alone does not establish that its rules or management entry are ready.',
  includedTitle: 'Plugins covered by this guide',
  includedHint:
    'All four catalog entries open this combined guide. These package names identify the providers; they do not report current grants or enabled rules.',
};

export default authorizationOverview;
