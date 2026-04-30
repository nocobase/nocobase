/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import pkg from './../../package.json';
import { useApp } from '@nocobase/client-v2';

let translator: (key: string) => string = tStr;

export function setTranslator(nextTranslator: (key: string) => string) {
  translator = nextTranslator;
}

export function useT() {
  const app = useApp();
  return (str: string) => app.i18n.t(str, { ns: [pkg.name, 'data-visualization', 'client'] });
}

export function tStr(key: string) {
  return `{{t(${JSON.stringify(key)}, { ns: ['${pkg.name}', 'data-visualization', 'client'], nsMode: 'fallback' })}}`;
}

export function lang(key: string) {
  return translator(key);
}
