import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';

import { cn } from 'cn';

export interface RouteChildPageProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * A child page, laid over the page that opened it.
 *
 * It is the third way a child route can present itself, beside `RouteDialog` and `RouteDrawer`: those float in the
 * middle or at the side, this one covers the content area. Because it covers rather than replaces, the page beneath
 * keeps its DOM — a draft being typed, a scroll position — and gets it back when this layer closes.
 *
 * Unlike the other two it is deliberately **not** modal. It does not portal out of the content area or trap focus,
 * because the user is still on a page of the application and must be able to reach the sidebar. What closes it is
 * the header's breadcrumb, or the browser's back button — not an X or Escape.
 *
 * It is a single element, which both positions and scrolls. Anything absolutely positioned inside it therefore
 * moves with its scrolling — which is why the outlet for a deeper layer belongs *beside* this component rather
 * than within it. Nested inside, a deeper layer would resolve `inset-0` against this one and scroll out of sight
 * as soon as the user had scrolled this page. Kept as siblings, both layers anchor to the content area, and the
 * DOM gains no level for each level of routing.
 */
export function RouteChildPage({
  children,
  className,
}: RouteChildPageProps): ReactElement {
  const layerRef = useRef<HTMLDivElement>(null);

  // Covering a page is not the same as closing it: the siblings underneath keep their DOM, and with it their place
  // in the tab order and the accessibility tree. Left alone they are reachable behind opaque paint — a keyboard
  // user tabs through controls nothing on screen shows, and focusing one scrolls the covered page into view while
  // the layer, anchored to the content area, does not move. `inert` switches off exactly what this layer covers.
  // The sidebar and the header are outside the content area and so outside this list, which is what keeps the
  // component non-modal. A sibling already marked belongs to the layer below and is left for it to restore.
  useEffect(() => {
    const covered: Element[] = [];
    for (
      let sibling = layerRef.current?.previousElementSibling ?? null;
      sibling;
      sibling = sibling.previousElementSibling
    ) {
      if (sibling.hasAttribute('inert')) continue;
      sibling.setAttribute('inert', '');
      covered.push(sibling);
    }
    return () => {
      for (const sibling of covered) sibling.removeAttribute('inert');
    };
  });

  // Above everything the covered page positions itself — a sticky table header or board column header carries
  // `z-10`, and without a stacking level of its own this layer would paint underneath it.
  return (
    <div
      className={cn(
        'absolute inset-0 z-20 overflow-hidden overflow-y-auto bg-background',
        className,
      )}
      ref={layerRef}
    >
      {children}
    </div>
  );
}
