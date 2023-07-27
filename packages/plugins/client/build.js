#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const client = require.resolve('@nocobase/client');
const antd = require.resolve('antd');

exports.run = async (log) => {
  log('coping client locale');
  await fs.cp(path.resolve(path.dirname(client), 'locale'), path.resolve(__dirname, './dist/locale'), {
    recursive: true,
    force: true,
  });

  log('coping antd locale');
  await fs.cp(path.resolve(path.dirname(antd), 'locale'), path.resolve(__dirname, './dist/locale/antd'), {
    recursive: true,
    force: true,
  });
};
