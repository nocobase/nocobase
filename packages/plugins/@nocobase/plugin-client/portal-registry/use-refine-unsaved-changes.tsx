import { useTranslate, useWarnAboutChange } from "@refinedev/core";
import { TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingConfirmation = {
  promise: Promise<boolean>;
  resolve: (allowed: boolean) => void;
};

export function useRefineUnsavedChangesGuard() {
  const translate = useTranslate();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<PendingConfirmation | null>(null);

  const settle = useCallback(
    (allowed: boolean) => {
      const pending = pendingRef.current;
      if (!pending) return;

      pendingRef.current = null;
      if (allowed) setWarnWhen(false);
      setOpen(false);
      pending.resolve(allowed);
    },
    [setWarnWhen]
  );

  useEffect(
    () => () => {
      pendingRef.current?.resolve(false);
      pendingRef.current = null;
    },
    []
  );

  const beforeClose = useCallback(() => {
    if (!warnWhen) return true;
    if (pendingRef.current) return pendingRef.current.promise;

    let resolve!: (allowed: boolean) => void;
    const promise = new Promise<boolean>((next) => {
      resolve = next;
    });
    pendingRef.current = { promise, resolve };
    setOpen(true);
    return promise;
  }, [warnWhen]);

  const confirmation = useMemo(
    () => (
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) settle(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <TriangleAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {translate(
                "unsavedChanges.title",
                "Discard unsaved changes?"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate(
                "unsavedChanges.description",
                "Your changes have not been saved. Leaving now will discard them."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>
              {translate("unsavedChanges.stay", "Keep editing")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => settle(true)}
            >
              {translate("unsavedChanges.leave", "Discard changes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [open, settle, translate]
  );

  return { beforeClose, confirmation };
}
