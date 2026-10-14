import { useState } from 'react';

import { errorMessage } from './api.js';
import { useTranslate } from './use-example-record.js';

/** Runs an action of the outside-world card, reporting a refusal in the page's language. */
export function useConsoleAction(reload: () => Promise<void>): {
  readonly busy: boolean;
  readonly error: string;
  readonly run: (action: () => Promise<unknown>) => Promise<void>;
} {
  const translate = useTranslate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return {
    busy,
    error,
    run: async (action) => {
      setBusy(true);
      setError('');
      try {
        await action();
        await reload();
      } catch (cause) {
        setError(errorMessage(cause, translate));
      } finally {
        setBusy(false);
      }
    },
  };
}
