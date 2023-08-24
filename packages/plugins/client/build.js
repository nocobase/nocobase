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
  const files = await fs.readdir(path.resolve(path.dirname(antd), 'locale'));
  await fs.mkdir(path.resolve(localeDir, 'antd'), { force: true, recursive: true });
  for (const file of files) {
    if (path.extname(file) !== '.js') {
      continue;
    }
    const content = require(path.resolve(path.dirname(antd), 'locale', file)).default;
    try {
      await fs.writeFile(
        path.resolve(localeDir, 'antd', file),
        `module.exports = ${JSON.stringify(content)}`,
        'utf-8',
        {},
      );
    } catch (error) {
      log(`skip ${file}`);
    }
  }
};
