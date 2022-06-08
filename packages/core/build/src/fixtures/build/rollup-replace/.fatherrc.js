
export default {
  esm: { type: 'rollup' },
  replace: {
    VERSION: JSON.stringify(require('./package').version),
  },
};
