export default {
  agent: {
    tab: 'Use Agent',
    manualTab: 'Manual configuration',
    hint: 'Describe the connection and give the prompt to an Agent that can work on this application. Provide credentials securely during execution, not in this form.',
    type: 'Database type',
    name: 'Connection name',
    purpose: 'Purpose',
    purposeHint:
      'For example: query sales data from an existing reporting database',
    typePlaceholder: '[database type]',
    namePlaceholder: '[new connection name]',
    purposePlaceholder: '[connection purpose]',
    generate: 'Update prompt',
    generateHint:
      'Update the prompt after changing the requirements. Updating replaces any manual edits below.',
    promptLabel: 'Editable prompt',
    copy: 'Copy prompt',
    copied: 'Copied',
    copyFailed: 'Copy failed. Select the prompt above and copy it manually.',
    prompt:
      'Add a database connection to the current NocoBase application.\n\nDatabase type: {{databaseType}}\nConnection name: {{connectionName}}\nPurpose: {{purpose}}\n\nInspect the current connection configuration and driver dependencies first. Preserve every existing connection and the default connection; confirm a new name with me if it conflicts. Confirm that the target database exists and ask for missing host, port, database name and account details. Obtain passwords through a secure channel, never in the prompt or logs.\n\nConfirm whether this application or an external system owns the schema before choosing managed or external; external does not mean read-only. Install a compatible database driver if needed and add the named connection to the configuration file the application actually reads. Use separate environment mappings if environment variables are needed.\n\nRun pnpm nocobase config check and address its findings. Apply the configuration according to the current runtime and deployment setup; explain the impact and confirm timing before restarting a service in use. Finally, confirm the new connection in the database overview and verify its tables and fields through Database Explorer. Do not migrate existing data or change existing database structures.',
  },
  addConnection: {
    title: 'How to add a database connection',
    prepare:
      'Prepare the database address, port, database name and credentials, and confirm it is reachable from the application server. Adding a connection does not create the database; provision it first.',
    driver:
      'For PostgreSQL, ensure dependencies includes a version of @nocobase/db-postgres compatible with the application. If missing, install it in the application source project, then rebuild and deploy. Installed official drivers load automatically by database type.',
    configure:
      'In the configuration file the application reads (normally config.yml), add a unique name such as analytics under database.connections. Keep existing connections and database.default unchanged; do not replace the whole configuration file with the example.',
    exampleHint:
      'Example: connect to an existing PostgreSQL database. Merge analytics into the existing database.connections and replace the angle-bracket placeholders. Add TLS settings as required by the database.',
    management:
      'Use schemaManagement: external when another system maintains the existing schema, or managed when this application should manage it through migrations. External does not mean read-only: database credentials and application authorization still control data access.',
    environment:
      "A new connection does not automatically read the main connection’s DB_* variables. To use separate variables, keep existing env mappings in server/config/database.ts and add the mappings from connectionEnvironment('analytics', 'DB_ANALYTICS'), then rebuild and deploy. Do not put ${DB_ANALYTICS_PASSWORD} directly in YAML; it is not interpolated automatically.",
    validate:
      'Run the configuration check from the application root. By default it attempts connections to non-SQLite databases such as PostgreSQL, without running migrations.',
    restart:
      'After the check passes, restart the application and refresh this page. Confirm analytics appears, then select Browse tables and fields to verify access. Adding a connection does not migrate data from an existing connection.',
  },
  connections: 'Configured connections',
  connectionCount: '{{count}} configured connections',
  runtimeNote:
    'This list reflects the running application’s configuration, not a database connectivity check. Credentials and server or file locations are not displayed.',
  effectiveConfiguration: 'View effective configuration',
  sourceNote:
    'These are the non-sensitive values returned by the running application. Their individual source (config.yml, environment variables or defaults) is not available from this interface. Omitted values are not necessarily unconfigured.',
  browse: 'Browse tables and fields',
  managed: 'Application managed',
  external: 'Externally managed',
  fields: {
    type: 'Database type',
    management: 'Schema management',
    databaseName: 'Database / service',
    schemas: 'Schemas',
    driver: 'Driver',
    tablePrefix: 'Table prefix',
    underscored: 'Underscored names',
  },
  optionsTitle: 'What you can configure',
  optionsHint:
    'Common configuration options are listed below. Availability depends on the database driver; this is not a list of missing settings.',
  options: {
    connections: {
      title: 'Connections',
      description:
        'Add named connections and choose a database type. Each connection contains tables with their fields and relationships. The corresponding database driver must be installed.',
    },
    default: {
      title: 'Default connection',
      description:
        'Choose the connection used when an operation does not specify one.',
    },
    management: {
      title: 'Schema management',
      description:
        'Application-managed connections run migrations. Externally managed connections have their structure maintained outside the application.',
    },
    transport: {
      title: 'Connection settings',
      description:
        'Depending on the database type, configure a file location, server address, database name, credentials and TLS.',
    },
    naming: {
      title: 'Naming conventions',
      description:
        'Configure a table prefix and underscored names. Changing naming rules does not rename existing tables.',
    },
  },
  configurationGuide: 'Configuration keys and YAML example',
  configurationHint:
    'Use database.default to select the default connection and database.connections to define named connections in the application’s config.yml.',
  exampleLabel:
    'Illustrative SQLite configuration — not an export of this application’s configuration.',
  environmentHint:
    'The template maps DB_DIALECT, DB_FILENAME, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD and DB_SSL to the main connection. Environment variables can override file values. Additional connections need their own environment mappings if required.',
  restartHint:
    'This page is read-only. After changing connection configuration, validate it and restart the application. Schema changes require migrations; changing configuration alone does not migrate data.',
};
