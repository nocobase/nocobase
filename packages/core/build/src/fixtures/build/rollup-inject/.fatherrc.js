
export default {
  esm: { type: 'rollup' },
  inject: {
    'window.foo': 'foo',
  },
};
