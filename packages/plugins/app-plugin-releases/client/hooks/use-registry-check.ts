/** A connection test of a registry's unsaved settings (`POST registries/check`). */
import { useState } from 'react';

import type {
  RegistryCheckResult,
  RegistryInput,
} from '../../shared/releases.js';
import { useReleasesApi } from './use-releases.js';

export type RegistryCheckOutcome =
  | { readonly ok: true; readonly value: RegistryCheckResult }
  | { readonly ok: false; readonly error: unknown };

/** Tries unsaved settings (`POST registries/check`); `id` names the stored registry whose passwords fill the gaps. */
export function useRegistryCheck(): {
  readonly checking: boolean;
  readonly outcome: RegistryCheckOutcome | undefined;
  readonly run: (input: RegistryInput, id?: string) => Promise<void>;
  readonly reset: () => void;
} {
  const api = useReleasesApi();
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<RegistryCheckOutcome>();
  const run = async (input: RegistryInput, id?: string): Promise<void> => {
    setChecking(true);
    try {
      setOutcome({
        ok: true,
        value: await api.send<RegistryCheckResult>('POST', 'registries/check', {
          ...input,
          ...(id ? { id } : {}),
        }),
      });
    } catch (error) {
      setOutcome({ ok: false, error });
    } finally {
      setChecking(false);
    }
  };
  return { checking, outcome, run, reset: () => setOutcome(undefined) };
}
