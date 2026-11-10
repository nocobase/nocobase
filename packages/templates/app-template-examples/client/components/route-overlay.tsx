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

import { DiscardScope } from '#components/discard-guard';
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
import {
  RouteOverlayContext,
  RouteOverlayHostContext,
  type RouteOverlayHostConfig,
  type RouteOverlayHostValue,
} from '@nocobase/app-client/route-containers';
import { cn } from 'cn';

// The template's own forms that ask their own question render it inside the overlay; see `discard-guard.tsx`.
export { OwnDiscardQuestion } from '#components/discard-guard';

export interface RouteOverlayProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  /** Where closing navigates. Defaults to the parent route, keeping the current search string. */
  readonly closeTo?: To;
  /** Runs before every close; resolving `false` keeps the overlay open, for example to guard unsaved changes. */
  readonly beforeClose?: () => boolean | Promise<boolean>;
  /**
   * Unsaved changes the overlay cannot see by itself (guideline T3.9, mobile.md M7.4). Every route overlay asks
   * "Discard changes?" before every way out — ×, Esc, the backdrop, Cancel through `close()`, browser back and
   * forward, the phone's back gesture and links — while a `FeedbackForm` inside has unsaved input, and reloading or
   * closing the tab then gets the browser's warning. A `FeedbackForm` given `values={form.getValues}` and
   * `savedValues` is unsaved whenever its values differ from the saved ones, whatever changed them (a Select, a date,
   * a relation, an upload, a restored draft); one without them is unsaved once the user typed or changed a native
   * field in it. `dirty` adds what neither shows (a function is read when leaving): `false` or `undefined` never
   * switches off unsaved input the overlay found, and a saved draft does not count as saved. Passing it also counts
   * typing in any other `<form>` inside the overlay. Leaving does not ask during the save itself (while the
   * `FeedbackForm` is still running its `onSubmit`: navigate or `close()` from it), and still asks while the save
   * button is disabled, because the input is still there to lose. After a save that failed or was rejected, browser back
   * and a reload still ask.
   */
  readonly dirty?: boolean | (() => boolean);
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
 *
 * On a route that declares a `dialog` or `drawer` presentation the application has already opened the panel, and this
 * component configures that one instead of opening a second: its title, description, footer, `closeTo` and
 * `beforeClose` move to the host and its children render in the host's body. On any other route it opens its own.
 * The host context comes from `@nocobase/app-client`, so a plugin's own copy of this component joins the same panel.
 */
export function RouteOverlay({
  dirty,
  children,
  ...props
}: RouteOverlayProps & { readonly drawer?: boolean }): ReactElement {
  const host = useContext(RouteOverlayHostContext);
  // Always on inside an application, whether or not the page passes `dirty`: a page cannot leave out the question by
  // leaving out the prop.
  const content = (
    <OverlayDiscardScope dirty={dirty}>{children}</OverlayDiscardScope>
  );
  return host ? (
    <HostedRouteOverlay host={host} {...props}>
      {content}
    </HostedRouteOverlay>
  ) : (
    <RouteOverlayFrame {...props}>{content}</RouteOverlayFrame>
  );
}

/** The overlay's discard question, over the forms in the panel it renders inside. */
function OverlayDiscardScope({
  dirty,
  children,
}: {
  readonly dirty?: boolean | (() => boolean);
  readonly children?: ReactNode;
}): ReactNode {
  const popupRef = useContext(ParentPopupContext);
  return (
    <DiscardScope containerRef={popupRef} dirty={dirty}>
      {children}
    </DiscardScope>
  );
}

function HostedRouteOverlay({
  host,
  children,
  drawer: _drawer,
  ...config
}: RouteOverlayProps & {
  readonly host: RouteOverlayHostValue;
  readonly drawer?: boolean;
}): ReactElement {
  // Runs after every render so the footer and guard the host shows are always this render's. There is no cleanup:
  // the host stops using the configuration once it is told the page is gone, and an `<Activity>` that only hides
  // the page during a recheck must not take its close guard away.
  useLayoutEffect(() => {
    host.configure(config);
  });
  return (
    <RouteOverlayHostContext.Provider value={null}>
      {children}
    </RouteOverlayHostContext.Provider>
  );
}

export interface RouteOverlayHostProps {
  readonly drawer?: boolean;
  /** Shown until the hosted page configures its own title, and whenever its content is concealed. */
  readonly title: ReactNode;
  /**
   * True while the page component is mounted. While it is false — the module is loading, failed or was denied — the
   * host ignores what an earlier mount configured and closes without a guard.
   */
  readonly ready?: boolean;
  /**
   * True while the mounted page is hidden, for example during an authorization recheck: the host shows only its own
   * title and no footer, so nothing the page derived from protected data stays on screen. The page's close guard
   * is temporarily blocked until the page's effects reconnect, because hiding disconnects form dirty registrations.
   */
  readonly concealed?: boolean;
  readonly children?: ReactNode;
}

/**
 * The panel the application opens for a route that declares a `dialog` or `drawer` presentation, before the page
 * module, its authorization check or its data are ready. Waiting, denial and failure render as its children; once the
 * page renders its own `RouteDialog` or `RouteDrawer` inside, that configures this panel. There is still one panel
 * and one focus trap, and the same close path and focus return as a standalone overlay. A hosted page renders its
 * `RouteDialog` or `RouteDrawer` unconditionally, as its root.
 */
export function RouteOverlayHost({
  drawer = false,
  title,
  ready = false,
  concealed = false,
  children,
}: RouteOverlayHostProps): ReactElement {
  const [config, setConfig] = useState<RouteOverlayHostConfig | null>(null);
  const host = useMemo<RouteOverlayHostValue>(
    () => ({ configure: setConfig }),
    [],
  );
  const page = ready ? config : null;
  const shown = concealed ? null : page;
  return (
    <RouteOverlayFrame
      drawer={drawer}
      title={shown?.title ?? title}
      description={shown?.description}
      footer={shown?.footer}
      closeTo={page?.closeTo}
      beforeClose={page?.beforeClose}
      closeBlocked={ready && concealed}
      className={page?.className}
    >
      <RouteOverlayHostContext.Provider value={host}>
        {children}
      </RouteOverlayHostContext.Provider>
    </RouteOverlayFrame>
  );
}

function RouteOverlayFrame({
  title,
  description,
  children,
  footer,
  closeTo,
  beforeClose,
  className,
  drawer = false,
  closeBlocked = false,
}: RouteOverlayProps & {
  readonly drawer?: boolean;
  readonly closeBlocked?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const parentPopup = useContext(ParentPopupContext);
  const popupRef = useRef<HTMLDivElement>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  // A parent route's Activity can stop at its first DOM element, while this portal lives outside that element.
  // Base UI creates the portal after mount, so track the actual node before connecting its visibility lifecycle.
  useLayoutEffect(() => {
    if (!portal) return;
    portal.style.removeProperty('display');
    return () => {
      portal.style.display = 'none';
    };
  }, [portal]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const closeScope = useMemo(
    () => ({ location, closeBlocked }),
    [location, closeBlocked],
  );
  const [closingScope, setClosingScope] = useState<typeof closeScope | null>(
    null,
  );
  const isClosing = closingScope === closeScope;
  const pendingRef = useRef<Promise<void> | null>(null);
  const generationRef = useRef(0);

  // A location change or concealment invalidates pending closes. Activity cleanup can resolve a form's old
  // confirmation, but that result must never navigate, including after permission is restored.
  useLayoutEffect(() => {
    generationRef.current += 1;
    pendingRef.current = null;
    return () => {
      generationRef.current += 1;
      setClosingScope(null);
    };
  }, [location, closeBlocked]);

  const close = useCallback((): Promise<void> => {
    if (closeBlocked) return Promise.resolve();
    if (pendingRef.current) return pendingRef.current;
    const requestGeneration = generationRef.current;
    setClosingScope(closeScope);
    const request = Promise.resolve()
      .then(async () => {
        // A recheck can start while an earlier confirmation is open, or before this microtask runs.
        if (generationRef.current !== requestGeneration) return;
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
          setClosingScope(null);
        }
      });
    pendingRef.current = request;
    return request;
  }, [beforeClose, closeBlocked, closeScope, closeTo, location, navigate]);
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
          <DialogPortal ref={setPortal}>
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

/** Ends a `RouteOverlayHost`'s reach, so a route rendered inside one that is not hosted builds its own overlay. */
export function RouteOverlayHostBoundary({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <RouteOverlayHostContext.Provider value={null}>
      {children}
    </RouteOverlayHostContext.Provider>
  );
}
