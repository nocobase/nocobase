// @ts-ignore
import pkg from './../../package.json';
import { useApp } from '@nocobase/client';

export function useT() {
  const app = useApp();
  return (str: string) => app.i18n.t(str, { ns: pkg.name });
}

export function tStr(key: string) {
  return `{{t('${key}', { ns: '${pkg.name}', nsMode: 'fallback' })}}`;
}
