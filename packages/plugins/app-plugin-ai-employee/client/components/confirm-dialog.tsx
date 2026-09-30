import { CircleAlert } from 'lucide-react';
import { useRef, type ReactElement } from 'react';

import { Button } from './ui/button.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';

export interface ConfirmDialogProps {
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly description: string;
  /** Disable confirmation while leaving the safe cancel action available. */
  readonly disabled?: boolean;
  /** Prevent repeat actions and dismissal while a confirmation is pending. */
  readonly pending?: boolean;
  readonly onConfirm: () => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly title: string;
}

export function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  description,
  disabled = false,
  pending = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: ConfirmDialogProps): ReactElement {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className='sm:max-w-md'
        showCloseButton={false}
        initialFocus={cancelRef}
        aria-modal='true'
        aria-busy={pending}
      >
        <div className='flex gap-4'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <CircleAlert className='size-5' aria-hidden='true' />
          </div>
          <DialogHeader className='min-w-0'>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={disabled || pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <DialogClose
            render={<Button ref={cancelRef} type='button' disabled={pending} />}
          >
            {cancelLabel}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
