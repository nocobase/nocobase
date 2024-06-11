/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import i18next, { TFuncKey, TOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import locale from '../locale';

/**
 * @deprecated
 * use {@link @nocobase/utils/client#tval} instead
 */
export function tval(text: TFuncKey | TFuncKey[], options?: TOptions) {
  if (options) {
    return `{{t(${JSON.stringify(text)}, ${JSON.stringify(options)})}}`;
  }
  return `{{t(${JSON.stringify(text)})}}`;
}

export const i18n = i18next.createInstance();

const resources = {};

Object.keys(locale).forEach((lang) => {
  resources[lang] = locale[lang].resources;
});

i18n
  // .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'en-US',
    // debug: true,
    defaultNS: 'client',
    // fallbackNS: 'client',
    // backend: {
    //   // for all available options read the backend's repository readme file
    //   loadPath: '/api/locales/{{lng}}/{{ns}}.json',
    // },
    // parseMissingKeyHandler: (key) => {
    //   console.log('parseMissingKeyHandler', `'${key}': '${key}',`);
    //   return key;
    // },
    // ns: ['client'],
    resources: {},
    keySeparator: false,
    nsSeparator: false,
  });
