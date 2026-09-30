// Copied from ui-library/registry/components with plugin-local imports and namespace.
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
  type Context,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { useLocation, useNavigate, type To } from 'react-router';

import { Button } from './ui/button.js';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from './ui/dialog.js';
import { cn } from '../lib/utils.js';
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
const ParentPopupContext: Context<RefObject<HTMLDivElement | null> | null> =
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
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
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
              aria-modal='true'
              ref={popupRef}
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
                'fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover text-popover-foreground shadow-lg outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
                'flex max-h-[calc(100svh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl',
                // The viewport constraints are deliberate; all ordinary styling uses theme tokens.
                drawer &&
                  'top-0 right-0 left-auto h-svh max-h-svh w-full max-w-full translate-x-0 translate-y-0 rounded-none sm:max-w-xl data-open:slide-in-from-right data-open:zoom-in-100',
                className,
              )}
            >
              <header className='shrink-0 space-y-2 border-b p-4 pr-12'>
                <DialogTitle>{title}</DialogTitle>
                {description != null && (
                  <DialogDescription>{description}</DialogDescription>
                )}
              </header>
              <div className='min-h-0 flex-1 overflow-y-auto p-4'>
                {children}
              </div>
              {footer != null && (
                <footer className='flex shrink-0 flex-wrap justify-end gap-2 border-t p-4'>
                  {footer}
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
