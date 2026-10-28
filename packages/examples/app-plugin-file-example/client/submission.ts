import { useRef } from 'react';
import { useSubmission } from '@nocobase/app-client';

/** Retain the association payload after upload: retry must not upload another file or select a new target. */
interface FileSubmission {
  run<I>(
    input: I,
    execute: (key: string, snapshot: I) => Promise<unknown>,
  ): Promise<unknown>;
  retry(): Promise<unknown> | undefined;
  submitting: boolean;
  pending: boolean;
}
export function useFileSubmission(): FileSubmission {
  const submission = useSubmission();
  const pendingRef = useRef<(() => Promise<unknown>) | undefined>(undefined);
  const run = async <I>(
    input: I,
    execute: (key: string, snapshot: I) => Promise<unknown>,
  ): Promise<unknown> => {
    const attempt = async () => {
      const outcome = await submission.run(
        input,
        async (key, _signal, snapshot) => ({
          value: await execute(key, snapshot),
        }),
      );
      if (outcome) pendingRef.current = undefined;
      return outcome;
    };
    pendingRef.current ??= attempt;
    return attempt();
  };
  return {
    run,
    retry: () => pendingRef.current?.(),
    submitting: submission.submitting,
    pending: submission.pending,
  };
}
