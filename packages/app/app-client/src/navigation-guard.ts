import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type Context,
} from 'react';

/**
 * How the navigation a guard decides on started: `push` and `replace` come from code below the boundary (a link,
 * `navigate()`, an overlay's close); `pop` is everything else, such as browser back and forward, the phone's back
 * gesture, or a location changed outside the boundary.
 */
export interface NavigationAttempt {
  readonly action: 'push' | 'replace' | 'pop';
}

export type NavigationGuard = (
  attempt: NavigationAttempt,
) => boolean | Promise<boolean>;
export const NavigationGuardContext: Context<Set<NavigationGuard> | null> =
  createContext<Set<NavigationGuard> | null>(null);

/** Registers a leave decision with the application's stable navigation boundary. */
export function useNavigationGuard(guard: NavigationGuard): void {
  const guards = useContext(NavigationGuardContext);
  const guardRef = useRef(guard);
  useLayoutEffect(() => {
    guardRef.current = guard;
  }, [guard]);
  useLayoutEffect(() => {
    if (!guards)
      throw new Error('useNavigationGuard requires NavigationGuardProvider.');
    const decide = (attempt: NavigationAttempt): boolean | Promise<boolean> =>
      guardRef.current(attempt);
    guards.add(decide);
    return () => {
      guards.delete(decide);
    };
  }, [guards]);
}
