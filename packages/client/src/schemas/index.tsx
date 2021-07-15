import { createContext } from 'react';

export * from '../components/schema-renderer';
export const VisibleContext = createContext(null);
export const DesignableBarContext = createContext(null);

export function useDefaultAction() {
  return {
    async run () {}
  }
}
