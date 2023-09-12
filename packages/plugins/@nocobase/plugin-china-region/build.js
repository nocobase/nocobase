#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const existsSync = require('fs').existsSync;

exports.run = async (log) => {
  const dir = path.resolve(__dirname, './dist/china-division');
  if (existsSync(dir)) {
    await fs.rmdir(dir, { force: true, recursive: true });
  }

  const keys = ['areas', 'cities', 'provinces'];
  for (const key of keys) {
    log(`coping ${key}.json`);
    await fs.cp(require.resolve(`china-division/dist/${key}.json`), path.resolve(dir, `${key}.json`), {
      recursive: true,
      force: true,
    });
  }
};
