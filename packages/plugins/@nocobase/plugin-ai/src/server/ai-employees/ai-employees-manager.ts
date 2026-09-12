/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginAIServer from '../plugin';
import type { Model } from '@nocobase/database';
import type { ModelRef } from './ai-employee';

export class AIEmployeesManager {
  conversationController = new Map<string, AbortController>();

  constructor(protected plugin: PluginAIServer) {}

  async getEmployee(username: string): Promise<Model | null> {
    return await this.plugin.db.getRepository('aiEmployees').findOne({
      filter: {
        username,
      },
    });
  }

  async resolveModel(employee: Model, model?: ModelRef | null): Promise<ModelRef> {
    const modelSettings = employee.get?.('modelSettings') || (employee as any).modelSettings;
    if (modelSettings?.enabled) {
      const models = Array.isArray(modelSettings.models) ? modelSettings.models : [];
      const configuredModels = models
        .filter((item) => item?.llmService && item?.model)
        .map((item) => ({
          llmService: item.llmService,
          model: item.model,
        }));
      if (!configuredModels.length && modelSettings.llmService && modelSettings.model) {
        configuredModels.push({
          llmService: modelSettings.llmService,
          model: modelSettings.model,
        });
      }
      if (!configuredModels.length) {
        throw new Error('AI employee model not configured');
      }

      if (
        model?.llmService &&
        model?.model &&
        configuredModels.some((item) => item.llmService === model.llmService && item.model === model.model)
      ) {
        return model;
      }

      const firstModel = configuredModels[0];
      if (firstModel?.llmService && firstModel?.model) {
        return {
          llmService: firstModel.llmService,
          model: firstModel.model,
        };
      }
    }

    if (model?.llmService && model?.model) {
      return model;
    }

    return await this.plugin.aiManager.resolveModel();
  }

  onAbortConversation(sessionId: string) {
    const controller = this.conversationController.get(sessionId);
    if (controller) {
      controller.abort();
      this.conversationController.delete(sessionId);
      return true;
    }
    return false;
  }

  abortConversation(sessionId: string) {
    const aborted = this.onAbortConversation(sessionId);
    if (!aborted) {
      this.plugin.sendSyncMessage({
        type: 'aiEmployees:abortConversation',
        payload: {
          sessionId,
        },
      });
    }
  }
}
