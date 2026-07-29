import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RouteOverlayDepthContext,
  RouteSurfaceContext,
} from "./route-surface-context";
import {
  type RouteSurfaceBeforeClose,
  useRouteSurfaceState,
} from "./use-route-surface-state";

export function RouteDrawer({
  title,
  description,
  actions,
  children,
  closeLabel,
  closeTo,
  beforeClose,
  className,
  nested,
  stackOffset = "4rem",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  closeLabel: string;
  closeTo: string;
  beforeClose?: RouteSurfaceBeforeClose;
  className?: string;
  nested?: ReactNode;
  stackOffset?: string;
}) {
  const parentOverlayDepth = useContext(RouteOverlayDepthContext);
  const isNestedOverlay = parentOverlayDepth > 0;
  const { open, setOpen, close, navigateAfterClose } = useRouteSurfaceState({
    closeTo,
    beforeClose,
    animated: true,
  });
  const handleOpenChange = useCallback(
    (nextOpen: boolean, eventDetails: DrawerPrimitive.Root.ChangeEventDetails) => {
      if (nextOpen) {
        setOpen(true);
        return;
      }

      eventDetails.cancel();
      void close();
    },
    [close, setOpen]
  );
  const stackStyle = {
    "--peek": stackOffset,
    "--stack-step": 0,
    "--bleed": "0px",
  } as CSSProperties;

  return (
    <RouteSurfaceContext.Provider value={close}>
      <RouteOverlayDepthContext.Provider value={parentOverlayDepth + 1}>
        <DrawerPrimitive.Root
          open={open}
          swipeDirection="right"
          onOpenChange={handleOpenChange}
          onOpenChangeComplete={(nextOpen) => {
            if (!nextOpen) navigateAfterClose();
          }}
        >
          <DrawerPrimitive.Portal>
            {isNestedOverlay ? (
              <RouteDrawerBackdrop open={open} onClose={close} />
            ) : (
              <DrawerPrimitive.Backdrop
                className="fixed inset-0 z-50 min-h-dvh bg-black/10 opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] select-none data-ending-style:pointer-events-none data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 supports-backdrop-filter:backdrop-blur-xs"
                onClick={(event) => {
                  event.stopPropagation();
                  void close();
                }}
              />
            )}
            <DrawerPrimitive.Viewport className="pointer-events-none fixed inset-0 z-50 select-none">
            <DrawerPrimitive.Popup
              style={stackStyle}
              className={cn(
                "group/route-drawer pointer-events-auto fixed inset-y-0 right-0 z-50 flex w-full transform-[translate3d(var(--translate-x,0px),0,0)] flex-row bg-popover text-sm text-popover-foreground shadow-xl transition-transform duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform outline-none sm:w-full lg:w-[42vw] lg:min-w-[40rem]",
                "[--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)]",
                "[--closed-transform:translate3d(calc(100%+2px),0,0)] [--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset))]",
                "data-ending-style:transform-(--closed-transform) data-ending-style:opacity-[0.9999] data-starting-style:transform-(--closed-transform) data-swiping:duration-0 data-nested-drawer-swiping:duration-0",
                "data-nested-drawer-open:overflow-hidden",
                className
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 bg-black/10 opacity-0 transition-opacity duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-nested-drawer-open/route-drawer:opacity-100 supports-backdrop-filter:backdrop-blur-xs"
              />
              <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain select-text group-data-swiping/route-drawer:select-none">
                <header className="relative shrink-0 border-b px-5 py-4 pr-14 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <DrawerPrimitive.Title className="font-heading truncate text-lg font-medium text-foreground">
                        {title}
                      </DrawerPrimitive.Title>
                      {description ? (
                        <DrawerPrimitive.Description className="text-sm text-balance text-muted-foreground">
                          {description}
                        </DrawerPrimitive.Description>
                      ) : null}
                    </div>
                    {actions ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {actions}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-3 right-3"
                    onClick={() => void close()}
                  >
                    <X />
                    <span className="sr-only">{closeLabel}</span>
                  </Button>
                </header>
                {children}
              </DrawerPrimitive.Content>
            </DrawerPrimitive.Popup>
            </DrawerPrimitive.Viewport>
          </DrawerPrimitive.Portal>
          {nested}
        </DrawerPrimitive.Root>
      </RouteOverlayDepthContext.Provider>
    </RouteSurfaceContext.Provider>
  );
}

function RouteDrawerBackdrop({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => Promise<boolean>;
}) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-50 min-h-dvh bg-black/10 transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] select-none supports-backdrop-filter:backdrop-blur-xs",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={(event) => {
        event.stopPropagation();
        void onClose();
      }}
    />
  );
}

export function RouteDrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-2 border-t px-5 py-4",
        className
      )}
      {...props}
    />
  );
}
