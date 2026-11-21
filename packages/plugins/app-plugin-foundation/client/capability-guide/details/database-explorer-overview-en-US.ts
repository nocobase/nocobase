const databaseExplorerOverview = {
  current: {
    title: 'Database explorer interface',
    description:
      'Browse database connections, collections and fields, and inspect physical columns, indexes and constraints.',
    boundary:
      'This status indicates whether the application provides the interface. It does not indicate that every database connection is reachable.',
    database: 'Configure database connections',
  },
  actions: {
    interface: {
      title: 'Use the built-in database browser',
      description:
        'Open the built-in page from System settings and customize its placement if needed.',
      prompt:
        'Inspect the registered Database Explorer plugin and its System settings entry. Use the built-in page to browse connections, collections, fields and physical schema. Keep any existing customized page and its access grant when adjusting the route.',
      inspect:
        'Check Authentication, Authorization, Database Explorer and any existing custom route.',
      configure:
        'Mount the plugin page under System settings → System. An application that owns its own page can select routes: false.',
      complete:
        'Verify that an authorized user can browse a table and that a user without access cannot open the page or read its API.',
    },
    access: {
      title: 'Adjust who can access the browser',
      description:
        'Choose which administrators or maintainers can browse the application’s database structure.',
      prompt:
        'Prepare an access configuration change for the Database Explorer for [confirmed roles or people]. Read the plugin Skill and inspect existing permission sets and grants. The current plugin uses page:database-explorer/access for the whole explorer; it does not provide per-connection, per-collection or per-field viewing scopes. Explain that this grant exposes the application-wide structure and is separate from business-record permissions. Keep the route and API permission checks consistent. Preserve existing grants and do not broaden access to everyone. Show the target roles or permission sets and proposed changes for confirmation before applying grants. If finer isolation is required, explain that filtering the interface alone cannot enforce it.',
      inspect:
        'Confirm the intended roles or people and inspect existing permission sets. System Administrators already have access through page:*/access.',
      configure:
        'Grant page:database-explorer/access only to confirmed permission sets. Keep DATABASE_EXPLORER_ACCESS on the application route and retain the API checks.',
      complete:
        'Confirm that the navigation, page and APIs use the same permission. Do not present hidden connections or fields in the interface as server-enforced access restrictions.',
    },
  },
};

export default databaseExplorerOverview;
