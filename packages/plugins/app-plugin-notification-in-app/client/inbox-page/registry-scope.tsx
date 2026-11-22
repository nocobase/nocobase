/** The registry's React components: the provider that gives the inbox its contributors, and the scope a part renders in. */
import {
  NamespaceScope,
  useOptionalI18nRuntime,
  type Namespace,
} from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';

import { InboxRegistryContext, type InboxRegistry } from './registry.js';

export interface InboxRegistryProviderProps {
  readonly registry: InboxRegistry;
  readonly children: ReactNode;
}

export function InboxRegistryProvider({
  registry,
  children,
}: InboxRegistryProviderProps): ReactElement {
  return (
    <InboxRegistryContext.Provider value={registry}>
      {children}
    </InboxRegistryContext.Provider>
  );
}

/**
 * Renders a contributor's part in its namespace, adding the resources it brings first. Adding is synchronous and
 * idempotent, so the first render is already translated.
 */
export interface ContributorScopeProps {
  readonly namespace?: Namespace;
  readonly resources?: Readonly<Record<string, object>>;
  readonly children: ReactNode;
}

export function ContributorScope({
  namespace,
  resources,
  children,
}: ContributorScopeProps): ReactElement {
  const runtime = useOptionalI18nRuntime();
  if (runtime && namespace && resources)
    for (const [locale, resource] of Object.entries(resources))
      if (!runtime.i18n.hasResourceBundle(locale, namespace))
        runtime.i18n.addResourceBundle(locale, namespace, resource, true);
  if (!namespace) return <>{children}</>;
  return <NamespaceScope ns={namespace}>{children}</NamespaceScope>;
}
