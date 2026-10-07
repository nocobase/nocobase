import { Dialog } from '@base-ui/react/dialog';
import { useState, type ReactElement, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useAuthorizationTranslation } from '../i18n.js';
import { Button } from './ui/button.js';
import { ConfirmDialog } from './confirm-dialog.js';

export function RuleDrawer({
  title,
  description,
  dirty = false,
  busy = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  dirty?: boolean;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const [discard, setDiscard] = useState(false);
  function close() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  return (
    <>
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className='fixed inset-0 z-50 bg-black/30' />
          <Dialog.Popup className='fixed inset-y-0 right-0 z-50 flex w-full flex-col sm:max-w-2xl border-l bg-popover shadow-xl outline-none'>
            <header className='flex shrink-0 items-start justify-between gap-4 border-b p-6'>
              <div className='space-y-1'>
                <Dialog.Title className='text-lg font-semibold'>
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className='text-sm text-muted-foreground'>
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('common.close')}
                disabled={busy}
                onClick={close}
              >
                <X />
              </Button>
            </header>
            <fieldset
              disabled={busy}
              className='flex min-h-0 min-w-0 flex-1 flex-col'
            >
              {children}
            </fieldset>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <ConfirmDialog
        open={discard}
        title={t('permissionWorkspace.discardTitle')}
        confirmLabel={t('permissionWorkspace.discard')}
        onCancel={() => setDiscard(false)}
        onConfirm={onClose}
      >
        {t('permissionWorkspace.discardBody')}
      </ConfirmDialog>
    </>
  );
}

export function RuleForm({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}): ReactElement {
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 space-y-8 overflow-y-auto p-6 [&>section+section]:border-t [&>section+section]:pt-6'>
        {children}
      </div>
      <footer className='flex shrink-0 items-center justify-end gap-2 border-t bg-popover px-6 py-4'>
        {footer}
      </footer>
    </div>
  );
}
