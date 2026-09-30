import { useTranslation } from '@nocobase/i18n/client';
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';

/** What `onConfirm` returns to keep the dialog open and say why the action did not happen. */
export interface ConfirmDialogFailure {
  /**
   * Shown inside the dialog, above its buttons. A string renders as one line of destructive text announced with
   * `role='alert'`; any other node renders as given and announces itself, such as an `Alert`. `null`, `undefined`
   * or an empty string shows the default failure message.
   */
  readonly error: ReactNode;
  /**
   * Whether confirming again can succeed. `false` keeps the confirm button disabled until the dialog closes, for a
   * failure a retry cannot fix, such as a missing permission or an ended session. Defaults to `true`.
   */
  readonly retryable?: boolean;
}

/** Nothing when the action succeeded, and the dialog closes; a failure when it did not, and the dialog stays open. */
export type ConfirmDialogResult = ConfirmDialogFailure | void;

/** Why the dialog asks to close: the user cancelled (Cancel or Escape), or `onConfirm` succeeded. */
export type ConfirmDialogCloseReason = 'cancel' | 'confirm';

export interface ConfirmDialogProps {
  readonly open: boolean;
  /**
   * Called with `false` when the dialog closes itself, and the reason: `'cancel'` after Cancel or Escape, `'confirm'`
   * after `onConfirm` succeeded. It never asks to open; that is the caller's decision. Close the dialog for both
   * reasons, and check `reason` before doing anything that means the user declined.
   */
  readonly onOpenChange: (
    open: boolean,
    reason: ConfirmDialogCloseReason,
  ) => void;
  /** Names the action and its object, such as `Delete project "Apollo"?`. */
  readonly title: ReactNode;
  /** States the consequence, such as "This cannot be undone." */
  readonly description?: ReactNode;
  /** The specific action, such as "Delete", rather than "OK" or "Confirm". */
  readonly confirmLabel: ReactNode;
  /** Styles the confirm button as destructive. Defaults to `true`; pass `false` for an action that loses nothing. */
  readonly destructive?: boolean;
  /** Defaults to the translated "Cancel". */
  readonly cancelLabel?: ReactNode;
  /**
   * The action. While a returned promise is pending, the confirm button shows a spinner, both buttons are disabled
   * and the dialog cannot be closed. Resolving with nothing closes the dialog; returning a `ConfirmDialogFailure`, or
   * rejecting, keeps it open with the error inside it. A rejection shows the default failure message and never the
   * error's own text, so return the failures you can tell apart. A result that arrives after the dialog was closed or
   * unmounted is dropped.
   */
  readonly onConfirm: () => ConfirmDialogResult | Promise<ConfirmDialogResult>;
  /**
   * Where focus goes when the dialog closes after the action was confirmed, such as a list's search box, because the
   * element that opened the dialog has often gone with the record. Cancelling still returns focus to that element.
   */
  readonly focusAfterConfirm?: RefObject<HTMLElement | null>;
}

/**
 * Confirms one action, such as deleting a record, in an alert dialog the caller opens from its own state. The dialog
 * runs the action, shows its progress and keeps a failure inside itself; what the action does, and the toast that
 * reports its success, stay with the caller.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = true,
  cancelLabel,
  onConfirm,
  focusAfterConfirm,
}: ConfirmDialogProps): ReactElement {
  const { t } = useTranslation();
  // True from the moment the action starts until the dialog opens again, unless it fails: the spinner stays on through
  // the closing animation, so the action cannot run twice.
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ConfirmDialogFailure | null>(null);
  // Each opening starts clean, including one that follows a close the action did not wait for.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBusy(false);
      setFailure(null);
    }
  }
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  // The handler from the render the action settles in. The one from the render the click happened in may close over
  // state the page has replaced since, such as a navigation guard's held traversal.
  const onOpenChangeRef = useRef(onOpenChange);
  useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });
  // Incremented whenever the dialog closes, whoever closed it, and when it unmounts: an action that settles afterwards
  // belongs to an opening that is over, so its result is dropped and nothing is called.
  const openingRef = useRef(0);
  useLayoutEffect(() => {
    if (!open) openingRef.current += 1;
  }, [open]);
  useLayoutEffect(
    () => () => {
      openingRef.current += 1;
    },
    [],
  );
  // The opening whose action is running. A ref rather than `busy`, so two clicks handled before React renders again
  // still run the action once.
  const runningRef = useRef<number | null>(null);
  // Whether the dialog is closing because an action was confirmed, which is when `focusAfterConfirm` applies.
  const confirmedRef = useRef(false);

  async function confirm(): Promise<void> {
    const opening = openingRef.current;
    if (!open || runningRef.current === opening) return;
    runningRef.current = opening;
    confirmedRef.current = true;
    // Cancel is about to be disabled, and a mouse click does not focus a button in every browser (Safari), so focus
    // moves to the confirm button, which stays focusable while disabled and is where a failure leaves the user.
    confirmRef.current?.focus();
    setBusy(true);
    setFailure(null);
    let result: ConfirmDialogResult;
    try {
      result = await onConfirm();
    } catch (reason: unknown) {
      // The user sees the default message, never the error's own text; the console keeps the cause.
      console.error('The confirmed action failed', reason);
      result = { error: null };
    }
    if (opening !== openingRef.current) return;
    if (result) {
      runningRef.current = null;
      confirmedRef.current = false;
      setBusy(false);
      setFailure(result);
      return;
    }
    onOpenChangeRef.current(false, 'confirm');
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Cancel and Escape end up here; an alert dialog ignores backdrop clicks.
        if (!next && !busy) onOpenChange(false, 'cancel');
      }}
    >
      <AlertDialogContent
        // The safe choice holds focus, so Enter right after opening does not run the action.
        initialFocus={cancelRef}
        finalFocus={() => {
          const target = confirmedRef.current
            ? focusAfterConfirm?.current
            : null;
          confirmedRef.current = false;
          // `true` returns focus to the element that had it before the dialog opened.
          return target ?? true;
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description != null && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {failure &&
          (failure.error == null || typeof failure.error === 'string' ? (
            <p
              role='alert'
              className='text-center text-sm text-destructive sm:text-left'
            >
              {failure.error ||
                t('confirmDialog.failed', {
                  defaultValue: 'The action failed. Please try again.',
                })}
            </p>
          ) : (
            failure.error
          ))}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef} disabled={busy}>
            {cancelLabel ??
              t('confirmDialog.cancel', { defaultValue: 'Cancel' })}
          </AlertDialogCancel>
          <AlertDialogAction
            ref={confirmRef}
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy || failure?.retryable === false}
            // Keeps focus on the button while it is disabled, so it is still there when a failure enables it again.
            // Such a button is not `:disabled`, so it takes the disabled look from `data-disabled`.
            focusableWhenDisabled
            className='data-disabled:pointer-events-none data-disabled:opacity-50'
            onClick={() => void confirm()}
          >
            {busy && <Spinner data-icon='inline-start' />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
