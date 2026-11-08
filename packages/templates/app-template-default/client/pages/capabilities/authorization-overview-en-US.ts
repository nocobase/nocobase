const authorizationOverview = {
  management: {
    hint: 'Status indicates whether each management interface is provided, not whether users have grants or rules exist. A missing rule is not necessarily a gap; open the relevant interface to inspect actual configuration.',
    roles: {
      title: 'Role and permission configuration interface',
      description:
        'Configure the pages, business operations and data scopes available to a role.',
    },
    assignments: {
      title: 'User role assignment interface',
      description:
        'Assign or adjust roles for specific users through User management.',
    },
    defaultAccess: {
      title: 'Default data scope management interface',
      description:
        'Configure a shared record baseline for existing action holders, without granting new operations.',
    },
    sharing: {
      title: 'Sharing rule management interface',
      description:
        'Share additional records with specific recipients who already hold the relevant action.',
    },
    restriction: {
      title: 'Restriction rule management interface',
      description:
        'Narrow the records recipients may access, including access from roles, defaults and sharing.',
    },
  },
  actions: {
    business: {
      title: 'Add permission controls to a business feature',
      description:
        'Support the page, action and record boundaries required by new or existing business features.',
      prompt:
        'Add permission controls to [business feature] for [people or jobs, pages, operations, records and exceptions]. Read nocobase-app-plugin-authorization and inspect actual pages, requests, the permission model and server enforcement. Reuse configuration where supported; develop missing actions, scopes or enforcement where necessary. Matching names alone do not prove support. Fields and relations belong to business implementation; do not create an arbitrary raw-field permission editor. Reuse the application role editor and expose real business actions and scopes. Confirm recipients before applying editable permission sets and assignments, without granting access to all signed-in users. Preserve other administrator choices. Verify allowed and denied pages, direct requests, record scopes and relations with ordinary accounts; report applied configuration and unresolved decisions.',
      inspect:
        'Map responsibilities to actual pages, actions, record scopes, fields and relations. Separate existing configuration options from missing business support.',
      configure:
        'Implement missing model and server enforcement, expose real actions and supported scopes in the existing editor, and complete editable role configuration and assignments for confirmed recipients.',
      verify:
        'Use ordinary accounts to check page entries and direct requests, allowed and denied records, and relation operations. Administrator access does not verify ordinary-user boundaries.',
    },
    roles: {
      title: 'Configure a role’s pages, operations and data scopes',
      description:
        'Define responsibilities for roles such as sales staff or project owners, or refine existing roles.',
      prompt:
        'Configure [role name] for [pages, business operations and each operation’s record scope]. Read the authorization Skill and inspect existing roles, the editor and supported actions/scopes. Propose changes tied to the responsibility. Reuse roles and management entries; add an editor only if missing. Use existing management APIs or authorized services to update editable permission sets while preserving unrelated configuration and handling concurrent edits. Configure pages and actions separately and confirm read, edit and submit scopes independently. Report missing business support instead of granting broader access. Configure the role only; confirm recipient names separately before assignment. Verify allowed and denied access with ordinary accounts and report changes.',
      inspect:
        'Decide whether to create or update a role. List its pages, operations and individual scopes, and check the application’s available options.',
      configure:
        'Update the permission set in the role editor, granting pages and actions separately. Implement missing business support first, preserve unrelated settings and handle revision conflicts.',
      verify:
        'Inspect saved configuration and verify operations and scopes with an identified test account. Saving a role does not assign it to business users.',
    },
    assignments: {
      title: 'Assign or adjust roles for specific users',
      description:
        'Identify recipients and review direct and inherited access.',
      prompt:
        'Adjust role assignments for [explicit users and role mappings]. Read the authorization Skill and verify identities, existing roles and all effective permission sources. Ask for unclear recipients or access decisions instead of guessing. Reuse the protected role-assignment controls in User management and existing management APIs; add an interface only if missing. Preserve unrelated direct assignments and inheritance. Do not widen access through all-user assignments or the default member role. Explain when other sources preserve access after a role is removed. Verify assignments and removals with new requests from the affected ordinary users, and report exactly which relationships changed.',
      inspect:
        'Confirm users, existing roles, direct assignments and inherited sources, as well as who may administer assignments.',
      configure:
        'Open each user in User management to adjust roles. If the control is missing, add the interface and protected operation. Change only confirmed users and role relationships.',
      verify:
        'Check effective access on fresh requests from the target users. Investigate other roles or inheritance when access remains after one source is removed.',
    },
    defaultAccess: {
      title: 'Configure a shared default data scope',
      description:
        'For example, let existing read-action holders see a public customer pool when the business needs it.',
      prompt:
        'Configure [shared record baseline] for [business action]. Read nocobase-app-plugin-authz-default-access and the main authorization Skill. Confirm supported actions/scopes and inspect existing rules and management entries. Reuse rules and pages; add a management page through protected plugin APIs only if missing. A default baseline adds to existing scopes, rather than applying only when a personal scope is absent. It grants no action, page or field permission. Confirm read and write scopes separately and retain other action/scope entries when updating a resource rule. Verify action holders, people without the action, and applicable restrictions with ordinary accounts.',
      inspect:
        'Identify records that every existing action holder should receive, confirm business support and inspect the resource’s existing rule.',
      configure:
        'Use default data scope management to configure the action and scope. Update an existing resource rule while retaining other operations. Add a page using existing APIs only if necessary.',
      verify:
        'Confirm action holders gain the baseline, people without the action remain denied, restrictions still apply and write access is not unintentionally widened.',
    },
    sharing: {
      title: 'Add sharing management and sharing rules',
      description:
        'Share specific business records with collaborators and support reviewing, changing and revoking sharing.',
      prompt:
        'Provide sharing for [business feature], giving [explicit people or teams] access to [records or supported record selection] for [actions]. Read nocobase-app-plugin-authz-sharing-rules and the main authorization Skill. Inspect existing interfaces, rule services, actions and scopes. Improve and configure an existing interface; otherwise provide listing, recipients, action/scope selection, editing and revocation through protected plugin APIs. Register the real settingsSharingRules route under Permission management; if reusing another route, update its Features and extensions mapping. Sharing extends record access only for existing action holders, granting no page, field, action or implicit related-record access. Confirm recipients, preserve unrelated rules and verify sharing, restrictions, related records and remaining sources after revocation with ordinary accounts.',
      inspect:
        'Confirm records, actions and collaborators. Check recipients’ existing action permissions and related scopes required by the operation.',
      configure:
        'Reuse an existing sharing page or add maintainable rule management and a Permission management entry. Save explicit recipients, actions and scopes through plugin APIs rather than writing rule tables.',
      verify:
        'Verify before/after access, recipients without the action, restricted records and revocation. Removing sharing removes that source only, not access granted elsewhere.',
    },
    restriction: {
      title: 'Add restriction management and restriction rules',
      description:
        'Narrow existing access to a required record range for selected people.',
      prompt:
        'Provide restriction management for [business feature], allowing [explicit people or teams] to reach only [remaining allowed records] for [actions]. Read nocobase-app-plugin-authz-restriction-rules and the main authorization Skill. Inspect existing pages, rule services, actions and scopes. Improve and configure an existing interface; otherwise provide listing, recipients, actions, allowed ranges, editing and deletion through protected plugin APIs. Register the real settingsRestrictionRules route under Permission management; update Features and extensions mapping if reusing another route. Conditions describe records still allowed, not records to hide. Matching restrictions all apply and cannot grant actions or expand access. Preserve other rules, confirm recipients/boundaries, and verify that role, default and shared access is restricted with ordinary accounts. Removing a restriction must not create an absent grant.',
      inspect:
        'Confirm recipients, actions and the remaining allowed records. Review roles, defaults, sharing and other restrictions.',
      configure:
        'Reuse or add restriction management and save recipients, actions and allowed ranges through plugin APIs. Label selections as allowed ranges rather than exclusion conditions.',
      verify:
        'Use ordinary accounts to verify that every grant source is narrowed and all matching restrictions apply. Deleting a restriction removes that narrowing without granting a new action.',
    },
  },
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
