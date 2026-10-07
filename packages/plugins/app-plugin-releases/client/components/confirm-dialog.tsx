/**
 * Confirmations as the application's alert dialog rather than the browser's `confirm` / `prompt`: `ask()` opens it and
 * resolves with what the person entered ('' when nothing is typed), or null when they cancel. With `typeToConfirm` the
 * action stays disabled until that text is typed exactly, as protected deploys and deleting an App require; with `note`
 * the person may write an optional note, such as why a request is rejected, which is what it resolves with.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Textarea } from './ui/textarea.js';

export interface ConfirmOptions {
  readonly title: string;
  readonly description?: string;
  /** More under the description, such as what else the action affects. */
  readonly details?: ReactNode;
  /** The action button's text. */
  readonly action: string;
  readonly destructive?: boolean;
  /** Text the person must type before the action is enabled. */
  readonly typeToConfirm?: string;
  /** An optional note to write, named by `label`. */
  readonly note?: { readonly label: string; readonly placeholder?: string };
}

interface Pending extends ConfirmOptions {
  readonly resolve: (value: string | null) => void;
}

export function useConfirmDialog(): {
  readonly ask: (options: ConfirmOptions) => Promise<string | null>;
  readonly dialog: ReactElement;
} {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [pending, setPending] = useState<Pending | null>(null);
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const close = (value: string | null): void => {
    pending?.resolve(value);
    setPending(null);
    setTyped('');
  };
  const ask = (options: ConfirmOptions): Promise<string | null> =>
    new Promise((resolve) => {
      setTyped('');
      setPending({ ...options, resolve });
    });
  const matches =
    pending?.typeToConfirm === undefined || typed === pending.typeToConfirm;
  const dialog = (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) close(null);
      }}
    >
      <AlertDialogContent
        initialFocus={
          pending?.typeToConfirm
            ? inputRef
            : pending?.note
              ? noteRef
              : undefined
        }
      >
        <form
          className='grid gap-4'
          onSubmit={(event) => {
            event.preventDefault();
            if (matches) close(typed);
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
            {pending?.description ? (
              <AlertDialogDescription>
                {pending.description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          {pending?.details ?? null}
          {pending?.typeToConfirm !== undefined ? (
            <Input
              ref={inputRef}
              aria-label={t('ui.confirm.typeLabel', {
                text: pending.typeToConfirm,
              })}
              placeholder={pending.typeToConfirm}
              autoComplete='off'
              spellCheck={false}
              className='font-mono'
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          ) : null}
          {pending?.note ? (
            <Textarea
              ref={noteRef}
              aria-label={pending.note.label}
              placeholder={pending.note.placeholder ?? pending.note.label}
              maxLength={2000}
              className='min-h-20'
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ui.confirm.cancel')}</AlertDialogCancel>
            <Button
              type='submit'
              variant={pending?.destructive ? 'destructive' : 'default'}
              disabled={!matches}
            >
              {pending?.action}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { ask, dialog };
}
