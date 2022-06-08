export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  excludePkgs: ['app/client'],
};
