/* eslint-disable react-refresh/only-export-components -- the provider and its hooks are intentionally colocated */
import {
  createContext,
  useCallback,
  useMemo,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefCallback,
} from 'react';

import {
  AIFormRegistry,
  type AIFormRegistration,
  type AIFormRegistrationHandle,
} from './form-registry.js';

const RegistryContext = createContext<AIFormRegistry | null>(null);

export interface AIFormRegistryProviderProps {
  readonly children: ReactNode;
  /** A nested provider is an isolated scope, not a merged global registry. */
  readonly registry?: AIFormRegistry;
}

/** Mount inside the application's keyed authenticated-identity boundary. */
export function AIFormRegistryProvider({
  children,
  registry,
}: AIFormRegistryProviderProps): ReactElement {
  const [ownedRegistry] = useState(() => new AIFormRegistry());
  return (
    <RegistryContext.Provider value={registry ?? ownedRegistry}>
      {children}
    </RegistryContext.Provider>
  );
}

export function useAIFormRegistry(): AIFormRegistry {
  const registry = useContext(RegistryContext);
  if (!registry)
    throw new Error('useAIFormRegistry requires AIFormRegistryProvider.');
  return registry;
}

/** Register an attached form. This callback does not select or upload its context. */
export function useAIForm<T extends Element = HTMLFormElement>(
  registration: AIFormRegistration,
): RefCallback<T> {
  const registry = useAIFormRegistry();
  const mountedRef = useRef<AIFormRegistrationHandle | null>(null);
  const committedRef = useRef(registration);
  const attachmentsRef = useRef(new Map<object, AIFormRegistrationHandle>());
  const { id, identity } = registration;
  const scope = useMemo(
    () => ({ id, identity, registry }),
    [id, identity, registry],
  );
  // Record changes create a new callback: React detaches the old token before attaching the new one.
  const callback = useCallback<RefCallback<T>>(
    (node) => {
      const previous = attachmentsRef.current.get(scope);
      previous?.unregister();
      attachmentsRef.current.delete(scope);
      if (mountedRef.current === previous) mountedRef.current = null;
      if (node) {
        const committed = committedRef.current;
        const handle = registry.register(
          committed.id === id && committed.identity === identity
            ? committed
            : registration,
        );
        attachmentsRef.current.set(scope, handle);
        mountedRef.current = handle;
        return () => {
          handle.unregister();
          if (mountedRef.current === handle) mountedRef.current = null;
          if (attachmentsRef.current.get(scope) === handle)
            attachmentsRef.current.delete(scope);
        };
      }
    },
    // Callback implementations are refreshed after every committed render below, without remounting.
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps -- changing adapters must not replace the live instance token
    [registry, id, identity, scope],
  );
  useLayoutEffect(() => {
    committedRef.current = registration;
    mountedRef.current?.update(registration);
  });
  return callback;
}
