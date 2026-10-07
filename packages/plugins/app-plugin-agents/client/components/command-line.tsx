import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { useNotify } from '../hooks/use-notify.js';
import { Button } from './ui/button.js';

/** A shell command with a copy button (the add-runner dialog, the upgrade popover). */
export function CommandLine({
  command,
}: {
  readonly command: string;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      notify.error(error, t('command.copyFailed'));
    }
  }

  return (
    <div className='flex items-start gap-2 rounded-lg border bg-muted p-2 pl-3'>
      <code className='min-w-0 flex-1 py-1 font-mono text-xs break-all select-all'>
        {command}
      </code>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={copied ? t('command.copied') : t('command.copy')}
        onClick={() => void copy()}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
