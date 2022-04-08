const dialectLib = (dialect) => {
  if (dialect === 'sqlite') {
    return {
      sqlite3: '^5.0.2',
    };
  }

  if (dialect === 'mysql') {
    return {
      mysql2: '^2.3.3',
    };
  }

  if (dialect === 'postgres') {
    return {
      pg: '^8.7.3',
    };
  }
};

module.exports = (opts) => {
  const { version, dbOptions } = opts;

  return {
    name: 'server',
    version: '0.1.0',
    main: 'index.js',
    scripts: {
      start: 'node-dev -r dotenv/config src/index.ts dotenv_config_path=../../.env',
    },
    dependencies: {
      ...dialectLib(dbOptions.dialect),
      '@nocobase/plugin-acl': version,
      '@nocobase/plugin-china-region': version,
      '@nocobase/plugin-collection-manager': version,
      '@nocobase/plugin-error-handler': version,
      '@nocobase/plugin-file-manager': version,
      '@nocobase/plugin-system-settings': version,
      '@nocobase/plugin-ui-routes-storage': version,
      '@nocobase/plugin-ui-schema-storage': version,
      '@nocobase/plugin-users': version,
      '@nocobase/plugin-workflow': version,
      '@nocobase/server': version,
      dotenv: '^16.0.0',
    },
    devDependencies: {
      '@types/node': '^17.0.23',
      'node-dev': '^7.4.2',
      'ts-node': '^10.7.0',
      typescript: '^4.6.3',
    },
  };
};
