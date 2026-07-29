import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { type ReactNode, useCallback, useContext } from "react";

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

export function RouteDialog({
  title,
  description,
  actions,
  children,
  closeLabel,
  closeTo,
  beforeClose,
  className,
  nested,
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
}) {
  const parentOverlayDepth = useContext(RouteOverlayDepthContext);
  const isNestedOverlay = parentOverlayDepth > 0;
  const { open, setOpen, close, navigateAfterClose } = useRouteSurfaceState({
    closeTo,
    beforeClose,
    animated: true,
  });
  const handleOpenChange = useCallback(
    (nextOpen: boolean, eventDetails: DialogPrimitive.Root.ChangeEventDetails) => {
      if (nextOpen) {
        setOpen(true);
        return;
      }

      eventDetails.cancel();
      void close();
    },
    [close, setOpen]
  );

  return (
    <RouteSurfaceContext.Provider value={close}>
      <RouteOverlayDepthContext.Provider value={parentOverlayDepth + 1}>
        <DialogPrimitive.Root
          open={open}
          onOpenChange={handleOpenChange}
          onOpenChangeComplete={(nextOpen) => {
            if (!nextOpen) navigateAfterClose();
          }}
        >
          <DialogPrimitive.Portal>
            {isNestedOverlay ? (
              <RouteDialogBackdrop open={open} onClose={close} />
            ) : (
              <DialogPrimitive.Backdrop
                className="fixed inset-0 isolate z-50 bg-black/10 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                onClick={(event) => {
                  event.stopPropagation();
                  void close();
                }}
              />
            )}
            <DialogPrimitive.Popup
            className={cn(
              "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 duration-150 outline-none sm:max-w-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              className
            )}
          >
            <header className="relative shrink-0 border-b px-5 py-4 pr-14 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <DialogPrimitive.Title className="font-heading truncate text-lg font-medium">
                    {title}
                  </DialogPrimitive.Title>
                  {description ? (
                    <DialogPrimitive.Description className="text-sm text-muted-foreground">
                      {description}
                    </DialogPrimitive.Description>
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
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
          {nested}
        </DialogPrimitive.Root>
      </RouteOverlayDepthContext.Provider>
    </RouteSurfaceContext.Provider>
  );
}

function RouteDialogBackdrop({
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
        "fixed inset-0 isolate z-50 bg-black/10 transition-opacity duration-150 supports-backdrop-filter:backdrop-blur-xs",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={(event) => {
        event.stopPropagation();
        void onClose();
      }}
    />
  );
}
