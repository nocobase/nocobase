import { LoaderCircle, Plus, Save } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from './ui/button.js';

interface MailManagementFormActionsProps {
  readonly editing: boolean;
  readonly busy: boolean;
  readonly disabled: boolean;
  readonly submitLabel: string;
  readonly savingLabel: string;
  readonly cancelLabel: string;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

export function MailManagementFormActions({
  editing,
  busy,
  disabled,
  submitLabel,
  savingLabel,
  cancelLabel,
  onSubmit,
  onCancel,
}: MailManagementFormActionsProps): ReactElement {
  const SubmitIcon = busy ? LoaderCircle : editing ? Save : Plus;

  return (
    <div className='flex flex-wrap items-center justify-end gap-2'>
      <Button
        disabled={busy}
        onClick={onCancel}
        type='button'
        variant='outline'
      >
        {cancelLabel}
      </Button>
      <Button disabled={busy || disabled} onClick={onSubmit} type='button'>
        <SubmitIcon
          aria-hidden='true'
          className={busy ? 'size-4 animate-spin' : 'size-4'}
        />
        {busy ? savingLabel : submitLabel}
      </Button>
    </div>
  );
}
