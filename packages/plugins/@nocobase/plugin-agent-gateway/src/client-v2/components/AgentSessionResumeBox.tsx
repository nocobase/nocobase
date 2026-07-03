/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SendOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

interface ResumeSourceRun {
  id: string;
  runCode?: string;
  status?: string;
  agentSessionId?: string | null;
  agentSessionProvider?: string | null;
  agentSessionProviderId?: string | null;
  agentSessionCapabilitiesJson?: {
    resumeSession?: unknown;
    resumeWithMessage?: unknown;
  } | null;
}

export interface AgentSessionResumeInput {
  message: string;
  idempotencyKey: string;
}

export interface AgentSessionResumeBoxProps {
  run: ResumeSourceRun;
  t(key: string, options?: Record<string, unknown>): string;
  loading?: boolean;
  onResume(input: AgentSessionResumeInput): Promise<void>;
}

const RESUMABLE_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDisabledReason(run: ResumeSourceRun, t: AgentSessionResumeBoxProps['t']) {
  if (!RESUMABLE_RUN_STATUSES.has(run.status || '')) {
    return t('Resume is available after the run ends');
  }
  if (!run.agentSessionId || !run.agentSessionProviderId) {
    return t('Resume requires a provider session id');
  }
  if (run.agentSessionCapabilitiesJson?.resumeSession === false) {
    return t('Agent session resume is not supported by this provider');
  }
  if (run.agentSessionCapabilitiesJson?.resumeWithMessage === false) {
    return t('Agent session does not support resume with message');
  }
  return '';
}

export function AgentSessionResumeBox({ run, t, loading = false, onResume }: AgentSessionResumeBoxProps) {
  const [message, setMessage] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const [submittedMessageForKey, setSubmittedMessageForKey] = useState<string | null>(null);
  const disabledReason = useMemo(() => getDisabledReason(run, t), [run, t]);
  const canSubmit = !disabledReason && !loading && Boolean(message.trim());

  const renewKey = useCallback(() => {
    setIdempotencyKey(createIdempotencyKey());
  }, []);

  const handleMessageChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextMessage = event.target.value;
      setMessage(nextMessage);
      if (submittedMessageForKey !== null && nextMessage !== submittedMessageForKey) {
        setSubmittedMessageForKey(null);
        renewKey();
      }
    },
    [renewKey, submittedMessageForKey],
  );

  const handleSubmit = useCallback(async () => {
    const submittedMessage = message;
    setSubmittedMessageForKey(submittedMessage);
    try {
      await onResume({
        message: submittedMessage,
        idempotencyKey,
      });
      setMessage('');
      setSubmittedMessageForKey(null);
      renewKey();
    } catch {
      // The page-level request handler already shows the error. Keep the key
      // bound to this message so a same-message retry remains idempotent.
    }
  }, [idempotencyKey, message, onResume, renewKey]);

  return (
    <section aria-label={t('Resume agent session')}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('Resume agent session')}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t('Continuation from')} {run.runCode || run.id}
          </Typography.Text>
        </Space>
        {disabledReason ? <Alert type="info" showIcon message={disabledReason} /> : null}
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item style={{ marginBottom: 8 }}>
            <Input.TextArea
              aria-label={t('Resume message')}
              autoSize={{ minRows: 3, maxRows: 6 }}
              disabled={Boolean(disabledReason) || loading}
              maxLength={16000}
              onChange={handleMessageChange}
              placeholder={t('Type a follow-up message for this agent session')}
              showCount
              value={message}
            />
          </Form.Item>
          <Button htmlType="submit" type="primary" icon={<SendOutlined />} disabled={!canSubmit} loading={loading}>
            {t('Resume session')}
          </Button>
        </Form>
      </Space>
    </section>
  );
}

export default AgentSessionResumeBox;
