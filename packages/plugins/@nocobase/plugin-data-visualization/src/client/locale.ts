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
import { useApp, i18n } from '@nocobase/client';
import { useFlowEngineContext } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';

export const namespace = pkg.name;

export function useT(): any {
  const ctx = useFlowEngineContext();
  return (str: string, options?: any) => ctx.i18n.t(str, { ns: [pkg.name, 'client'], ...options });
}

export function tStr(key: string) {
  return `{{t(${JSON.stringify(key)}, { ns: ['${pkg.name}', 'client'], nsMode: 'fallback' })}}`;
}

export function lang(key: string) {
  return i18n.t(key, { ns: [pkg.name, 'client'] });
}

export function useChartsTranslation() {
  return useTranslation([pkg.name, 'client'], { nsMode: 'fallback' });
}
