const path = require('node:path');

require('tsx/cjs');
require('tsconfig-paths/register');

const { register } = require('tsconfig-paths');

register({
  baseUrl: path.resolve(__dirname, 'src'),
  paths: {
    '@nocobase/runjs': ['index.ts'],
    '@nocobase/runjs/package.json': ['../package.json'],
    '@nocobase/runjs/*': ['*'],
  },
});
