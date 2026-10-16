import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { sessionMemoryKey, useSessionMemory } from './use-session-memory.js';

/** Keep an uncertain request's exact input across route unmounts, within this authenticated application only. */
export function useSubmission<T extends object>(
  key: string,
  draftKey: string,
  write: (input: T & { submissionId: string }) => Promise<unknown>,
): {
  readonly pending: boolean;
  readonly send: (input: T) => Promise<void>;
  readonly retry: () => Promise<void>;
  readonly edit: () => void;
} {
  const [pending, setPending] = useSessionMemory<
    (T & { submissionId: string }) | null
  >(`submission:${key}`, null);
  const activeRef = useRef(false);
  const client = useQueryClient();
  const execute = async (
    input: T & { submissionId: string },
  ): Promise<void> => {
    if (activeRef.current) throw new Error('Submission is already in flight.');
    activeRef.current = true;
    setPending(input);
    try {
      await write(input);
      setPending(null);
    } finally {
      activeRef.current = false;
    }
  };
  return {
    pending: pending !== null,
    send: (input: T) =>
      execute(structuredClone({ ...input, submissionId: crypto.randomUUID() })),
    retry: async () => {
      if (!pending) return;
      await execute(pending);
      client.setQueryData(sessionMemoryKey(`text:${draftKey}`), '');
      client.setQueryData(sessionMemoryKey(`images:${draftKey}`), []);
      client.setQueryData(sessionMemoryKey(`mentions:${draftKey}`), []);
    },
    edit: () => {
      if (!activeRef.current) setPending(null);
    },
  };
}
