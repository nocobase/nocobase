export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  excludePkgs: ['core/build', 'app/client'],
};
