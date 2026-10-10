import { useApiClient } from '@nocobase/app-client';

import type { DurableFlow } from '../../shared/flows.js';
import { sandboxApi, type WebhookEvent } from './sandbox-api.js';
import { useLoader } from './use-loader.js';

/**
 * The webhooks the simulated systems sent about a record, read again
 * whenever `revision` says the record may have changed: storing and
 * delivering an event each push a change of the record it is about.
 */
export function useWebhookEvents(
  flow: DurableFlow,
  recordId: string,
  revision: number,
): readonly WebhookEvent[] {
  const api = sandboxApi(useApiClient());
  return (
    useLoader(() => api.events(flow, recordId), `${flow}:${recordId}`, revision)
      .data ?? []
  );
}
