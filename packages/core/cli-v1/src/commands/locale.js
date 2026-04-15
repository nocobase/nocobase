/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { Command } = require('commander');
const fg = require('fast-glob');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const deepmerge = require('deepmerge');
const { getCronstrueLocale } = require('./locale/cronstrue');
const { getReactJsCron } = require('./locale/react-js-cron');

function sortJSON(json) {
  if (Array.isArray(json)) {
    return json.map(sortJSON);
  } else if (typeof json === 'object' && json !== null) {
    const sortedKeys = Object.keys(json).sort();
    const sortedObject = {};
    sortedKeys.forEach((key) => {
      sortedObject[key] = sortJSON(json[key]);
    });
    return sortedObject;
  }
  return json;
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const locale = cli.command('locale');
  locale.command('generate').action(async (options) => {
    const cwd = path.resolve(process.cwd(), 'node_modules', '@nocobase');
    const files = await fg('./*/src/locale/*.json', {
      cwd,
    });
    let locales = {};
    await fs.mkdirp(path.resolve(process.cwd(), 'storage/locales'));
    for (const file of files) {
      const locale = path.basename(file, '.json');
      const pkg = path.basename(path.dirname(path.dirname(path.dirname(file))));
      _.set(locales, [locale.replace(/_/g, '-'), `@nocobase/${pkg}`], await fs.readJSON(path.resolve(cwd, file)));
      if (locale.includes('_')) {
        await fs.rename(
          path.resolve(cwd, file),
          path.resolve(cwd, path.dirname(file), `${locale.replace(/_/g, '-')}.json`),
        );
      }
    }
    const zhCN = locales['zh-CN'];
    const enUS = locales['en-US'];
    for (const key1 in zhCN) {
      for (const key2 in zhCN[key1]) {
        if (!_.get(enUS, [key1, key2])) {
          _.set(enUS, [key1, key2], key2);
        }
      }
    }
    for (const locale of Object.keys(locales)) {
      locales[locale] = deepmerge(enUS, locales[locale]);
      locales[locale]['cronstrue'] = getCronstrueLocale(locale);
      locales[locale]['react-js-cron'] = getReactJsCron(locale);
    }
    locales = sortJSON(locales);
    for (const locale of Object.keys(locales)) {
      await fs.writeFile(
        path.resolve(process.cwd(), 'storage/locales', `${locale}.json`),
        JSON.stringify(sortJSON(locales[locale]), null, 2),
      );
    }
  });

  locale.command('sync').action(async (options) => {});
};
