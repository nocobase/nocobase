export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  excludePkgs: [
    'core/build',
    'core/cli',
    'core/create-nocobase-app',
    'core/devtools',
    'app/client',
  ],
};
