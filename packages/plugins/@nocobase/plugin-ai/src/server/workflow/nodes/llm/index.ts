/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowNodeModel, Instruction, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';
import PluginAIServer from '../../../plugin';
import { LLMProvider } from '../../../llm-providers/provider';
import _ from 'lodash';

export class LLMInstruction extends Instruction {
  async getLLMProvider(llmService: string, chatOptions: any) {
    const service = await this.workflow.db.getRepository('llmServices').findOne({
      filter: {
        name: llmService,
      },
    });
    if (!service) {
      throw new Error('invalid llm service');
    }
    const plugin = this.workflow.app.pm.get('ai') as PluginAIServer;
    const providerOptions = plugin.aiManager.llmProviders.get(service.provider);
    if (!providerOptions) {
      throw new Error('invalid llm provider');
    }
    const Provider = providerOptions.provider;
    const provider = new Provider({ app: this.workflow.app, serviceOptions: service.options, chatOptions });
    return provider;
  }

  async run(node: FlowNodeModel, input: any, processor: Processor) {
    const { llmService, ...chatOptions } = processor.getParsedValue(node.config, node.id);
    let provider: LLMProvider;
    try {
      provider = await this.getLLMProvider(llmService, chatOptions);
    } catch (e) {
      return {
        status: JOB_STATUS.ERROR,
        result: e.message,
      };
    }

    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: input?.id ?? null,
    });

    // eslint-disable-next-line promise/catch-or-return
    provider
      .invokeChat()
      .then((aiMsg) => {
        let raw = aiMsg;
        if (aiMsg.raw) {
          raw = aiMsg.raw;
        }

        job.set({
          status: JOB_STATUS.RESOLVED,
          result: {
            id: raw.id,
            content: raw.content,
            additionalKwargs: raw.additional_kwargs,
            responseMetadata: raw.response_metadata,
            toolCalls: raw.tool_calls,
            structuredContent: aiMsg.parsed,
          },
        });
      })
      .catch((e) => {
        processor.logger.error(`llm invoke failed, ${e.message}`, {
          node: node.id,
          error: e,
          chatOptions: _.omit(chatOptions, 'messages'),
        });
        job.set({
          status: JOB_STATUS.ERROR,
          result: e.message,
        });
      })
      .finally(() => {
        setImmediate(() => {
          this.workflow.resume(job);
        });
      });

    processor.logger.trace(`llm invoke, waiting for response...`, {
      node: node.id,
    });
    return processor.exit();
  }

  resume(node: FlowNodeModel, job: any, processor: Processor) {
    const { ignoreFail } = node.config;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
