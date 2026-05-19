/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CancelError, TaskType } from '@nocobase/plugin-async-task-manager';
import PluginAIServer from '@nocobase/plugin-ai';
import type { ModelRef } from '@nocobase/plugin-ai';
import { HumanMessage } from '@langchain/core/messages';
import { buildFindTextsOptions, isBuiltInText, normalizeTextRecord } from '../translation-scope';
import type { LocalizationTextRecord, TranslationScope } from '../translation-scope';

export const LOCALIZATION_AI_TRANSLATE_TASK_TYPE = 'localization:ai-translate';
const TRANSLATION_BATCH_SIZE = 10;
const DEFAULT_TRANSLATION_WORKER_COUNT = 10;
const MIN_TRANSLATION_WORKER_COUNT = 1;
const MAX_TRANSLATION_WORKER_COUNT = 20;
const MAX_TRANSLATION_QUEUE_SIZE = TRANSLATION_BATCH_SIZE * 2;

const elapsed = (start: number) => Date.now() - start;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const truncateForLog = (value: string, maxLength = 500) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
const LEGACY_SYMBOL_TRANSLATIONS = new Set(['<', '=', '>']);
const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const getTranslationWorkerCount = () => {
  const value = Number.parseInt(process.env.AI_LOCALIZATION_CONCURRENCY || '', 10);
  if (Number.isInteger(value) && value >= MIN_TRANSLATION_WORKER_COUNT && value <= MAX_TRANSLATION_WORKER_COUNT) {
    return value;
  }
  return DEFAULT_TRANSLATION_WORKER_COUNT;
};

type TranslationMode = 'full' | 'incremental' | 'selected';

type ReferenceLocaleConfig = {
  primary?: string;
  fallback?: string;
};

export type TranslationReferenceLocales = {
  builtIn?: ReferenceLocaleConfig;
  custom?: ReferenceLocaleConfig;
};

type TranslationQueueItem = {
  row: LocalizationTextRecord;
  chunkIndex: number;
  isBuiltIn?: boolean;
};

type TaskParams = {
  mode: TranslationMode;
  locale: string;
  employeeUsername?: string;
  model?: ModelRef | null;
  userId?: number;
  textIds?: Array<string | number>;
  scope?: TranslationScope;
  referenceLocales?: TranslationReferenceLocales;
};

class LocalizationAITranslationError extends Error {
  constructor(
    message: string,
    readonly details: { id: string | number; text: string; error: string },
  ) {
    super(message);
    this.name = 'LocalizationAITranslationError';
  }
}

export class LocalizationAITranslateTask extends TaskType {
  static type = LOCALIZATION_AI_TRANSLATE_TASK_TYPE;

  async execute() {
    const params = this.record.params as TaskParams;
    const locale = params.locale || 'en-US';
    const employeeUsername = params.employeeUsername || 'lina';
    const aiPlugin = this.app.pm.get('ai') as PluginAIServer;
    if (!aiPlugin?.aiConversationsManager || !aiPlugin?.aiEmployeesManager) {
      throw new Error('AI plugin is not available');
    }
    const employee = await aiPlugin.aiEmployeesManager.getEmployee(employeeUsername);
    if (!employee) {
      throw new Error(`AI employee "${employeeUsername}" not found`);
    }
    const resolvedModel = await aiPlugin.aiEmployeesManager.resolveModel(employee, params.model);
    const { provider, model, service } = await aiPlugin.aiManager.getLLMService(resolvedModel);
    const defaultReferenceLocale = await this.getSystemDefaultLocale();
    const builtInMatchResources = await this.app.localeManager.getBuiltInResources('en-US');
    const referenceLocales = this.resolveReferenceLocales(params.referenceLocales, defaultReferenceLocale);
    const findTextsOptions = await buildFindTextsOptions({
      app: this.app,
      mode: params.mode,
      locale,
      scope: params.scope || 'all',
      textIds: params.textIds,
      fields: ['id', 'text', 'module'],
      sort: ['id'],
    });
    const workerCount = getTranslationWorkerCount();
    const countStart = Date.now();
    const total = await this.countTexts(findTextsOptions);
    this.logger?.debug('Localization AI translation task started', {
      taskId: this.record.id,
      mode: params.mode,
      locale,
      total,
      countElapsedMs: elapsed(countStart),
      workerCount,
      queueLimit: MAX_TRANSLATION_QUEUE_SIZE,
      defaultReferenceLocale,
      referenceLocales,
      scope: params.scope || 'all',
      provider: service?.provider,
      llmService: service?.name,
      model,
    });
    let translated = 0;
    let chunkIndex = 0;
    let producerDone = false;
    let firstError: Error | undefined;
    const queue: TranslationQueueItem[] = [];

    this.reportProgress({ total, current: 0 });

    const workers = Array.from({ length: workerCount }, (_, workerIndex) =>
      this.runTranslationWorker({
        workerIndex: workerIndex + 1,
        queue,
        isDone: () => producerDone,
        getError: () => firstError,
        setError: (error) => {
          firstError = firstError ?? error;
        },
        total,
        getTranslated: () => translated,
        incrementTranslated: () => {
          translated += 1;
          return translated;
        },
        locale,
        employeeUsername,
        employee,
        provider,
        service,
        model,
        referenceLocales,
      }),
    );

    try {
      await this.app.db.getRepository('localizationTexts').chunkWithCursor({
        ...findTextsOptions,
        chunkSize: TRANSLATION_BATCH_SIZE,
        beforeFind: async () => {
          while (!firstError && queue.length >= MAX_TRANSLATION_QUEUE_SIZE) {
            await sleep(100);
          }
          if (firstError) {
            throw firstError;
          }
        },
        callback: async (rows) => {
          chunkIndex += 1;
          const chunkStart = Date.now();
          const textRows = rows.map((row) => normalizeTextRecord(row)).filter(Boolean);
          const rowsWithScope = textRows.map((row) => ({
            row,
            isBuiltIn: isBuiltInText(row, builtInMatchResources),
          }));
          const queueItems = rowsWithScope.map(({ row, isBuiltIn }) => {
            return {
              row,
              chunkIndex,
              isBuiltIn,
            };
          });
          queue.push(...queueItems);
          this.logger?.debug('Localization AI translation chunk enqueued', {
            taskId: this.record.id,
            chunkIndex,
            rows: textRows.length,
            referenceLocales,
            queueSize: queue.length,
            elapsedMs: elapsed(chunkStart),
            translated,
            total,
          });
        },
      });
    } finally {
      producerDone = true;
    }

    await Promise.all(workers);

    if (firstError) {
      throw firstError;
    }

    this.logger?.debug('Localization AI translation task completed', {
      taskId: this.record.id,
      translated,
      total,
    });
    return {
      translated,
      total,
    };
  }

  private async countTexts(options: any): Promise<number> {
    return await this.app.db.getRepository('localizationTexts').count(options);
  }

  private async getReferenceTranslation(row: LocalizationTextRecord, locales: ReferenceLocaleConfig) {
    const localeList = [locales.primary, locales.fallback].filter(isString);
    if (!localeList.length) {
      return {};
    }
    const rows = await this.app.db.getRepository('localizationTranslations').find({
      fields: ['locale', 'translation'],
      filter: {
        textId: row.id,
        locale: {
          $in: localeList,
        },
      },
    });
    const referenceMap = new Map<string, string>();
    for (const row of rows) {
      const record = typeof row.toJSON === 'function' ? row.toJSON() : row;
      if (record?.locale && record.translation) {
        referenceMap.set(record.locale, record.translation);
      }
    }
    for (const locale of localeList) {
      const translation = referenceMap.get(locale);
      if (translation) {
        return { locale, translation };
      }
    }
    return {};
  }

  private async getSystemDefaultLocale() {
    const systemSetting = await this.app.db.getRepository('systemSettings')?.findOne();
    const enabledLanguages: string[] = systemSetting?.get('enabledLanguages') || [];
    return enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
  }

  private resolveReferenceLocales(
    referenceLocales: TranslationReferenceLocales | undefined,
    defaultReferenceLocale: string,
  ) {
    return {
      builtIn: {
        primary: referenceLocales?.builtIn?.primary || 'zh-CN',
        fallback: referenceLocales?.builtIn?.fallback || 'ja-JP',
      },
      custom: {
        primary: referenceLocales?.custom?.primary || defaultReferenceLocale,
        fallback: referenceLocales?.custom?.fallback || 'zh-CN',
      },
    };
  }

  private async runTranslationWorker(options: {
    workerIndex: number;
    queue: TranslationQueueItem[];
    isDone: () => boolean;
    getError: () => Error | undefined;
    setError: (error: Error) => void;
    total: number;
    getTranslated: () => number;
    incrementTranslated: () => number;
    locale: string;
    employeeUsername: string;
    employee: any;
    provider: any;
    service: any;
    model: string;
    referenceLocales: Required<TranslationReferenceLocales>;
  }) {
    const {
      workerIndex,
      queue,
      isDone,
      getError,
      setError,
      total,
      getTranslated,
      incrementTranslated,
      locale,
      employeeUsername,
      employee,
      provider,
      service,
      model,
      referenceLocales,
    } = options;

    while (!isDone() || queue.length > 0) {
      if (getError()) {
        return;
      }
      if (this.isCanceled) {
        throw new CancelError();
      }

      const item = queue.shift();
      if (!item) {
        await sleep(50);
        continue;
      }

      const { row, chunkIndex, isBuiltIn } = item;
      try {
        const textStart = Date.now();
        const referenceStart = Date.now();
        const references = isBuiltIn ? referenceLocales.builtIn : referenceLocales.custom;
        const reference = await this.getReferenceTranslation(row, references);
        const referenceTranslation = reference.translation;
        const referenceLocale = reference.locale;
        this.logger?.trace?.('Localization AI translation text started', {
          taskId: this.record.id,
          workerIndex,
          chunkIndex,
          textId: row.id,
          textLength: row.text?.length ?? 0,
          hasReferenceTranslation: Boolean(referenceTranslation),
          referenceLocale,
          referenceElapsedMs: elapsed(referenceStart),
          isBuiltIn,
          queueSize: queue.length,
          translated: getTranslated(),
          total,
        });
        const isLegacySymbolTranslation = LEGACY_SYMBOL_TRANSLATIONS.has(row.text);
        if (isLegacySymbolTranslation) {
          this.logger?.trace?.('Localization AI translation legacy symbol skipped', {
            taskId: this.record.id,
            workerIndex,
            chunkIndex,
            textId: row.id,
            text: row.text,
          });
        }
        const translation = isLegacySymbolTranslation
          ? row.text
          : await this.translateText({
              text: row.text,
              module: row.module,
              referenceTranslation,
              referenceLocale,
              isBuiltIn,
              locale,
              employeeUsername,
              employee,
              provider,
              service,
              model,
            });
        const aiElapsedMs = elapsed(textStart);
        const writeStart = Date.now();
        await this.app.db.getRepository('localizationTranslations').updateOrCreate({
          filterKeys: ['textId', 'locale'],
          values: {
            textId: row.id,
            locale,
            translation,
          },
        });
        const writeElapsedMs = elapsed(writeStart);
        const translated = incrementTranslated();
        this.reportProgress({ total, current: translated });
        this.logger?.debug('Localization AI translation text completed', {
          taskId: this.record.id,
          workerIndex,
          chunkIndex,
          textId: row.id,
          textLength: row.text?.length ?? 0,
          translationLength: translation.length,
          aiElapsedMs,
          writeElapsedMs,
          totalElapsedMs: elapsed(textStart),
          translated,
          total,
          queueSize: queue.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const details = {
          id: row.id,
          text: row.text,
          error: message,
        };
        this.logger?.error(`Failed to translate localization text ${row.id}: ${message}`, { error });
        if (error instanceof CancelError) {
          throw error;
        }
        setError(
          new LocalizationAITranslationError(`Failed to translate localization text ${row.id}: ${message}`, details),
        );
        return;
      }
    }
  }

  private async translateText(options: {
    text: string;
    module?: string;
    referenceTranslation?: string;
    referenceLocale?: string;
    isBuiltIn?: boolean;
    locale: string;
    employeeUsername: string;
    employee: any;
    provider: any;
    service: any;
    model: string;
  }) {
    const {
      text,
      module,
      referenceTranslation,
      referenceLocale,
      isBuiltIn,
      locale,
      employeeUsername,
      provider,
      service,
      model,
      employee,
    } = options;

    const setupStart = Date.now();
    const sourceText = text;
    const sourceLang = referenceLocale ? this.getLanguageName(referenceLocale) : 'auto';
    const targetLang = this.getLanguageName(locale);
    const context = this.buildProviderContext({
      systemPrompt: this.getEmployeeSystemPrompt(employee),
      sourceText,
      targetLang,
      referenceTranslation,
    });
    const invokeStart = Date.now();
    this.logger?.trace?.('Localization AI translation invoke started', {
      taskId: this.record.id,
      textLength: text?.length ?? 0,
      sourceTextLength: sourceText?.length ?? 0,
      locale,
      sourceLang,
      targetLang,
      module,
      employeeUsername,
      provider: service?.provider,
      llmService: service?.name,
      model,
      hasReferenceTranslation: Boolean(referenceTranslation),
      referenceLocale,
      isBuiltIn,
    });
    const result = await provider.invoke(context);
    const invokeElapsedMs = elapsed(invokeStart);

    this.logger?.trace?.('Localization AI translation invoke completed', {
      taskId: this.record.id,
      textLength: text?.length ?? 0,
      sourceTextLength: sourceText?.length ?? 0,
      locale,
      sourceLang,
      targetLang,
      module,
      employeeUsername,
      provider: service?.provider,
      llmService: service?.name,
      model,
      hasReferenceTranslation: Boolean(referenceTranslation),
      referenceLocale,
      isBuiltIn,
      setupElapsedMs: elapsed(setupStart) - invokeElapsedMs,
      invokeElapsedMs,
      totalElapsedMs: elapsed(setupStart),
    });

    const translation = this.extractTextContent(result?.content).trim();
    if (!translation) {
      throw new Error('LLM service returned empty translation');
    }
    this.logger?.trace?.('Localization AI translation result extracted', {
      taskId: this.record.id,
      textLength: text?.length ?? 0,
      sourceTextLength: sourceText?.length ?? 0,
      translationLength: translation.length,
      locale,
      sourceLang,
      targetLang,
      module,
      employeeUsername,
      provider: service?.provider,
      llmService: service?.name,
      model,
      hasReferenceTranslation: Boolean(referenceTranslation),
      referenceLocale,
      isBuiltIn,
      sourceText: truncateForLog(sourceText),
      referenceTranslation: referenceTranslation ? truncateForLog(referenceTranslation) : undefined,
      translation: truncateForLog(translation),
    });
    return translation;
  }

  private getEmployeeSystemPrompt(employee: any) {
    return (
      employee?.get?.('about') || employee?.get?.('defaultPrompt') || employee?.about || employee?.defaultPrompt || ''
    );
  }

  private buildProviderContext(options: {
    systemPrompt?: string;
    sourceText: string;
    targetLang: string;
    referenceTranslation?: string;
  }) {
    const { systemPrompt, sourceText, targetLang, referenceTranslation } = options;
    const prompt = (systemPrompt || '').trim();
    const reference = referenceTranslation
      ? `Refer to the following translation:
${sourceText} is translated as ${referenceTranslation}

`
      : '';
    const task = `Translate the following text into ${targetLang}. Output only the translated result without any additional explanation:
${sourceText}
`;
    const content = [prompt, `${reference}${task}`].filter(Boolean).join('\n\n');
    return {
      messages: [new HumanMessage(content)] as any,
    };
  }

  private getLanguageName(locale: string) {
    const normalized = locale.replace('_', '-');
    const map: Record<string, string> = {
      'en-US': 'English',
      'zh-CN': 'Chinese',
      'zh-TW': 'Traditional Chinese',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'fr-FR': 'French',
      'de-DE': 'German',
      'es-ES': 'Spanish',
      'it-IT': 'Italian',
      'pt-PT': 'Portuguese',
      'pt-BR': 'Portuguese',
      'ru-RU': 'Russian',
      'th-TH': 'Thai',
      'vi-VN': 'Vietnamese',
      'id-ID': 'Indonesian',
      'ms-MY': 'Malay',
      'ar-SA': 'Arabic',
      'hi-IN': 'Hindi',
      'tr-TR': 'Turkish',
      'nl-NL': 'Dutch',
      'pl-PL': 'Polish',
      'sv-SE': 'Swedish',
      'da-DK': 'Danish',
      'fi-FI': 'Finnish',
      'uk-UA': 'Ukrainian',
    };
    if (map[normalized]) {
      return map[normalized];
    }
    const language = normalized.split('-')[0];
    const languageMap: Record<string, string> = {
      en: 'English',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      fr: 'French',
      de: 'German',
      es: 'Spanish',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      th: 'Thai',
      vi: 'Vietnamese',
      id: 'Indonesian',
      ms: 'Malay',
      ar: 'Arabic',
      hi: 'Hindi',
      tr: 'Turkish',
      nl: 'Dutch',
      pl: 'Polish',
      sv: 'Swedish',
      da: 'Danish',
      fi: 'Finnish',
      uk: 'Ukrainian',
    };
    return languageMap[language] || language;
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
