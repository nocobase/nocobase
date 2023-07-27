#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const client = require.resolve('@nocobase/client');
const antd = require.resolve('antd');

fs.cp(
  path.resolve(path.dirname(client), 'locale'),
  path.resolve(__dirname, './dist/locale'),
  { recursive: true },
  (err) => {
    if (err) {
      console.error(err);
    }
  },
);

fs.cp(
  path.resolve(path.dirname(antd), 'locale'),
  path.resolve(__dirname, './dist/locale/antd'),
  { recursive: true },
  (err) => {
    if (err) {
      console.error(err);
    }
  },
);
