import type { QueryClient } from '@tanstack/react-query';

import { agentsKeys } from '../api/keys.js';

/** Realtime must supersede an in-flight first read, which plain invalidation would reuse. */
export async function refreshRunDetail(
  client: QueryClient,
  runId: string,
): Promise<void> {
  const filter = { queryKey: agentsKeys.run(runId), exact: true };
  await client.cancelQueries(filter);
  await client.invalidateQueries(filter);
}
