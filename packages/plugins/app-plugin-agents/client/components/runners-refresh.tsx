import { useQueryClient } from '@tanstack/react-query';

import { RUNNERS_TOPIC } from '../../shared/realtime.js';
import { agentsKeys } from '../api/keys.js';
import { useRealtimeTopic } from '../hooks/use-realtime-topic.js';

/** Runners coming online or changing refresh the runner list; the server says only which runner changed. */
export function RunnersRefresh(): null {
  const queryClient = useQueryClient();
  useRealtimeTopic(RUNNERS_TOPIC, () => {
    void queryClient.invalidateQueries({ queryKey: agentsKeys.runners });
  });
  return null;
}
