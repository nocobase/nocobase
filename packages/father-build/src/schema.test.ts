import AJV from 'ajv';
import schema from './schema';

const ajv = new AJV();

const successValidates = {
  entry: ['a', ['a']],
  file: ['a'],
  esm: [false, true, { type: 'rollup' }, { type: 'babel' }, { file: 'a' }, { mjs: true }],
  cjs: [false, true, { type: 'rollup' }, { type: 'babel' }, { file: 'a' }],
  umd: [{ globals: {} }, { file: 'a' }, { name: 'a' }, { minFile: false }, { minFile: true }, { sourcemap: true }],
  extraBabelPlugins: [[]],
  extraBabelPresets: [[]],
  extraPostCSSPlugins: [[]],
  lessInRollupMode: [{}],
  cssModules: [true, false, {}],
  autoprefixer: [{}],
  include: ['node_modules', /node_modules/],
  namedExports: [{}],
  nodeResolveOpts: [{}],
  runtimeHelpers: [true, false],
  target: ['node', 'browser'],
  overridesByEntry: [{}],
  doc: [{}],
  typescriptOpts: [{}],
  pkgs: [[]],
};

Object.keys(successValidates).forEach(key => {
  test(key, () => {
    successValidates[key].forEach(item => {
      expect(
        ajv.validate(schema, {
          [key]: item,
        }),
      ).toEqual(true);
    });
  });
});
