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
      nocobase: 'ts-node-dev -r dotenv/config -r tsconfig-paths/register ./packages/server/src/index.ts',
    },
    dependencies: {
      dotenv: '^16.0.0',
    },
    devDependencies: {
      'node-dev': '^7.4.2',
      'ts-node-dev': '^1.1.8',
      'tsconfig-paths': '^3.14.1',
    },
  };
};
