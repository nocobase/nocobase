export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  // disableTypeCheck: true,
  pkgs: [
    'core/utils',
    'core/database'
  ],
};
