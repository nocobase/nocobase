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
  const [local, setLocal] = useState(initial);
  const queryKey = sessionMemoryKey(key);
  const query = useQuery({
    queryKey,
    enabled: false,
    initialData: initial,
    queryFn: () => initial,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
  const value = key === undefined ? local : (query.data ?? initial);
  return [
    value,
    key === undefined
      ? setLocal
      : (next) => {
          client.setQueryData<T>(queryKey, (held) =>
            typeof next === 'function'
              ? (next as (value: T) => T)(held ?? initial)
              : next,
          );
        },
  ];
}
