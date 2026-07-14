/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import type { AgentSessionResumeInput } from '../../../components/AgentSessionResumeBox';
import {
  getApiErrorMessage,
  getRequiredResponseData,
  requestAgentGatewayAction,
} from '../../../pages/AgentGatewayPageUtils';
import type {
  AgentGatewayPageContext,
  ResumeAgentSessionResult,
  RunRecord,
  TFunction,
} from '../../../pages/runs/types';

interface UseRunMutationsOptions {
  ctx: AgentGatewayPageContext;
  t: TFunction;
  openRunById(runId: string): void;
  refreshRunDetails(): void;
  refreshRuns(): void;
}

export function useRunMutations({ ctx, t, openRunById, refreshRunDetails, refreshRuns }: UseRunMutationsOptions) {
  const cancelRunRequest = useRequest(
    async (run: RunRecord) => {
      const response = await requestAgentGatewayAction<RunRecord>(ctx.api, AGENT_GATEWAY_API_ACTIONS.cancelRun, {
        method: 'post',
        targetKey: run.id,
      });
      return getRequiredResponseData(response, t('Failed to cancel run'));
    },
    {
      manual: true,
      onSuccess() {
        ctx.message?.success(t('Cancel requested'));
        refreshRuns();
        refreshRunDetails();
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to cancel run')));
      },
    },
  );

  const resumeSessionRequest = useRequest(
    async (options: { run: RunRecord } & AgentSessionResumeInput) => {
      if (!options.run.agentSessionId) {
        throw new Error(t('No agent session'));
      }
      const response = await requestAgentGatewayAction<ResumeAgentSessionResult>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.resumeAgentSession,
        {
          method: 'post',
          targetKey: options.run.agentSessionId,
          data: {
            message: options.message,
            idempotencyKey: options.idempotencyKey,
            resumedFromRunId: options.run.id,
          },
        },
      );
      return getRequiredResponseData(response, t('Failed to resume session'));
    },
    {
      manual: true,
      onSuccess(result) {
        openRunById(String(result.runId));
        refreshRuns();
        ctx.message?.success(result.deduped ? t('Continuation run already exists') : t('Continuation run created'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to resume session')));
      },
    },
  );

  return {
    cancelRunRequest,
    resumeSessionRequest,
  };
}
