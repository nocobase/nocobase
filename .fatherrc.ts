export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  pkgFilter: {
    exclude: ['@nocobase/app-client', '@nocobase/build'],
  },
};
