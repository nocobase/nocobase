/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Flex } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../../constants';
import type { JsTemplateCreateJobSummary } from '../../../shared/types';

interface JsTemplateCreateJobStatusListProps {
  jobs: JsTemplateCreateJobSummary[];
  marginBottom: number;
  onDismiss: (jobId: string) => Promise<void>;
}

export function JsTemplateCreateJobStatusList({ jobs, marginBottom, onDismiss }: JsTemplateCreateJobStatusListProps) {
  const { t } = useTranslation(NAMESPACE);
  const [dismissingJobIds, setDismissingJobIds] = useState<Set<string>>(() => new Set());
  const [dismissErrorJobIds, setDismissErrorJobIds] = useState<Set<string>>(() => new Set());

  if (!jobs.length) {
    return null;
  }

  const dismiss = async (jobId: string) => {
    setDismissingJobIds((current) => new Set(current).add(jobId));
    setDismissErrorJobIds((current) => {
      const next = new Set(current);
      next.delete(jobId);
      return next;
    });
    try {
      await onDismiss(jobId);
    } catch {
      setDismissErrorJobIds((current) => new Set(current).add(jobId));
    } finally {
      setDismissingJobIds((current) => {
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
    }
  };

  return (
    <Flex aria-label={t('Creation tasks')} gap="small" role="list" style={{ marginBottom }} vertical>
      {jobs.map((job) => {
        const terminal = job.status === 'succeeded' || job.status === 'failed';
        const title = job.title || job.name;
        const description =
          job.status === 'failed'
            ? job.errorMessage || t('JS Template creation failed')
            : dismissErrorJobIds.has(job.id)
              ? t('Failed to remove creation task')
              : undefined;
        return (
          <div key={job.id} role="listitem">
            <Alert
              action={
                terminal ? (
                  <Button
                    aria-label={`${t('Remove creation task')} ${title}`}
                    loading={dismissingJobIds.has(job.id)}
                    onClick={() => dismiss(job.id)}
                    size="small"
                  >
                    {t('Remove')}
                  </Button>
                ) : undefined
              }
              description={description}
              message={`${title}: ${creationStatusLabel(job.status, t)}`}
              showIcon
              type={job.status === 'failed' ? 'error' : job.status === 'succeeded' ? 'success' : 'info'}
            />
          </div>
        );
      })}
    </Flex>
  );
}

function creationStatusLabel(status: JsTemplateCreateJobSummary['status'], t: (key: string) => string): string {
  switch (status) {
    case 'pending':
      return t('Creation pending');
    case 'running':
      return t('Creation running');
    case 'succeeded':
      return t('Creation succeeded');
    case 'failed':
      return t('Creation failed');
  }
}
