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

export const LOCALIZATION_AI_TRANSLATE_TASK_TYPE = 'localization:ai-translate';
const TRANSLATION_BATCH_SIZE = 10;
const TRANSLATION_WORKER_COUNT = 20;
const MAX_TRANSLATION_QUEUE_SIZE = TRANSLATION_BATCH_SIZE * 2;

const elapsed = (start: number) => Date.now() - start;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const truncateForLog = (value: string, maxLength = 500) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
const LEGACY_SYMBOL_TRANSLATIONS = new Set(['<', '=', '>']);

type TranslationMode = 'full' | 'incremental' | 'selected';

type LocalizationTextRecord = {
  id: string | number;
  text: string;
  module?: string;
  translation?: string;
  translationId?: string | number;
};

type TranslationQueueItem = {
  row: LocalizationTextRecord;
  chunkIndex: number;
  englishReference?: string;
  referenceTranslation?: string;
  referenceLocale?: string;
  isBuiltIn?: boolean;
};

type TaskParams = {
  mode: TranslationMode;
  locale: string;
  employeeUsername?: string;
  model?: ModelRef | null;
  userId?: number;
  textIds?: Array<string | number>;
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
    const builtInReferenceResources = await this.app.localeManager.getBuiltInResources('zh-CN');
    const builtInMatchResources = await this.app.localeManager.getBuiltInResources('en-US');
    const countStart = Date.now();
    const total = await this.countTexts(params.mode, locale, params.textIds);
    this.logger?.debug('Localization AI translation count completed', {
      taskId: this.record.id,
      mode: params.mode,
      locale,
      total,
      elapsedMs: elapsed(countStart),
    });
    let translated = 0;
    let chunkIndex = 0;
    let producerDone = false;
    let firstError: Error | undefined;
    const queue: TranslationQueueItem[] = [];

    this.reportProgress({ total, current: 0 });

    const workers = Array.from({ length: TRANSLATION_WORKER_COUNT }, (_, workerIndex) =>
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
      }),
    );

    try {
      await this.app.db.getRepository('localizationTexts').chunkWithCursor({
        ...this.buildFindTextsOptions(params.mode, locale, params.textIds),
        chunkSize: TRANSLATION_BATCH_SIZE,
        beforeFind: async () => {
          while (!firstError && queue.length >= MAX_TRANSLATION_QUEUE_SIZE) {
            await sleep(100);
          }
          if (firstError) {
            throw firstError;
          }
          this.logger?.debug('Localization AI translation chunk query started', {
            taskId: this.record.id,
            chunkIndex: chunkIndex + 1,
            translated,
            total,
          });
        },
        afterFind: async (rows) => {
          const firstRow = this.normalizeTextRecord(rows[0]);
          const lastRow = this.normalizeTextRecord(rows.at(-1));
          this.logger?.debug('Localization AI translation chunk query completed', {
            taskId: this.record.id,
            chunkIndex: chunkIndex + 1,
            rows: rows.length,
            firstTextId: firstRow?.id,
            lastTextId: lastRow?.id,
          });
        },
        callback: async (rows) => {
          chunkIndex += 1;
          const chunkStart = Date.now();
          const textRows = rows.map((row) => this.normalizeTextRecord(row)).filter(Boolean);
          this.logger?.debug('Localization AI translation chunk processing started', {
            taskId: this.record.id,
            chunkIndex,
            rows: textRows.length,
            firstTextId: textRows[0]?.id,
            lastTextId: textRows.at(-1)?.id,
            translated,
            total,
          });
          const textIds = textRows.map((row) => row.id);
          const englishReferences = await this.getLocaleReferences(textIds, 'en-US');
          const defaultLocaleReferences =
            defaultReferenceLocale === 'en-US'
              ? englishReferences
              : await this.getLocaleReferences(textIds, defaultReferenceLocale);
          const queueItems = textRows.map((row) => {
            const isBuiltIn = this.isBuiltInText(row, builtInMatchResources);
            return {
              row,
              chunkIndex,
              englishReference: englishReferences.get(String(row.id)),
              referenceTranslation: isBuiltIn
                ? this.getBuiltInReference(row, builtInReferenceResources)
                : defaultLocaleReferences.get(String(row.id)),
              referenceLocale: isBuiltIn ? 'zh-CN' : defaultReferenceLocale,
              isBuiltIn,
            };
          });
          queue.push(...queueItems);
          this.logger?.debug('Localization AI translation chunk enqueued', {
            taskId: this.record.id,
            chunkIndex,
            rows: textRows.length,
            englishReferences: englishReferences.size,
            referenceLocale: defaultReferenceLocale,
            referenceTranslations: queueItems.filter((item) => item.referenceTranslation).length,
            builtInReferences: queueItems.filter((item) => item.isBuiltIn && item.referenceTranslation).length,
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

    return {
      translated,
      total,
    };
  }

  private async countTexts(mode: TranslationMode, locale: string, textIds?: Array<string | number>): Promise<number> {
    return await this.app.db
      .getRepository('localizationTexts')
      .count(this.buildFindTextsOptions(mode, locale, textIds));
  }

  private buildFindTextsOptions(mode: TranslationMode, locale: string, textIds?: Array<string | number>) {
    const options: any = {
      fields: ['id', 'text', 'module'],
      sort: ['id'],
    };

    if (mode === 'selected') {
      options.filter = {
        id: {
          $in: textIds || [],
        },
      };
    }

    if (mode === 'incremental') {
      options.include = [{ association: 'translations', where: { locale }, required: false }];
      options.where = {
        '$translations.id$': null,
      };
    }

    return options;
  }

  private normalizeTextRecord(row: any): LocalizationTextRecord | undefined {
    if (!row) {
      return undefined;
    }
    return typeof row.toJSON === 'function' ? row.toJSON() : row;
  }

  private async getLocaleReferences(textIds: Array<string | number>, locale: string) {
    const references = new Map<string, string>();
    if (!textIds.length) {
      return references;
    }
    const rows = await this.app.db.getRepository('localizationTranslations').find({
      fields: ['textId', 'translation'],
      filter: {
        locale,
        textId: {
          $in: textIds,
        },
      },
    });
    for (const row of rows) {
      const record = typeof row.toJSON === 'function' ? row.toJSON() : row;
      if (record?.textId != null && record.translation) {
        references.set(String(record.textId), record.translation);
      }
    }
    return references;
  }

  private async getSystemDefaultLocale() {
    const systemSetting = await this.app.db.getRepository('systemSettings')?.findOne();
    const enabledLanguages: string[] = systemSetting?.get('enabledLanguages') || [];
    return enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
  }

  private getModuleName(row: LocalizationTextRecord) {
    return row.module?.replace('resources.', '');
  }

  private isBuiltInText(row: LocalizationTextRecord, resources: Record<string, Record<string, string>>) {
    const moduleName = this.getModuleName(row);
    return Boolean(moduleName && resources[moduleName]?.[row.text] !== undefined);
  }

  private getBuiltInReference(row: LocalizationTextRecord, resources: Record<string, Record<string, string>>) {
    const moduleName = this.getModuleName(row);
    return moduleName ? resources[moduleName]?.[row.text] : undefined;
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

      const { row, chunkIndex, englishReference, referenceTranslation, referenceLocale, isBuiltIn } = item;
      try {
        const textStart = Date.now();
        this.logger?.debug('Localization AI translation text started', {
          taskId: this.record.id,
          workerIndex,
          chunkIndex,
          textId: row.id,
          textLength: row.text?.length ?? 0,
          hasEnglishReference: Boolean(englishReference),
          hasReferenceTranslation: Boolean(referenceTranslation),
          referenceLocale,
          isBuiltIn,
          queueSize: queue.length,
          translated: getTranslated(),
          total,
        });
        const isLegacySymbolTranslation = LEGACY_SYMBOL_TRANSLATIONS.has(row.text);
        if (isLegacySymbolTranslation) {
          this.logger?.debug('Localization AI translation legacy symbol skipped', {
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
              englishReference,
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

    this.logger?.debug('Localization AI translation worker completed', {
      taskId: this.record.id,
      workerIndex,
      translated: getTranslated(),
      total,
    });
  }

  private async translateText(options: {
    text: string;
    module?: string;
    englishReference?: string;
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
      englishReference,
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
    const sourceText = englishReference || text;
    const sourceLang = englishReference ? 'English' : 'auto';
    const targetLang = this.getLanguageName(locale);
    const context = this.buildProviderContext({
      sourceText,
      targetLang,
      referenceSourceTerm: sourceText,
      referenceTargetTerm: referenceTranslation,
    });
    const invokeStart = Date.now();
    this.logger?.debug('Localization AI translation invoke started', {
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
      hasEnglishReference: Boolean(englishReference),
      hasReferenceTranslation: Boolean(referenceTranslation),
      referenceLocale,
      isBuiltIn,
    });
    const result = await provider.invoke(context, {
      modelRequestParams: {
        sourceText,
        sourceLang,
        targetLang,
        terms: this.buildTranslationTerms({
          sourceTerm: sourceText,
          targetTerm: referenceTranslation,
          targetLang,
        }),
      },
    });
    const invokeElapsedMs = elapsed(invokeStart);

    this.logger?.debug('Localization AI translation invoke completed', {
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
      hasEnglishReference: Boolean(englishReference),
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
    this.logger?.debug('Localization AI translation result extracted', {
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
      hasEnglishReference: Boolean(englishReference),
      hasReferenceTranslation: Boolean(referenceTranslation),
      referenceLocale,
      isBuiltIn,
      sourceText: truncateForLog(sourceText),
      referenceTranslation: referenceTranslation ? truncateForLog(referenceTranslation) : undefined,
      translation: truncateForLog(translation),
    });
    return translation;
  }

  private buildProviderContext(options: {
    sourceText: string;
    targetLang: string;
    referenceSourceTerm?: string;
    referenceTargetTerm?: string;
  }) {
    const { sourceText, targetLang, referenceSourceTerm, referenceTargetTerm } = options;
    const reference =
      referenceSourceTerm && referenceTargetTerm
        ? `Refer to the following translation:
${referenceSourceTerm} is translated as ${referenceTargetTerm}

`
        : '';
    const content = `${reference}Translate the following text into ${targetLang}. Output only the translated result without any additional explanation:

${sourceText}
`;
    return {
      messages: [new HumanMessage(content)] as any,
    };
  }

  private buildTranslationTerms(options: { sourceTerm?: string; targetTerm?: string; targetLang: string }) {
    const { sourceTerm, targetTerm, targetLang } = options;
    if (!sourceTerm || !targetTerm || !['Chinese', 'Traditional Chinese'].includes(targetLang)) {
      return undefined;
    }
    return [
      {
        source: sourceTerm,
        target: targetTerm,
      },
    ];
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
