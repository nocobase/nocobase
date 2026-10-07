/** Checking a saved environment can be reached: its outcome as a toast, the runtime's message worded. */
import type { EnvironmentRecord } from '../../shared/releases.js';
import { messageText } from '../lib/errors.js';
import { useNotify } from './use-notify.js';
import { useReleasesApi } from './use-releases.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function useEnvironmentCheck(
  t: Translate,
  /** Marks the check running (`check:<id>`) and done (null). */
  setBusy: (busy: string | null) => void,
): (environment: EnvironmentRecord) => Promise<void> {
  const api = useReleasesApi();
  const notify = useNotify();
  return async (environment) => {
    setBusy(`check:${environment.id}`);
    try {
      const result = await api.send<{ ok: boolean; message?: string }>(
        'POST',
        `environments/${environment.id}/check`,
      );
      if (result.ok)
        notify.success(
          t('ui.environments.reachable', { name: environment.name }),
        );
      else
        notify.error(
          new Error(
            result.message
              ? messageText(t, result.message)
              : t('ui.environments.unreachable', { name: environment.name }),
          ),
        );
    } catch (reason) {
      notify.error(reason);
    } finally {
      setBusy(null);
    }
  };
}
