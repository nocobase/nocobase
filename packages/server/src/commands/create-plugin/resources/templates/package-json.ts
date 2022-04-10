export default ({ name }) => {
  return {
    name: name,
    version: '0.1.0',
    main: 'server.js',
    dependencies: {
      '@nocobase/server': '^0.6.0-alpha.0',
    },
  };
};
