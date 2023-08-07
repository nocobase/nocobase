#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const existsSync = require('fs').existsSync;

const client = require.resolve('@nocobase/client');
const antd = require.resolve('antd');

exports.run = async (log) => {
  const localeDir = path.resolve(__dirname, './dist/locale');
  if (existsSync(localeDir)) {
    await fs.rmdir(localeDir, { force: true, recursive: true });
  }

  log('coping client locale');
  await fs.cp(path.resolve(path.dirname(client), 'locale'), localeDir, {
    recursive: true,
    force: true,
  });

  log('coping antd locale');
  await fs.cp(path.resolve(path.dirname(antd)), path.resolve(localeDir, 'antd'), {
    recursive: true,
    force: true,
  });
};
