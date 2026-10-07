/**
 * The levels a page puts in the shell header's breadcrumb. The layout renders the trail from the route tree by default;
 * a page whose trail names records — a project's name, an issue's identifier — or does not follow its URL declares the
 * whole trail with `usePageBreadcrumb`, and the layout reads it with `usePageBreadcrumbLevels`. Without a provider
 * the hook does nothing, so a plugin page declaring its trail still renders in a shell that has no header trail.
 */
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Context,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import type { To } from 'react-router';

export interface PageBreadcrumbLevel {
  readonly label: string;
  /** Where the level leads; the last level is the current page and never links. */
  readonly to?: To;
}

type PageBreadcrumbSetter = (
  order: number,
  levels: readonly PageBreadcrumbLevel[] | null,
) => void;

const PageBreadcrumbSetterContext: Context<PageBreadcrumbSetter | null> =
  createContext<PageBreadcrumbSetter | null>(null);
const PageBreadcrumbLevelsContext: Context<
  readonly PageBreadcrumbLevel[] | undefined
> = createContext<readonly PageBreadcrumbLevel[] | undefined>(undefined);

// A page renders before the pages nested in it, so the deepest page declaring a trail holds the highest number.
let nextOrder = 0;

/** Holds the trail the current page declares; a layout wraps both its header and its pages in it. */
export function PageBreadcrumbProvider({
  children,
}: PropsWithChildren): ReactElement {
  const [declared, setDeclared] = useState<
    ReadonlyMap<number, readonly PageBreadcrumbLevel[]>
  >(() => new Map());
  const set = useCallback<PageBreadcrumbSetter>((order, levels) => {
    setDeclared((previous) => {
      const next = new Map(previous);
      if (levels) next.set(order, levels);
      else next.delete(order);
      return next;
    });
  }, []);
  const current = useMemo(() => {
    let deepest = -1;
    for (const order of declared.keys()) if (order > deepest) deepest = order;
    return declared.get(deepest);
  }, [declared]);
  return createElement(
    PageBreadcrumbSetterContext.Provider,
    { value: set },
    createElement(
      PageBreadcrumbLevelsContext.Provider,
      { value: current },
      children,
    ),
  );
}

/**
 * Declares the current page's whole trail, the page itself last, in place of the one the route tree gives. Pass
 * `null` or `undefined` while the records it names are loading: the route trail shows until then. When pages nested
 * in one another both declare one, the innermost wins, and the outer one shows again once it closes.
 */
export function usePageBreadcrumb(
  levels: readonly PageBreadcrumbLevel[] | null | undefined,
): void {
  const set = useContext(PageBreadcrumbSetterContext);
  const [order] = useState(() => ++nextOrder);
  // Pages build the array on every render; compare what it says, not its identity.
  const signature = levels ? JSON.stringify(levels) : null;
  useEffect(() => {
    if (!set || signature === null) return;
    set(order, JSON.parse(signature) as readonly PageBreadcrumbLevel[]);
    return () => set(order, null);
  }, [set, order, signature]);
}

/** The trail the current page declared, or `undefined` when it leaves the trail to the route tree. */
export function usePageBreadcrumbLevels():
  readonly PageBreadcrumbLevel[] | undefined {
  return useContext(PageBreadcrumbLevelsContext);
}
