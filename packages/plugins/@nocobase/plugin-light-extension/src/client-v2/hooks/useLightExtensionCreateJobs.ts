/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { LightExtensionCreateJobSummary } from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  dismissLightExtensionCreateJob,
  listLightExtensionCreateJobs,
  retryLightExtensionCreateJob,
} from '../api/lightExtensionCreateJobRequests';

type FlowContextWithApi = {
  api: ApiClientLike;
};

export interface UseLightExtensionCreateJobsResult {
  jobs: LightExtensionCreateJobSummary[];
  loading: boolean;
  addAcceptedJob(job: LightExtensionCreateJobSummary): void;
  refresh(): Promise<void>;
  retry(jobId: string): Promise<LightExtensionCreateJobSummary>;
  dismiss(jobId: string): Promise<void>;
}

const POLL_INTERVAL_MS = 2500;

export function useLightExtensionCreateJobs(): UseLightExtensionCreateJobsResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const [jobs, setJobs] = useState<LightExtensionCreateJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const refreshingRef = useRef<Promise<void> | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (refreshingRef.current) {
      return refreshingRef.current;
    }
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const request = async () => {
      const result = await listLightExtensionCreateJobs(ctx.api, controller.signal);
      if (!controller.signal.aborted && mountedRef.current) {
        setJobs((current) => mergeCreationJobs(current, result.jobs));
      }
    };
    const pending = request();
    refreshingRef.current = pending;
    try {
      await pending;
    } finally {
      if (refreshingRef.current === pending) {
        refreshingRef.current = null;
      }
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }, [ctx.api]);

  useEffect(() => {
    mountedRef.current = true;
    const loadInitialJobs = async () => {
      try {
        await refresh();
      } catch {
        // The page owns user-visible loading errors; polling will retry after a locally accepted job is added.
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    loadInitialJobs();
    return () => {
      mountedRef.current = false;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      refreshingRef.current = null;
    };
  }, [refresh]);

  const hasActiveJobs = jobs.some((job) => job.status === 'pending' || job.status === 'running');
  useEffect(() => {
    if (!hasActiveJobs) {
      return;
    }
    const timer = setInterval(() => {
      refresh().catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasActiveJobs, refresh]);

  const addAcceptedJob = useCallback((job: LightExtensionCreateJobSummary) => {
    setJobs((current) => mergeCreationJobs(current, [job]));
  }, []);

  const retry = useCallback(
    async (jobId: string) => {
      const job = await retryLightExtensionCreateJob(ctx.api, jobId);
      if (mountedRef.current) {
        setJobs((current) => mergeCreationJobs(current, [job]));
      }
      return job;
    },
    [ctx.api],
  );

  const dismiss = useCallback(
    async (jobId: string) => {
      await dismissLightExtensionCreateJob(ctx.api, jobId);
      if (mountedRef.current) {
        setJobs((current) => current.filter((job) => job.id !== jobId));
      }
    },
    [ctx.api],
  );

  return useMemo(
    () => ({ jobs, loading, addAcceptedJob, refresh, retry, dismiss }),
    [addAcceptedJob, dismiss, jobs, loading, refresh, retry],
  );
}

export function mergeCreationJobs(
  current: LightExtensionCreateJobSummary[],
  incoming: LightExtensionCreateJobSummary[],
): LightExtensionCreateJobSummary[] {
  const byId = new Map(current.map((job) => [job.id, job]));
  for (const job of incoming) {
    const previous = byId.get(job.id);
    if (!previous || getTimestamp(job.updatedAt) >= getTimestamp(previous.updatedAt)) {
      byId.set(job.id, job);
    }
  }
  return [...byId.values()].sort((left, right) => getTimestamp(right.updatedAt) - getTimestamp(left.updatedAt));
}

function getTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
