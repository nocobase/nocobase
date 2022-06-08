
export default {
  entry: [
    'src/index.js',
    'src/foo.js',
    'src/bar.js',
  ],
  umd: {
  },
  cjs: { type: 'rollup' },
  esm: { type: 'rollup' },
  file: 'dva',
  overridesByEntry: {
    'src/foo.js': {
      file: 'dva.foo',
      cjs: { type: 'rollup', file: 'dva.foo.cjs' },
      esm: { type: 'rollup', file: 'dva.foo.esm' },
    },
    'src/bar.js': {
      cjs: false,
      esm: false,
      umd: { file: 'dva.bar' },
    },
    'src/index.js': {
      cjs: false,
      esm: false,
    },
  },
};
