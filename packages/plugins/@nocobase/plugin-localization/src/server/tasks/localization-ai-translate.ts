/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CancelError, TaskType } from '@nocobase/plugin-async-task-manager';
import { Context } from '@nocobase/actions';
import PluginAIServer, { AIEmployee } from '@nocobase/plugin-ai';
import type { ModelRef } from '@nocobase/plugin-ai';

export const LOCALIZATION_AI_TRANSLATE_TASK_TYPE = 'localization:ai-translate';

type TranslationMode = 'full' | 'incremental';

type LocalizationTextRecord = {
  id: string | number;
  text: string;
  module?: string;
  translation?: string;
  translationId?: string | number;
};

type TaskParams = {
  mode: TranslationMode;
  locale: string;
  employeeUsername?: string;
  model?: ModelRef | null;
  userId?: number;
};

export class LocalizationAITranslateTask extends TaskType {
  static type = LOCALIZATION_AI_TRANSLATE_TASK_TYPE;

  async execute() {
    const params = this.record.params as TaskParams;
    const locale = params.locale || 'en-US';
    const employeeUsername = params.employeeUsername || 'lina';
    const rows = await this.findTexts(params.mode, locale);
    const aiPlugin = this.app.pm.get('ai') as PluginAIServer;
    if (!aiPlugin?.aiConversationsManager || !aiPlugin?.aiEmployeesManager) {
      throw new Error('AI plugin is not available');
    }
    const employee = await aiPlugin.aiEmployeesManager.getEmployee(employeeUsername);
    if (!employee) {
      throw new Error(`AI employee "${employeeUsername}" not found`);
    }
    const model = await aiPlugin.aiEmployeesManager.resolveModel(employee, params.model);
    const failures: { id: string | number; text: string; error: string }[] = [];
    let translated = 0;

    this.reportProgress({ total: rows.length, current: 0 });

    for (const [index, row] of rows.entries()) {
      if (this.isCanceled) {
        throw new CancelError();
      }
      try {
        const translation = await this.translateText({
          text: row.text,
          module: row.module,
          locale,
          employeeUsername,
          aiPlugin,
          employee,
          model,
          userId: params.userId,
        });
        await this.app.db.getRepository('localizationTranslations').updateOrCreate({
          filterKeys: ['textId', 'locale'],
          values: {
            textId: row.id,
            locale,
            translation,
          },
        });
        translated += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({
          id: row.id,
          text: row.text,
          error: message,
        });
        this.logger?.error(`Failed to translate localization text ${row.id}: ${message}`, { error });
      } finally {
        this.reportProgress({ total: rows.length, current: index + 1 });
      }
    }

    if (failures.length) {
      const firstFailure = failures[0];
      throw new Error(
        `Failed to translate ${failures.length} of ${rows.length} localization entries. First failed entry ${firstFailure.id}: ${firstFailure.error}`,
      );
    }

    return undefined;
  }

  private async findTexts(mode: TranslationMode, locale: string): Promise<LocalizationTextRecord[]> {
    const options: any = {
      fields: ['id', 'text', 'module'],
      sort: ['id'],
    };

    if (mode === 'incremental') {
      options.include = [{ association: 'translations', where: { locale }, required: false }];
      options.where = {
        '$translations.id$': null,
      };
    }

    return this.app.db.getRepository('localizationTexts').find(options) as Promise<LocalizationTextRecord[]>;
  }

  private async translateText(options: {
    text: string;
    module?: string;
    locale: string;
    employeeUsername: string;
    aiPlugin: PluginAIServer;
    employee: any;
    model: TaskParams['model'];
    userId?: number;
  }) {
    const { text, module, locale, employeeUsername, userId, aiPlugin, employee, model } = options;

    const user = userId ? { id: userId } : undefined;
    const currentRoles = await this.resolveUserRoles(userId);
    const timezone = '+00:00';
    const ctx = {
      app: this.app,
      db: this.app.db,
      log: this.logger,
      logger: this.logger,
      state: { currentUser: user, currentRole: currentRoles[0], currentRoles },
      auth: { user },
      getCurrentLocale: () => locale,
      action: {
        params: {
          values: {},
        },
      },
      get: (name: string) => {
        const header = name?.toLowerCase();
        if (header === 'x-locale') {
          return locale;
        }
        if (header === 'x-timezone') {
          return timezone;
        }
        return '';
      },
      request: {
        query: {
          locale,
        },
        get: (name: string) => {
          const header = name?.toLowerCase();
          if (header === 'x-locale') {
            return locale;
          }
          if (header === 'x-timezone') {
            return timezone;
          }
          return '';
        },
        header: {
          'x-locale': locale,
          'x-timezone': timezone,
        },
      },
      req: {
        headers: {
          'x-locale': locale,
          'x-timezone': timezone,
        },
      },
      throw: (status: number, message?: string) => {
        const error = new Error(message || `Request failed with status ${status}`);
        (error as any).status = status;
        throw error;
      },
    } as unknown as Context;

    const conversation = await aiPlugin.aiConversationsManager.create({
      userId,
      aiEmployee: { username: employeeUsername },
      title: `Translate localization text ${String(text).slice(0, 30)}`,
      category: 'task',
    });

    const aiEmployee = new AIEmployee({
      ctx,
      employee,
      sessionId: conversation.sessionId,
      model,
    });

    const result = await aiEmployee.invoke({
      userMessages: [
        {
          role: 'user',
          content: {
            type: 'text',
            content: this.getUserMessage({ text, module, locale }),
          },
        },
      ],
    });

    const translation = this.extractTranslation(result);
    if (!translation) {
      throw new Error('AI employee returned empty translation');
    }
    return translation;
  }

  private async resolveUserRoles(userId?: number) {
    if (!userId) {
      return ['root'];
    }
    const rolesUsers = await this.app.db.getRepository('rolesUsers').find({
      filter: {
        userId,
      },
    });
    return rolesUsers.map((item) => item.roleName).filter(Boolean);
  }

  private getUserMessage(options: { text: string; module?: string; locale: string }) {
    const { text, module, locale } = options;
    return `Target locale: ${locale}
Module: ${module || ''}
Source text:
${text}`;
  }

  private extractTranslation(result: any) {
    const messages = result?.messages || [];
    const content = messages.at(-1)?.content;
    return this.extractTextContent(content).trim();
  }

  private extractTextContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            if ('type' in item && (item as any).type === 'text') {
              return typeof (item as any).text === 'string' ? (item as any).text : '';
            }
            if ('content' in item) {
              return this.extractTextContent((item as any).content);
            }
          }
          return '';
        })
        .join('')
        .trim();
    }

    if (content && typeof content === 'object' && 'content' in content) {
      return this.extractTextContent((content as any).content);
    }

    return '';
  }
}
