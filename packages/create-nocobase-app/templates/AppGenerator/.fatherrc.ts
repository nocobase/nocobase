export default {
  entry: 'src/api',
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  include: 'api/*',
  disableTypeCheck: true,
  // pkgs: [
  //   'api',
  // ],
};
