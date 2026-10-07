/**
 * The provider that collects what pages register (`page-context.ts`), and the slot an application fills with an
 * assistant's button. It renders nothing unless its context is filled.
 */
import {
  useContext,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import {
  IntakeAgentSlotContext,
  PageContextSinkContext,
  PageContextStoreContext,
  createPageContextStore,
  type IntakeAgentSlotProps,
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

/** "Let an agent organize", when the application fills the slot; nothing otherwise. */
export function IntakeAgentSlot(
  props: IntakeAgentSlotProps,
): ReactElement | null {
  const fill = useContext(IntakeAgentSlotContext);
  return fill ? <fill.Organize {...props} /> : null;
}
