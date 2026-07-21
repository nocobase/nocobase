/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LightExtensionPreviewProblemAppendInput,
  LightExtensionPreviewProblemCloseInput,
  LightExtensionPreviewProblemListInput,
  LightExtensionPreviewProblemOpenInput,
  LightExtensionPreviewProblemSessionResult,
  LightExtensionProblem,
} from '../../shared/types';
import { unwrapResourceResponse } from '../api/lightExtensionEntriesRequests';

export interface PreviewProblemApiClient {
  request<TResponse>(options: { url: string; method: string; data: unknown; skipNotify?: boolean }): Promise<TResponse>;
}

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export class LightExtensionPreviewProblemClient {
  constructor(private readonly api: PreviewProblemApiClient) {}

  async open(input: LightExtensionPreviewProblemOpenInput): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.request('open', input);
  }

  async append(input: LightExtensionPreviewProblemAppendInput): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.request('append', input);
  }

  async list(input: LightExtensionPreviewProblemListInput): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.request('list', input);
  }

  async watch(input: LightExtensionPreviewProblemListInput): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.request('watch', input);
  }

  async close(input: LightExtensionPreviewProblemCloseInput): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.request('close', input);
  }

  private async request(
    action: 'open' | 'append' | 'list' | 'watch' | 'close',
    input:
      | LightExtensionPreviewProblemOpenInput
      | LightExtensionPreviewProblemAppendInput
      | LightExtensionPreviewProblemListInput
      | LightExtensionPreviewProblemCloseInput,
  ): Promise<LightExtensionPreviewProblemSessionResult> {
    const response = await this.api.request<ResourceResponse<LightExtensionPreviewProblemSessionResult>>({
      url: `lightExtensionPreviewProblems:${action}`,
      method: 'post',
      data: input,
      skipNotify: true,
    });
    return assertSessionResult(unwrapResourceResponse(response));
  }
}

export interface ActiveLightExtensionPreviewProblemSession {
  readonly result: LightExtensionPreviewProblemSessionResult;
  append(problems: LightExtensionProblem[]): Promise<LightExtensionPreviewProblemSessionResult>;
  close(state: 'completed' | 'stale'): Promise<LightExtensionPreviewProblemSessionResult>;
}

export async function openLightExtensionPreviewProblemSession(
  client: LightExtensionPreviewProblemClient,
  input: LightExtensionPreviewProblemOpenInput,
): Promise<ActiveLightExtensionPreviewProblemSession> {
  const result = await client.open(input);
  const sessionInput = {
    sessionId: result.sessionId,
    repoId: result.repoId,
    entryId: result.entryId,
    ownerLocator: result.ownerLocator,
    snapshotId: result.snapshotId,
    artifactHash: result.artifactHash,
    executionId: result.executionId,
  };
  let state = result.state;
  return {
    result,
    async append(problems) {
      if (state !== 'active') {
        return { ...result, state, items: [] };
      }
      const next = await client.append({ ...sessionInput, problems });
      state = next.state;
      return next;
    },
    async close(nextState) {
      if (state !== 'active') {
        return { ...result, state, items: [] };
      }
      const next = await client.close({ ...sessionInput, state: nextState });
      state = next.state;
      return next;
    },
  };
}

function assertSessionResult(value: unknown): LightExtensionPreviewProblemSessionResult {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.sessionId !== 'string') {
    throw new Error('Invalid preview problem session response');
  }
  return value as unknown as LightExtensionPreviewProblemSessionResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
