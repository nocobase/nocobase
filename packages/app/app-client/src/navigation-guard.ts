import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type Context,
} from 'react';

export type NavigationGuard = () => boolean;
export const NavigationGuardContext: Context<Set<NavigationGuard> | null> =
  createContext<Set<NavigationGuard> | null>(null);

/** Registers a synchronous leave decision with the application's stable navigation boundary. */
export function useNavigationGuard(guard: NavigationGuard): void {
  const guards = useContext(NavigationGuardContext);
  const guardRef = useRef(guard);
  useLayoutEffect(() => {
    guardRef.current = guard;
  }, [guard]);
  useLayoutEffect(() => {
    if (!guards)
      throw new Error('useNavigationGuard requires NavigationGuardProvider.');
    const decide = (): boolean => guardRef.current();
    guards.add(decide);
    return () => {
      guards.delete(decide);
    };
  }, [guards]);
}
