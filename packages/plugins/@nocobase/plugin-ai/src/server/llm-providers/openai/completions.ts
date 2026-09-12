/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatOpenAI } from '@langchain/openai';
import { LLMProvider, ReasoningOptions, ResolvedReasoningOptions } from '../provider';

export class OpenAICompletionsProvider extends LLMProvider {
  declare chatModel: ChatOpenAI;

  get baseURL() {
    return 'https://api.openai.com/v1';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { name, schema } = structuredOutput || {};
    const reasoningOptions = this.resolveReasoningOptions(this.modelReasoningOptions);
    const responseFormatOptions: Record<string, any> = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = { schema, name: name ?? 'schema' };
    }
    return new ChatOpenAI({
      apiKey,
      ...this.modelOptions,
      ...(reasoningOptions.modelRequestParams || {}),
      modelKwargs: {
        response_format: responseFormatOptions,
        ...(reasoningOptions.modelKwargs || {}),
      },
      configuration: {
        baseURL: this.getResolvedBaseURL(),
      },
    });
  }

  protected resolveReasoningOptions(reasoning?: ReasoningOptions): ResolvedReasoningOptions {
    if (!reasoning || reasoning.mode === 'default') {
      return {};
    }
    const effort = reasoning.mode === 'off' ? 'none' : reasoning.mode;
    return {
      modelRequestParams: {
        reasoning: {
          effort,
        },
      },
    };
  }
}
