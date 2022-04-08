module.exports = (opts) => {
  const { projectName } = opts;
  return {
    name: projectName,
    version: '0.1.0',
    private: true,
    workspaces: ['packages/**'],
    main: 'index.js',
    license: 'MIT',
    scripts: {
      'start-server': 'cd packages/server && npm run start',
      'start-client': 'cd packages/client && npm run start',
      nocobase: 'nocobase',
    },
    dependencies: {
      '@nocobase/cli': '^0.6.0-alpha.0',
      dotenv: '^16.0.0',
    },
  };
};
