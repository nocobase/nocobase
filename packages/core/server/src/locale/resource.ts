/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';

const arr2obj = (items: any[]) => {
  const obj = {};
  for (const item of items) {
    Object.assign(obj, item);
  }
  return obj;
};

export const getResource = async (packageName: string, lang: string, isPlugin = true) => {
  const resources = [];
  const prefixes = [isPlugin ? 'dist' : 'lib'];
  if (process.env.APP_ENV !== 'production') {
    try {
      require.resolve('@nocobase/client/src');
      if (packageName === '@nocobase/plugin-client') {
        packageName = '@nocobase/client';
      }
    } catch (error) {
      // empty
    }
    prefixes.unshift('src');
  }
  for (const prefix of prefixes) {
    try {
      const file = `${packageName}/${prefix}/locale/${lang}.json`;
      const f = require.resolve(file);
      const resource = await fs.readFile(f, 'utf8');
      resources.push(JSON.parse(resource));
    } catch (error) {
      // empty
    }
    if (resources.length) {
      break;
    }
  }
  if (resources.length === 0 && lang.replace('-', '_') !== lang) {
    return await getResource(packageName, lang.replace('-', '_'));
  }
  return arr2obj(resources);
};
