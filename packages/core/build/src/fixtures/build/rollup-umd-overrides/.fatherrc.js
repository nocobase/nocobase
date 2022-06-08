
export default {
  entry: [
    'src/index.js',
    'src/fetch.js',
  ],
  umd: {
    minFile: false,
    name: 'foo',
  },
  overridesByEntry: {
    'src/fetch.js': {
      umd: {
        name: 'foo.fetch',
      },
    },
  },
}
