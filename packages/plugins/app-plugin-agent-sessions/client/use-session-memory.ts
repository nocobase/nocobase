import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type Dispatch, type SetStateAction } from 'react';

export function sessionMemoryKey(
  key: string | undefined,
): readonly ['agentSessions', 'memory', string | undefined] {
  return ['agentSessions', 'memory', key];
}

/** Route-local UI state retained only in the authenticated application's memory cache. */
export function useSessionMemory<T>(
  key: string | undefined,
  initial: T,
): readonly [T, Dispatch<SetStateAction<T>>] {
  const client = useQueryClient();
  const queryKey = sessionMemoryKey(key);
  const query = useQuery({
    queryKey,
    enabled: false,
    initialData: initial,
    queryFn: () => initial,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
  const [local, setLocal] = useState({
    key,
    value: key === undefined ? initial : (query.data ?? initial),
    cached: query.data,
  });
  // Restore a different draft and observe cache edits such as submission recovery.
  // Local edits render synchronously, without waiting for Query's scheduled notification.
  if (local.key !== key || !Object.is(local.cached, query.data)) {
    setLocal({
      key,
      value: key === undefined ? initial : (query.data ?? initial),
      cached: query.data,
    });
  }
  return [
    local.value,
    (next) => {
      if (key === undefined) {
        setLocal((current) => ({
          ...current,
          value:
            typeof next === 'function'
              ? (next as (value: T) => T)(current.value)
              : next,
        }));
        return;
      }
      const value = client.setQueryData<T>(queryKey, (held) =>
        typeof next === 'function'
          ? (next as (value: T) => T)(held ?? initial)
          : next,
      );
      setLocal((current) =>
        current.key === key ? { ...current, value: value ?? initial } : current,
      );
    },
  ];
}
