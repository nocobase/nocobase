import { copyText } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { useNotify } from '../hooks/use-notify.js';
import { Button } from './ui/button.js';

/** A shell command with a copy button (the add-runner dialog, the upgrade popover). */
export function CommandLine({
  command,
  expanded = false,
}: {
  readonly command: string;
  readonly expanded?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    const copied = await copyText(command);
    setCopied(copied);
    if (copied) window.setTimeout(() => setCopied(false), 2000);
    else notify.error(null, t('command.copyFailed'));
  }

  return (
    <div className='flex items-start gap-2 rounded-lg border bg-muted p-2 pl-3'>
      <code
        className={`min-w-0 flex-1 py-1 font-mono text-xs break-all whitespace-pre-wrap select-all ${expanded ? '' : 'max-h-64 overflow-y-auto'}`}
      >
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
