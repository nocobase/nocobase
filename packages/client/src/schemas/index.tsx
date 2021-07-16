import { createContext } from 'react';

export * from '../components/schema-renderer';
export const VisibleContext = createContext(null);
export const DesignableBarContext = createContext(null);

export function useDefaultAction() {
  return {
    async run () {}
  }
}

import { extend } from 'umi-request';

export const request = extend({
  prefix: 'http://localhost:23003/api/',
  timeout: 1000,
});
