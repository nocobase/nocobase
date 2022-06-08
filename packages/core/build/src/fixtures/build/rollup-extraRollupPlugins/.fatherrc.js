import replace from 'rollup-plugin-replace';

export default {
  esm: { type: 'rollup' },
  extraRollupPlugins: [
    replace({
      VERSION: JSON.stringify('1.0.0'),
    }),
  ],
};
