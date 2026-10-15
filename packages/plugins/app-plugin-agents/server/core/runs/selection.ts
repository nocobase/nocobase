/** Optional ordered-model policy. Selection stays inside the existing claim transaction. */
import type { DatabaseConnection } from '@nocobase/db';
import type { Run } from '../../../shared/runs.js';

export interface ModelSelectionPolicy {
  readonly fallbackAfterSeconds: number;
}

export interface ModelSelectionPolicies {
  register(
    agentId: string,
    policy: (
      conn: DatabaseConnection,
      run: Run,
    ) => Promise<ModelSelectionPolicy>,
  ): () => void;
  forRun(
    conn: DatabaseConnection,
    run: Run,
  ): Promise<ModelSelectionPolicy | null>;
}

export function createModelSelectionPolicies(): ModelSelectionPolicies {
  const policies = new Map<
    string,
    (conn: DatabaseConnection, run: Run) => Promise<ModelSelectionPolicy>
  >();
  return {
    register(agentId, policy) {
      if (policies.has(agentId))
        throw new Error(`Model selection already registered: ${agentId}`);
      policies.set(agentId, policy);
      return () => {
        if (policies.get(agentId) === policy) policies.delete(agentId);
      };
    },
    async forRun(conn, run) {
      return (await policies.get(run.agentId)?.(conn, run)) ?? null;
    },
  };
}

export function queueStart(
  run: Pick<Run, 'queueEnteredAt' | 'createdAt' | 'availableAt'>,
): number {
  return Math.max(
    new Date(run.queueEnteredAt ?? run.createdAt).getTime(),
    run.availableAt ? new Date(run.availableAt).getTime() : 0,
  );
}
