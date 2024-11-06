/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import url from 'url';
import Handlebars from 'handlebars';
import helpers from '@budibase/handlebars-helpers';
import _ from 'lodash';

import { dayjs } from './dayjs';

const allHelpers = helpers();

//遍历所有 helper 并手动注册到 Handlebars
Object.keys(allHelpers).forEach(function (helperName) {
  Handlebars.registerHelper(helperName, allHelpers[helperName]);
});
// 自定义 helper 来处理对象
Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
});

//重写urlParse
Handlebars.registerHelper('urlParse', function (str) {
  try {
    return JSON.stringify(url.parse(str));
  } catch (error) {
    return `Invalid URL: ${str}`;
  }
});

Handlebars.registerHelper('dateFormat', (date, format, tz) => {
  if (typeof tz === 'string') {
    return dayjs(date).tz(tz).format(format);
  }
  return dayjs(date).format(format);
});

Handlebars.registerHelper('isNull', (value) => {
  return _.isNull(value);
});

export { Handlebars };
