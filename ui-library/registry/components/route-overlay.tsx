import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useTranslation } from '@nocobase/i18n/client';
import { XIcon } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { useLocation, useNavigate, type To } from 'react-router';

import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '#components/ui/dialog';
import { cn } from 'cn';

import { RouteOverlayContext } from './use-route-overlay.js';

export interface RouteOverlayProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  /** Where closing navigates. Defaults to the parent route, keeping the current search string. */
  readonly closeTo?: To;
  /** Runs before every close; resolving `false` keeps the overlay open, for example to guard unsaved changes. */
  readonly beforeClose?: () => boolean | Promise<boolean>;
  readonly className?: string;
}

// Lets an overlay rendered through another overlay's outlet return focus into
// the enclosing panel. Two overlays reached by one URL mount in the same
// commit, so the nested one never observes the parent panel taking focus and
// would otherwise fall back to `document.body`.
const ParentPopupContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

/**
 * The shared implementation of `RouteDialog` and `RouteDrawer`: a modal that is open for as long as its route matches,
 * and closes by navigating away from it. Route registration stays with the application.
 */
export function RouteOverlay({
  title,
  description,
  children,
  footer,
  closeTo,
  beforeClose,
  className,
  drawer = false,
}: RouteOverlayProps & { readonly drawer?: boolean }): ReactElement {
  const { t } = useTranslation();
  const parentPopup = useContext(ParentPopupContext);
  const popupRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const [closingLocation, setClosingLocation] = useState<
    typeof location | null
  >(null);
  const isClosing = closingLocation === location;
  const pendingRef = useRef<Promise<void> | null>(null);
  const generationRef = useRef(0);

  // A still-mounted parent can change location while its confirmation is pending.
  // Invalidate that request as well as requests from an unmounted route.
  useLayoutEffect(() => {
    generationRef.current += 1;
    pendingRef.current = null;
    return () => {
      generationRef.current += 1;
    };
  }, [location]);

  const close = useCallback((): Promise<void> => {
    if (pendingRef.current) return pendingRef.current;
    const requestGeneration = generationRef.current;
    setClosingLocation(location);
    const request = Promise.resolve()
      .then(async () => {
        const allowed = beforeClose ? await beforeClose() : true;
        if (allowed && generationRef.current === requestGeneration) {
          await navigate(
            closeTo ?? { pathname: '..', search: location.search, hash: '' },
            { relative: 'route', replace: true },
          );
        }
      })
      .finally(() => {
        if (generationRef.current === requestGeneration) {
          pendingRef.current = null;
          setClosingLocation(null);
        }
      });
    pendingRef.current = request;
    return request;
  }, [beforeClose, closeTo, location, navigate]);
  const value = useMemo(() => ({ close, isClosing }), [close, isClosing]);

  return (
    <RouteOverlayContext.Provider value={value}>
      {/* Covers the panel body too, so an overlay placed at this page's outlet
          finds the enclosing panel without knowing where the outlet lives. */}
      <ParentPopupContext.Provider value={popupRef}>
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open)
              void close().catch((error: unknown) => {
                console.error('Failed to close route overlay', error);
              });
          }}
        >
          <DialogPortal>
            {/* Each nested panel needs its own backdrop above its parent panel. */}
            <DialogOverlay forceRender />
            <DialogPrimitive.Popup
              ref={popupRef}
              data-slot='route-overlay-content'
              data-presentation={drawer ? 'drawer' : 'dialog'}
              finalFocus={() => {
                const previous = previousFocusRef.current;
                if (parentPopup?.current) {
                  return previous?.isConnected &&
                    parentPopup.current.contains(previous)
                    ? previous
                    : parentPopup.current;
                }
                return true;
              }}
              className={cn(
                // The frame of `DialogContent` (position, surface, ring, motion), laid out as a column so the header and
                // footer stay fixed while only the body scrolls within the viewport cap.
                'fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
                // Route dialogs hold the 5-8 field forms of guideline I1, hence wider than the plain dialog's default.
                'flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl',
                // The viewport constraints are deliberate; all ordinary styling uses theme tokens.
                drawer &&
                  'top-0 right-0 left-auto h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 rounded-none sm:max-w-xl data-open:slide-in-from-right data-open:zoom-in-100',
                className,
              )}
            >
              {/* The regions reproduce `DialogContent`'s `p-6 gap-5` around the dialog primitives, split so the body can
                  scroll on its own: the header and body own the padding, and the body's top padding is the gap. */}
              <header
                data-slot='route-overlay-header'
                className='shrink-0 px-6 pt-6'
              >
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  {description != null && (
                    <DialogDescription>{description}</DialogDescription>
                  )}
                </DialogHeader>
              </header>
              <div
                data-slot='route-overlay-body'
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto px-6 pt-5',
                  footer != null ? 'pb-5' : 'pb-6',
                )}
              >
                {children}
              </div>
              {footer != null && (
                <footer data-slot='route-overlay-footer' className='shrink-0'>
                  {/* `DialogFooter` pulls itself out of `DialogContent`'s padding with negative margins; here it
                      already sits at the panel's edges, and the panel clips the corners. */}
                  <DialogFooter className='mx-0 mb-0 rounded-none'>
                    {footer}
                  </DialogFooter>
                </footer>
              )}
              <DialogClose
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='absolute top-2 right-2'
                  />
                }
              >
                <XIcon />
                <span className='sr-only'>
                  {t('routeOverlay.close', { defaultValue: 'Close' })}
                </span>
              </DialogClose>
            </DialogPrimitive.Popup>
          </DialogPortal>
        </Dialog>
      </ParentPopupContext.Provider>
    </RouteOverlayContext.Provider>
  );
}
