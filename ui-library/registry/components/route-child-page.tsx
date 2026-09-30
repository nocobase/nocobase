import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';

import { cn } from '@/lib/utils';

export interface RouteChildPageProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

// The scrolling element of the layer a child page is rendered inside, when it is rendered inside one.
const EnclosingLayerContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

/**
 * A child page, laid over the page that opened it.
 *
 * It is the third way a child route can present itself, beside `RouteDialog` and `RouteDrawer`: those float in the
 * middle or at the side, this one covers the content area. Because it covers rather than replaces, the page beneath
 * keeps its DOM — a draft being typed, a scroll position — and gets it back when this layer closes.
 *
 * Unlike the other two it is deliberately **not** modal. It does not portal out of the content area or trap focus,
 * because the user is still on a page of the application and must be able to reach the sidebar. What closes it is
 * the `BackButton` above its heading, or the browser's back button — not an X or Escape.
 *
 * It is two elements, the way the layout's content area is: the outer one positions and never scrolls, the inner one
 * scrolls. A deeper layer rendered beside this component anchors to the content area, as this one does, which is
 * where a page's own outlet belongs. One rendered inside it — a child page of a tab, which can only render through
 * the tab's outlet — anchors to the outer element: it covers this layer whole instead of scrolling out of sight with
 * the content once the user has scrolled this page.
 */
export function RouteChildPage({
  children,
  className,
}: RouteChildPageProps): ReactElement {
  const enclosingScrollerRef = useContext(EnclosingLayerContext);
  const layerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Covering a page is not the same as closing it: the siblings underneath keep their DOM, and with it their place
  // in the tab order and the accessibility tree. Left alone they are reachable behind opaque paint — a keyboard
  // user tabs through controls nothing on screen shows, and focusing one scrolls the covered page into view while
  // the layer, anchored to the content area, does not move. `inert` switches off exactly what this layer covers.
  // The sidebar and the header are outside the content area and so outside this list, which is what keeps the
  // component non-modal. A sibling already marked belongs to the layer below and is left for it to restore.
  //
  // Inside another layer, what this one covers also surrounds it: the enclosing page's header and tab bar, up to that
  // layer's scrolling element. That element stays live, since it holds this layer; everything else in it is covered.
  // At this layer's own level only the siblings before it are covered: the ones after it are deeper layers.
  useEffect(() => {
    const layer = layerRef.current;
    const boundary = enclosingScrollerRef?.current;
    const covered: Element[] = [];
    const cover = (element: Element): void => {
      if (element.hasAttribute('inert')) return;
      element.setAttribute('inert', '');
      covered.push(element);
    };
    for (
      let sibling = layer?.previousElementSibling ?? null;
      sibling;
      sibling = sibling.previousElementSibling
    ) {
      cover(sibling);
    }
    if (layer && boundary?.contains(layer)) {
      for (
        let ancestor = layer.parentElement;
        ancestor && ancestor !== boundary;
        ancestor = ancestor.parentElement
      ) {
        for (
          let sibling = ancestor.previousElementSibling;
          sibling;
          sibling = sibling.previousElementSibling
        ) {
          cover(sibling);
        }
        for (
          let sibling = ancestor.nextElementSibling;
          sibling;
          sibling = sibling.nextElementSibling
        ) {
          cover(sibling);
        }
      }
    }
    return () => {
      for (const element of covered) element.removeAttribute('inert');
    };
  });

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden bg-background',
        className,
      )}
      data-slot='route-child-page'
      ref={layerRef}
    >
      {/* Scrolling stops at this layer rather than carrying on into the page it covers, which keeps that page's
          scroll position for when this layer closes. */}
      <div
        className='h-full overflow-y-auto overscroll-contain'
        ref={scrollerRef}
      >
        <EnclosingLayerContext.Provider value={scrollerRef}>
          {children}
        </EnclosingLayerContext.Provider>
      </div>
    </div>
  );
}
