/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Card, Space, Spin, Tag, Typography } from 'antd';
import React, { useId, useMemo } from 'react';

import type { JsTemplateCreateJobStatus, JsTemplateCreateJobSummary } from '../../../shared/types';
import { getJsTemplateSyncErrorTranslationKey } from '../../hooks/useJsTemplateSync';
import { isTerminalCreateJobStatus, selectVisibleCreationJobs } from './logic';
import type { JsTemplateListTranslate } from './types';

const STATUS_ACTION_BUTTON_STYLE: React.CSSProperties = { height: 'auto', paddingInline: 0 };

interface JsTemplateCreationStatusProps {
  dismissingJobIds: Set<string>;
  jobs: JsTemplateCreateJobSummary[];
  marginBottom: number;
  onDismiss: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  t: JsTemplateListTranslate;
}

export function JsTemplateCreationStatus({
  dismissingJobIds,
  jobs,
  marginBottom,
  onDismiss,
  onRetry,
  t,
}: JsTemplateCreationStatusProps) {
  const headingId = useId();
  const visibleJobs = useMemo(() => selectVisibleCreationJobs(jobs), [jobs]);

  if (!visibleJobs.length) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} style={{ marginBottom }}>
      <Card size="small">
        <Typography.Title id={headingId} level={5} style={{ marginTop: 0 }}>
          {t('Creation status')}
        </Typography.Title>
        <div aria-label={t('Creation status')} aria-live="polite" aria-relevant="additions text" role="status">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
            {visibleJobs.map((job) => {
              const terminal = isTerminalCreateJobStatus(job.status);
              return (
                <li key={job.id}>
                  <Space align="start" size="small" wrap>
                    {terminal ? null : <Spin size="small" />}
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>{job.title || job.name}</Typography.Text>
                      {job.title ? (
                        <Typography.Text code type="secondary">
                          {job.name}
                        </Typography.Text>
                      ) : null}
                    </Space>
                    <Tag
                      color={job.status === 'failed' ? 'error' : job.status === 'succeeded' ? 'success' : 'processing'}
                    >
                      {creationStatusLabel(job.status, t)}
                    </Tag>
                    {job.status === 'failed' ? (
                      <>
                        <Typography.Text type="danger">{creationFailureMessage(job, t)}</Typography.Text>
                        <Button onClick={() => onRetry(job.id)} size="small" type="link">
                          {t('Retry')}
                        </Button>
                      </>
                    ) : null}
                    {terminal ? (
                      <Button
                        aria-label={`${t('Remove creation task')} ${job.title || job.name}`}
                        loading={dismissingJobIds.has(job.id)}
                        onClick={() => onDismiss(job.id)}
                        size="small"
                        style={STATUS_ACTION_BUTTON_STYLE}
                        type="link"
                      >
                        {t('Remove')}
                      </Button>
                    ) : null}
                  </Space>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
    </section>
  );
}

function creationStatusLabel(status: JsTemplateCreateJobStatus, t: JsTemplateListTranslate): string {
  switch (status) {
    case 'pending':
      return t('Creation pending');
    case 'running':
      return t('Creation running');
    case 'finalize-pending':
      return t('Creation finalizing');
    case 'succeeded':
      return t('Creation succeeded');
    case 'failed':
      return t('Creation failed');
  }
}

function creationFailureMessage(job: JsTemplateCreateJobSummary, t: JsTemplateListTranslate): string {
  const errorKey = getJsTemplateSyncErrorTranslationKey(job.errorCode, job.errorReasonCode);
  return errorKey ? t(errorKey) : job.errorMessage || t('JS Template creation failed');
}
