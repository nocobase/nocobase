// @ts-ignore
import pkg from './../../package.json';
import { useApp } from '@nocobase/client';
import { i18n } from '@nocobase/client';

export function useT() {
  const app = useApp();
  return (str: string) => app.i18n.t(str, { ns: [pkg.name, 'data-visualization', 'client'] });
}

export function tStr(key: string) {
  return `{{t(${JSON.stringify(key)}, { ns: ['${pkg.name}', 'data-visualization', 'client'], nsMode: 'fallback' })}}`;
}

export function lang(key: string) {
  return i18n.t(key, { ns: [pkg.name, 'data-visualization', 'client'] });
}
