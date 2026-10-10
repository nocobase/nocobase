/** Copies a workflow, a command or a prompt of "Deployment", saying so on the button for a moment. */
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';

import { useNotify } from '../../access/notify.js';

export function CopyButton({
  text,
  label,
  size = 'sm',
}: {
  readonly text: string;
  readonly label?: string;
  readonly size?: 'sm' | 'xs';
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type='button'
      variant='outline'
      size={size}
      onClick={() => {
        void navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          })
          .catch((error: unknown) =>
            notify.error(error, t('ciSetup.copyFailed')),
          );
      }}
    >
      {copied ? (
        <CheckIcon data-icon='inline-start' />
      ) : (
        <CopyIcon data-icon='inline-start' />
      )}
      {copied ? t('ciSetup.copied') : (label ?? t('ciSetup.copy'))}
    </Button>
  );
}
