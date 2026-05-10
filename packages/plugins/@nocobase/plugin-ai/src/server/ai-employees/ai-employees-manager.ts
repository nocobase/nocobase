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
    if (model?.llmService && model?.model) {
      return model;
    }

    const modelSettings = employee.get?.('modelSettings') || (employee as any).modelSettings;
    if (modelSettings?.llmService && modelSettings?.model) {
      return modelSettings;
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
