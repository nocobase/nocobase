const noEmptyStr = { type: 'string', minLength: 1 };

export default {
  type: 'object',
  additionalProperties: false,
  properties: {
    entry: {
      oneOf: [noEmptyStr, { type: 'array', items: noEmptyStr }],
    },
    file: { type: 'string' },
    esm: {
      oneOf: [
        noEmptyStr,
        { type: 'boolean' },
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
              pattern: '^(rollup|babel)$',
            },
            file: noEmptyStr,
            mjs: { type: 'boolean' },
            minify: { type: 'boolean' },
            importLibToEs: {
              type: 'boolean',
            },
            dir: noEmptyStr
          },
        },
      ],
    },
    cjs: {
      oneOf: [
        noEmptyStr,
        { type: 'boolean' },
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
              pattern: '^(rollup|babel)$',
            },
            file: noEmptyStr,
            minify: { type: 'boolean' },
            lazy: { type: 'boolean' },
          },
        },
      ],
    },
    umd: {
      oneOf: [
        { type: 'boolean' },
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            globals: { type: 'object' },
            file: noEmptyStr,
            name: noEmptyStr,
            minFile: { type: 'boolean' },
            sourcemap: {
              oneOf: [
                { type: 'boolean' },
                { type: 'string', pattern: '^(inline|hidden)$', },
              ]
            },
          },
        },
      ],
    },
    extraBabelPlugins: {
      type: 'array',
    },
    extraBabelPresets: {
      type: 'array',
    },
    extraPostCSSPlugins: {
      type: 'array',
    },
    extraRollupPlugins: {
      type: 'array',
    },
    extraExternals: {
      type: 'array',
    },
    externalsExclude: {
      type: 'array',
    },
    cssModules: {
      oneOf: [{ type: 'boolean' }, { type: 'object' }],
    },
    extractCSS: {
      type: 'boolean',
    },
    injectCSS: {
      oneOf: [{ type: 'boolean' }, { instanceof: 'Function' }],
    },
    autoprefixer: {
      type: 'object',
    },
    include: {
      oneOf: [
        { type: 'string' },
        { type: 'object' },
        { type: 'array' },
      ]
    },
    runtimeHelpers: {
      type: 'boolean',
    },
    overridesByEntry: {
      type: 'object',
    },
    nodeResolveOpts: {
      type: 'object',
    },
    target: noEmptyStr,
    doc: {
      type: 'object',
    },
    replace: {
      type: 'object',
    },
    inject: {
      type: 'object',
    },
    lessInRollupMode: {
      type: 'object'
    },
    sassInRollupMode: {
      type: 'object'
    },
    lessInBabelMode: {
      oneOf: [
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
    browserFiles: {
      type: 'array',
    },
    nodeFiles: {
      type: 'array',
    },
    nodeVersion: {
      type: 'number',
    },
    disableTypeCheck: {
      type: 'boolean',
    },
    preCommit: {
      type: 'object',
      additionalProperties: false,
      properties: {
        eslint: { type: 'boolean' },
        prettier: { type: 'boolean' },
      },
    },
    typescriptOpts: {
      type: 'object',
    },
    pkgs: {
      type: 'array',
    },
    pkgFilter: {
      type: 'object',
    },
  },
};
