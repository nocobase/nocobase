import { useContext, useMemo, type PropsWithChildren } from 'react';
import type { AIWorkContextItem } from './types.js';
import {
  AIPageContextResolverContext,
  AIPageContextScopeContext,
  type AIPageContextResolver,
} from './page-context-store.js';

export function AIPageContextResolverProvider({
  resolve,
  children,
}: PropsWithChildren<{ resolve: AIPageContextResolver }>) {
  return (
    <AIPageContextResolverContext.Provider value={resolve}>
      {children}
    </AIPageContextResolverContext.Provider>
  );
}

export function AIPageContextScope({
  context,
  mode = 'replace',
  children,
}: PropsWithChildren<{
  context: AIWorkContextItem | AIWorkContextItem[];
  mode?: 'replace' | 'append';
}>) {
  const inheritedContext = useContext(AIPageContextScopeContext);
  const value = useMemo(() => {
    const ownContext = Array.isArray(context) ? context : [context];
    if (mode !== 'append') return ownContext;
    const combined = [...inheritedContext, ...ownContext];
    return combined.filter((item, index) => {
      if (!item.id) return true;
      return (
        combined.findLastIndex(
          (candidate) =>
            candidate.type === item.type && candidate.id === item.id,
        ) === index
      );
    });
  }, [context, inheritedContext, mode]);
  return (
    <AIPageContextScopeContext.Provider value={value}>
      {children}
    </AIPageContextScopeContext.Provider>
  );
}
