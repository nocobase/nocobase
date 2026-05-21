import { useApp } from '@nocobase/client';
import { useCallback } from 'react';
import { NAMESPACE } from './constants';

export function useT() {
  const app = useApp();
  // TODO: Recommand to update the plugin sample code?
  return useCallback(
    (str: string, opts: Record<string, string> = {}) => app.i18n.t(str, { ns: [NAMESPACE, 'client'], ...opts }),
    [app],
  );
}

export function tStr(key: string) {
  return `{{t(${JSON.stringify(key)}, { ns: ['${NAMESPACE}', 'client'], nsMode: 'fallback' })}}`;
}
