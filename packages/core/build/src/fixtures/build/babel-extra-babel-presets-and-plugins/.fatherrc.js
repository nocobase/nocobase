
export default {
  esm: { type: 'babel' },
  extraBabelPresets: [
    require.resolve('./preset'),
  ],
  extraBabelPlugins: [
    require.resolve('./p2'),
  ],
};
