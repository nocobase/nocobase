import { copyText, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState } from 'react';

import { API_KEYS_NAMESPACE } from '../namespace.js';

/** Copies text, saying in a toast whether it worked; `copied` stays true for two seconds after a copy. */
export function useCopy(): {
  readonly copied: boolean;
  readonly copy: (text: string) => Promise<void>;
} {
  const { t } = useTranslation(API_KEYS_NAMESPACE);
  const toaster = useToaster();
  const [copied, setCopied] = useState(false);
  const copy = async (text: string): Promise<void> => {
    const done = await copyText(text).catch(() => false);
    if (!done) {
      toaster.show({ type: 'error', title: t('common.copyFailed') });
      return;
    }
    setCopied(true);
    toaster.show({ type: 'success', title: t('common.copied') });
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}
