import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, useEffect, useState } from 'react';

export interface CopyState {
  /** Whether the last copy succeeded within the past two seconds, for a button to show a check mark. */
  readonly copied: boolean;
  readonly copy: (text: string) => Promise<void>;
}

/** Copies text to the clipboard and reports the outcome in a toast. */
export function useCopy(): CopyState {
  const { t } = useTranslation();
  const toaster = useToaster();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toaster.show({ type: 'success', title: t('home.prompt.copied') });
      } catch {
        // The Clipboard API is missing outside a secure context and rejects without permission.
        toaster.show({ type: 'error', title: t('home.prompt.copyFailed') });
      }
    },
    [t, toaster],
  );

  return { copied, copy };
}
