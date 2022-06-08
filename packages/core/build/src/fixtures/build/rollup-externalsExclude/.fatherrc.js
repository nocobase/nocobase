
export default {
  esm: { type: 'rollup' },
  cjs: { type: 'rollup' },
  extraExternals: [
    'foo',
  ],
  externalsExclude: [
    'foo/bar',
  ],
};
