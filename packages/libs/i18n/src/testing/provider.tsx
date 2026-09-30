import {
  createElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { I18nProvider, NamespaceScope } from '../client/context.js';
import type { I18nRuntime, Namespace } from '../core/index.js';

export interface TestI18nProviderProps {
  readonly runtime: I18nRuntime;
  /**
   * The namespace the application host would scope the component to — the owning package, for a page rendered under
   * that package's own routes.
   *
   * Leave it out to render the component the way the application renders something a plugin exports for reuse: in the
   * application's scope. A component that forgot to bind its namespace then fails to find its keys, which a strict
   * runtime reports.
   */
  readonly namespace?: Namespace;
}

/**
 * Mounts a test runtime the way an application does: the same provider, and optionally the same namespace scope.
 *
 * It renders the package's own `I18nProvider` and `NamespaceScope` rather than contexts of its own, so what the
 * component under test reads is exactly what it reads in an application.
 */
export function TestI18nProvider({
  runtime,
  namespace,
  children,
}: PropsWithChildren<TestI18nProviderProps>): ReactElement {
  return createElement(
    I18nProvider,
    { runtime },
    namespace
      ? createElement(NamespaceScope, { ns: namespace }, children)
      : children,
  );
}
