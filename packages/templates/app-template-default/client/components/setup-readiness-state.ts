import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type SetupUnknownReason =
  'unavailable' | 'signIn' | 'forbidden' | 'invalid';
export interface SetupInspection {
  readonly status: 'ready' | 'missing' | 'unknown';
  readonly reason?: SetupUnknownReason;
  readonly canConfigure?: boolean;
}
export interface SetupCheck {
  readonly id: string;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly action?: ReactNode;
}
export type SetupInspections = Readonly<Record<string, SetupInspection>>;
export interface SetupReadinessState {
  readonly active: boolean;
  readonly items: readonly (SetupCheck & SetupInspection)[];
  readonly loading: boolean;
  readonly refresh: () => void;
}

/** Keep transport errors out of UI copy and never call a failed read missing. */
export function setupInspectionFailure(error: unknown): SetupInspection {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number(error.status)
      : undefined;
  return {
    status: 'unknown',
    reason:
      status === 401
        ? 'signIn'
        : status === 403
          ? 'forbidden'
          : status === 400 || status === 404
            ? 'invalid'
            : 'unavailable',
  };
}

/** Memoize checks and inspect. The owning feature supplies a real authorized read. */
export function useSetupReadiness(
  checks: readonly SetupCheck[],
  inspect: () => Promise<SetupInspections>,
  {
    enabled = true,
    refreshKey = '',
  }: { enabled?: boolean; refreshKey?: string } = {},
): SetupReadinessState {
  const [revision, setRevision] = useState(0);
  const active = enabled && checks.length > 0;
  const request = useMemo(
    () => ({ checks, inspect, refreshKey, revision, active }),
    [checks, inspect, refreshKey, revision, active],
  );
  const [snapshot, setSnapshot] = useState<{
    request: typeof request;
    values: SetupInspections;
  }>();
  const busyRef = useRef(false);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const { active, checks, inspect } = request;
    if (!active) return;
    let current = true;
    busyRef.current = true;
    const finish = (values: SetupInspections) => {
      if (!current) return;
      busyRef.current = false;
      setSnapshot({ request, values });
    };
    void Promise.resolve()
      .then(() => (current ? inspect() : {}))
      .then(finish, (error: unknown) =>
        finish(
          Object.fromEntries(
            checks.map(({ id }) => [id, setupInspectionFailure(error)]),
          ),
        ),
      );
    return () => {
      current = false;
      busyRef.current = false;
    };
  }, [request]);
  useEffect(() => {
    if (!active) return;
    const onFocus = () => {
      if (!busyRef.current) refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [active, refresh]);
  const loading = active && snapshot?.request !== request;
  return {
    active,
    items:
      !active || loading
        ? []
        : checks.map((check) => {
            const values = snapshot?.values;
            const value =
              values && Object.hasOwn(values, check.id)
                ? values[check.id]
                : undefined;
            if (
              !value ||
              !['ready', 'missing', 'unknown'].includes(value.status)
            )
              return {
                ...check,
                status: 'unknown' as const,
                reason: 'invalid' as const,
              };
            const reason =
              value.reason &&
              ['unavailable', 'signIn', 'forbidden', 'invalid'].includes(
                value.reason,
              )
                ? value.reason
                : 'invalid';
            return {
              ...check,
              status: value.status,
              reason,
              canConfigure: value.canConfigure !== false,
            };
          }),
    loading,
    refresh,
  };
}
