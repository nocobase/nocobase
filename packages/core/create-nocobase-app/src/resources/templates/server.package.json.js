const path = require('path');
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
      'pg-hstore': '^2.3.4',
    };
  }
};

module.exports = (opts) => {
  const { dbOptions, projectPath } = opts;
  const templateJsonPath = path.join(projectPath, 'packages/app/server/package.json');
  const templateJson = require(templateJsonPath);

  return {
    ...templateJson,
    name: 'app-server',
    version: '0.1.0',
    main: 'index.js',
    dependencies: {
      ...templateJson.dependencies,
      ...dialectLib(dbOptions.dialect),
    },
  };
};
