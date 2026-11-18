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
      title: 'Add or improve the browser interface',
      description:
        'Provide an entry for browsing connections, collections and fields, with physical structure details when needed.',
      prompt:
        'Add or improve the Database Explorer interface in this application. Read the installed nocobase-app-plugin-database-explorer Skill and inspect the existing routes and page before creating anything. Reuse the existing page if present. Provide navigation from System settings → System, a connection list, paginated collection browsing, field details and resolution warnings, and on-demand physical columns, indexes and constraints. Use DatabaseExplorerClient and keep the page route and APIs under the same DATABASE_EXPLORER_ACCESS permission. Handle loading, empty results, missing resources, unavailable connections and denied access. Do not add connection editing, schema changes or business-record editing. Do not expose credentials or sensitive connection details. Do not grant access to additional users without confirmation.',
      inspect:
        'Check the installed plugin, authentication and authorization prerequisites, registration and existing application-owned explorer route. Reuse the existing interface when available.',
      configure:
        'Build on DatabaseExplorerClient with the application API client. Declare a protected application route using DATABASE_EXPLORER_ACCESS and add its navigation under System settings → System.',
      complete:
        'Implement connection selection, paginated collections and field details; fetch physical structure on demand. Include loading, empty, unavailable and denied states without adding write operations.',
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
