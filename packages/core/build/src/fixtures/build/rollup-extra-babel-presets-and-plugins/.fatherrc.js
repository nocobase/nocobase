
export default {
  esm: { type: 'rollup' },
  extraBabelPresets: [
    require.resolve('./preset'),
  ],
  extraBabelPlugins: [
    require.resolve('./p2'),
  ],
};
