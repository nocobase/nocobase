/**
 * The provider that collects what pages register (`page-context.ts`), for the application's assistant.
 */
import { useState, type PropsWithChildren, type ReactElement } from 'react';

import {
  PageContextSinkContext,
  PageContextStoreContext,
  createPageContextStore,
  type PageContextStore,
} from './page-context.js';

/** Collects what the pages under it register; read it with `usePageContextEntries`. */
export function PageContextProvider({
  children,
  store: given,
}: PropsWithChildren<{
  readonly store?: PageContextStore;
}>): ReactElement {
  const [own] = useState(createPageContextStore);
  const store = given ?? own;
  return (
    <PageContextStoreContext.Provider value={store}>
      <PageContextSinkContext.Provider value={store}>
        {children}
      </PageContextSinkContext.Provider>
    </PageContextStoreContext.Provider>
  );
}
