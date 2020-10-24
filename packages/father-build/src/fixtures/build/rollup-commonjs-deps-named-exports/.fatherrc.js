
export default {
  umd: {
    minFile: false,
  },
  namedExports: {
    // 用 require.resolve 是为了跑测试时能找到文件
    // 项目里用 `foo` 或 `node_modules/foo/index.js` 就好
    // ref: https://github.com/rollup/rollup-plugin-commonjs#custom-named-exports
    [`${require.resolve('foo')}`]: ['a', 'b'],
  },
};
