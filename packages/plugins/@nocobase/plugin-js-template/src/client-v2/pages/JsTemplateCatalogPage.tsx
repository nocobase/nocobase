/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { Alert, Card, theme } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { NAMESPACE } from '../../constants';
import type { JsTemplateCatalogEntry, JsTemplateCreateJobSummary } from '../../shared/types';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { useJsTemplateCreateJobs } from '../hooks/useJsTemplateCreateJobs';
import { getJsTemplateSyncErrorTranslationKey } from '../hooks/useJsTemplateSync';
import { invalidateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { invalidateJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';
import { CreateJsTemplateModal } from './js-template-catalog/CreateJsTemplateModal';
import { JsTemplateCatalogTable } from './js-template-catalog/JsTemplateCatalogTable';
import { JsTemplateUsageModal } from './js-template-catalog/JsTemplateUsageModal';
import { useJsTemplateCatalog } from './js-template-catalog/useJsTemplateCatalog';

interface FlowContextWithApi {
  api: ApiClientLike;
}

export function JsTemplateCatalogPage() {
  const { t } = useTranslation(NAMESPACE);
  const flowContext = useFlowContext() as FlowContextWithApi;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = theme.useToken();
  const {
    jobs: createJobs,
    error: createJobsError,
    addAcceptedJob,
    dismiss: dismissCreateJob,
  } = useJsTemplateCreateJobs();
  const { deletingTemplateId, entries, loadCatalog, loading, notice, removeTemplate, setNotice } = useJsTemplateCatalog(
    flowContext.api,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [usageEntry, setUsageEntry] = useState<JsTemplateCatalogEntry | null>(null);
  const observedCreateJobs = useRef<Map<string, JsTemplateCreateJobSummary> | null>(null);

  const handleSucceededJobs = useCallback(
    async (jobs: JsTemplateCreateJobSummary[]) => {
      for (const job of jobs) {
        invalidateJsTemplateSettingsDescriptorCache(flowContext.api, job.targetProjectId);
        invalidateJsTemplateRuntimeCache(flowContext.api, job.targetProjectId);
      }
      const refreshed = await loadCatalog();
      if (refreshed) {
        const job = jobs[jobs.length - 1];
        setNotice({
          type: 'success',
          message: t('Creation succeeded: {{name}}').replace('{{name}}', job.title || job.name),
        });
      }
    },
    [flowContext.api, loadCatalog, setNotice, t],
  );

  useEffect(() => {
    const currentJobs = new Map(createJobs.map((job) => [job.id, job]));
    const previousJobs = observedCreateJobs.current;
    observedCreateJobs.current = currentJobs;
    if (!previousJobs) {
      return;
    }

    const succeeded = [...previousJobs.values()].filter(
      (job) => (job.status === 'pending' || job.status === 'running') && !currentJobs.has(job.id),
    );
    const failed = createJobs.find((job) => {
      const previous = previousJobs.get(job.id);
      return (previous?.status === 'pending' || previous?.status === 'running') && job.status === 'failed';
    });

    if (succeeded.length > 0) {
      handleSucceededJobs(succeeded).catch(() => undefined);
    }
    if (failed) {
      const errorKey = getJsTemplateSyncErrorTranslationKey(failed.errorCode, failed.errorReasonCode);
      setNotice({
        type: 'error',
        message: `${t('Creation failed: {{name}}').replace('{{name}}', failed.title || failed.name)}: ${
          errorKey ? t(errorKey) : failed.errorMessage || t('JS Template creation failed')
        }`,
      });
    }
  }, [createJobs, handleSucceededJobs, setNotice, t]);

  useEffect(() => {
    for (const job of createJobs) {
      if (job.status === 'failed') {
        dismissCreateJob(job.id).catch(() => undefined);
      }
    }
  }, [createJobs, dismissCreateJob]);

  useEffect(() => {
    if (searchParams.get('create') === '1' && !createOpen) {
      setCreateOpen(true);
    }
  }, [createOpen, searchParams]);

  const clearCreateQuery = useCallback(() => {
    if (!searchParams.has('create') && !searchParams.has('destinationProjectId')) {
      return;
    }
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    nextSearchParams.delete('destinationProjectId');
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    clearCreateQuery();
  }, [clearCreateQuery]);

  const openSourceProject = useCallback(
    (entry: JsTemplateCatalogEntry) => {
      const query = new URLSearchParams({ projectId: entry.projectId, panel: 'source' });
      navigate(`/admin/settings/js-templates/source-projects?${query.toString()}`);
    },
    [navigate],
  );

  return (
    <Card variant="borderless">
      {createJobsError ? (
        <Alert
          message={t('Failed to load creation jobs')}
          showIcon
          style={{ marginBottom: token.margin }}
          type="error"
        />
      ) : null}
      {notice ? (
        <Alert
          closable
          message={notice.message}
          onClose={() => setNotice(null)}
          showIcon
          style={{ marginBottom: token.margin }}
          type={notice.type}
        />
      ) : null}

      <JsTemplateCatalogTable
        deletingTemplateId={deletingTemplateId}
        entries={entries}
        loading={loading}
        onCreate={() => setCreateOpen(true)}
        onDelete={removeTemplate}
        onOpenSourceProject={openSourceProject}
        onOpenUsage={setUsageEntry}
        onRefresh={loadCatalog}
      />

      <CreateJsTemplateModal
        destinationProjectId={searchParams.get('destinationProjectId') || undefined}
        onAcceptedJob={addAcceptedJob}
        onClose={closeCreate}
        onNotice={setNotice}
        onRefreshCatalog={loadCatalog}
        open={createOpen}
      />

      <JsTemplateUsageModal api={flowContext.api} entry={usageEntry} onClose={() => setUsageEntry(null)} />
    </Card>
  );
}

export default JsTemplateCatalogPage;
