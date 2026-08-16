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

import type { JsTemplateCreateJobSummary } from '../../shared/types';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { dismissJsTemplateCreateJob, listJsTemplateCreateJobs } from '../api/jsTemplateCreateJobRequests';

type FlowContextWithApi = {
  api: ApiClientLike;
};

export interface UseJsTemplateCreateJobsResult {
  jobs: JsTemplateCreateJobSummary[];
  loading: boolean;
  error: Error | null;
  addAcceptedJob(job: JsTemplateCreateJobSummary): void;
  refresh(): Promise<void>;
  dismiss(jobId: string): Promise<void>;
}

const POLL_INTERVAL_MS = 2500;

export function useJsTemplateCreateJobs(): UseJsTemplateCreateJobsResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const [jobs, setJobs] = useState<JsTemplateCreateJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    try {
      const result = await listJsTemplateCreateJobs(ctx.api, controller.signal);
      if (!controller.signal.aborted && mountedRef.current) {
        setJobs(result.jobs);
        setError(null);
      }
    } catch (requestError) {
      if (!controller.signal.aborted && mountedRef.current) {
        setError(new Error('JS Template creation job request failed'));
      }
      throw requestError;
    } finally {
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
        // Polling continues until the job list becomes available.
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
    };
  }, [refresh]);

  const hasActiveJobs = jobs.some(
    (job) => job.status === 'pending' || job.status === 'running' || job.status === 'finalize-pending',
  );
  const hasFailedJobs = jobs.some((job) => job.status === 'failed');
  useEffect(() => {
    if (!hasActiveJobs && !hasFailedJobs && !error) {
      return;
    }
    const timer = setInterval(() => {
      refresh().catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [error, hasActiveJobs, hasFailedJobs, refresh]);

  const addAcceptedJob = useCallback((job: JsTemplateCreateJobSummary) => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setJobs((current) => [job, ...current.filter((candidate) => candidate.id !== job.id)]);
  }, []);

  const dismiss = useCallback(
    async (jobId: string) => {
      await dismissJsTemplateCreateJob(ctx.api, jobId);
      if (mountedRef.current) {
        requestControllerRef.current?.abort();
        requestControllerRef.current = null;
        setJobs((current) => current.filter((job) => job.id !== jobId));
      }
    },
    [ctx.api],
  );

  return useMemo(
    () => ({ jobs, loading, error, addAcceptedJob, refresh, dismiss }),
    [addAcceptedJob, dismiss, error, jobs, loading, refresh],
  );
}
