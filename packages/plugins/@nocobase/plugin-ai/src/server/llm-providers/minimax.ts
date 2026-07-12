/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { AttachmentModel, PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import _ from 'lodash';
import { encodeFile } from '../utils';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { AIMessageChunk } from '@langchain/core/messages';
import { ReasoningChatOpenAI } from './common/reasoning';
import { LLMProvider, ParsedAttachmentResult } from './provider';

const MINIMAX_M3 = 'MiniMax-M3';
const MINIMAX_M27 = 'MiniMax-M2.7';

function isThinkingMode(value: unknown): value is 'adaptive' | 'disabled' {
  return value === 'adaptive' || value === 'disabled';
}

function isServiceTier(value: unknown): value is 'standard' | 'priority' {
  return value === 'standard' || value === 'priority';
}

export class MiniMaxProvider extends LLMProvider {
  declare chatModel: ReasoningChatOpenAI;

  get baseURL() {
    return 'https://api.minimax.io/v1';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { thinking, serviceTier, ...modelOptions } = this.modelOptions || {};
    if (modelOptions.maxCompletionTokens === -1) {
      delete modelOptions.maxCompletionTokens;
    }

    const modelKwargs: Record<string, unknown> = {
      reasoning_split: true,
    };
    if (modelOptions.model === MINIMAX_M3 && isThinkingMode(thinking)) {
      modelKwargs.thinking = { type: thinking };
    }
    if (modelOptions.model === MINIMAX_M3 && isServiceTier(serviceTier)) {
      modelKwargs.service_tier = serviceTier;
    }

    return new ReasoningChatOpenAI({
      apiKey,
      ...modelOptions,
      modelKwargs,
      configuration: {
        baseURL: this.getResolvedBaseURL(),
      },
      verbose: true,
    });
  }

  protected isApiSupportedAttachment(attachment: AttachmentModel): boolean {
    if (this.modelOptions?.model !== MINIMAX_M3) {
      return false;
    }
    return ['image/', 'video/'].some((prefix) => attachment?.mimetype?.startsWith(prefix));
  }

  protected async convertToContent(ctx: Context, attachment: AttachmentModel): Promise<ParsedAttachmentResult> {
    if (!attachment.mimetype?.startsWith('video/')) {
      return super.convertToContent(ctx, attachment);
    }

    const fileManager = this.app.pm.get('file-manager') as PluginFileManagerServer;
    const url = await fileManager.getFileURL(attachment);
    const data = await encodeFile(ctx, decodeURIComponent(url));
    return {
      placement: 'contentBlocks',
      content: {
        type: 'video_url',
        video_url: {
          url: `data:${attachment.mimetype};base64,${data}`,
        },
      },
    };
  }

  parseResponseMessage(message: Model) {
    const result = super.parseResponseMessage(message);
    if (['user', 'tool'].includes(result?.role)) {
      return result;
    }
    const { metadata } = message?.toJSON() ?? {};
    if (!_.isEmpty(metadata?.additional_kwargs?.reasoning_content)) {
      result.content = {
        ...(result.content ?? {}),
        reasoning: {
          status: 'stop',
          content: metadata?.additional_kwargs.reasoning_content,
        },
      };
    }
    return result;
  }

  parseReasoningContent(chunk: AIMessageChunk): { status: string; content: string } | null {
    if (!_.isEmpty(chunk?.additional_kwargs?.reasoning_content)) {
      return {
        status: 'streaming',
        content: chunk.additional_kwargs.reasoning_content as string,
      };
    }
    return null;
  }
}

export const minimaxProviderOptions: LLMProviderMeta = {
  title: 'MiniMax',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: [MINIMAX_M3, MINIMAX_M27],
  },
  provider: MiniMaxProvider,
};
