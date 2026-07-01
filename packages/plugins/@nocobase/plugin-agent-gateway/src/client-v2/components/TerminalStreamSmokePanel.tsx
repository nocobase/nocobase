/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Descriptions, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useFlowContext } from '@nocobase/flow-engine';

import { useT } from '../locale';
import { AgentGatewayContext } from '../pages/AgentGatewayPageUtils';
import { TerminalStreamClient, TerminalStreamClientState } from '../utils/terminalStreamClient';

export function isTerminalStreamSmokeEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('terminalStreamSmoke') === '1';
}

function getAuthFromContext(ctx: AgentGatewayContext) {
  const auth = ctx.api.auth;
  return {
    token: auth?.token || '',
    authenticator: auth?.getAuthenticator?.() || auth?.authenticator || 'basic',
    role: auth?.role || undefined,
  };
}

export function TerminalStreamSmokePanel({ runId }: { runId: string }) {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const auth = useMemo(() => getAuthFromContext(ctx), [ctx]);
  const [state, setState] = useState<TerminalStreamClientState>({
    connectionState: 'closed',
    currentOffset: 0,
    previewText: '',
  });

  useEffect(() => {
    if (!runId || !isTerminalStreamSmokeEnabled()) {
      return;
    }
    const client = new TerminalStreamClient({
      runId,
      token: auth.token,
      authenticator: auth.authenticator,
      role: auth.role,
      onStateChange: setState,
    });
    client.connect();
    return () => {
      client.close();
    };
  }, [auth.authenticator, auth.role, auth.token, runId]);

  if (!isTerminalStreamSmokeEnabled()) {
    return null;
  }

  return (
    <Alert
      type={state.connectionState === 'error' ? 'error' : 'info'}
      showIcon
      message={t('Terminal stream smoke')}
      description={
        <Descriptions
          size="small"
          column={1}
          data-testid="agent-gateway-terminal-stream-smoke-panel"
          aria-label={t('Terminal stream smoke')}
        >
          <Descriptions.Item label={t('Connection state')}>
            <span data-testid="agent-gateway-terminal-stream-state">{state.connectionState}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t('Current offset')}>
            <span data-testid="agent-gateway-terminal-stream-offset">{state.currentOffset}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t('Last protocol error')}>
            <span data-testid="agent-gateway-terminal-stream-error">{state.lastErrorCode || '-'}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t('Last decoded text')}>
            <Typography.Text
              data-testid="agent-gateway-terminal-stream-preview"
              code
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {state.previewText || '-'}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      }
    />
  );
}

export default TerminalStreamSmokePanel;
