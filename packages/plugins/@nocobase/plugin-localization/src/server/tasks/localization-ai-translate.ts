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
import {
  buildFindTextsOptions,
  getModuleName,
  isBuiltInText,
  normalizeModuleName,
  normalizeTextRecord,
} from '../translation-scope';
import type { LocalizationTextRecord, TranslationScope } from '../translation-scope';

export const LOCALIZATION_AI_TRANSLATE_TASK_TYPE = 'localization:ai-translate';
const DEFAULT_TRANSLATION_WORKER_COUNT = 10;
const MIN_TRANSLATION_WORKER_COUNT = 1;
const MAX_TRANSLATION_WORKER_COUNT = 20;
const TRANSLATION_CHUNK_SIZE = 200;

const elapsed = (start: number) => Date.now() - start;
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

export const pickBuiltInResourceReference = (
  row: LocalizationTextRecord,
  references: Map<string, Map<string, string>>,
  locales: ReferenceLocaleConfig,
) => {
  for (const locale of [locales.primary, locales.fallback].filter(isString)) {
    const translation = references.get(locale)?.get(String(row.id));
    if (translation) {
      return { locale, translation };
    }
  }
  return {};
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

type TranslationItem = {
  row: LocalizationTextRecord;
  chunkIndex: number;
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
  scope?: TranslationScope;
  referenceLocales?: TranslationReferenceLocales;
};

type TranslationSourceItem = {
  row: LocalizationTextRecord;
  isBuiltIn: boolean;
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
    const chunkSize = TRANSLATION_CHUNK_SIZE;
    const countStart = Date.now();
    const total = await this.countTexts(findTextsOptions);
    this.logger?.debug('Localization AI translation task started', {
      taskId: this.record.id,
      mode: params.mode,
      locale,
      total,
      countElapsedMs: elapsed(countStart),
      workerCount,
      chunkSize,
      defaultReferenceLocale,
      referenceLocales,
      scope: params.scope || 'all',
      provider: service?.provider,
      llmService: service?.name,
      model,
    });
    let translated = 0;
    let chunkIndex = 0;

    this.reportProgress({ total, current: 0 });

    const repository = this.app.db.getRepository('localizationTexts');
    const chunk =
      params.mode === 'selected' ? repository.chunk.bind(repository) : repository.chunkWithCursor.bind(repository);
    await chunk({
      ...findTextsOptions,
      chunkSize,
      callback: async (rows) => {
        chunkIndex += 1;
        const chunkStart = Date.now();
        const textRows = rows.map((row) => normalizeTextRecord(row)).filter(Boolean);
        const rowsWithScope = textRows.map((row) => ({
          row,
          isBuiltIn: isBuiltInText(row, builtInMatchResources),
        }));

        this.logger?.debug('Localization AI translation chunk loaded', {
          taskId: this.record.id,
          chunkIndex,
          rows: textRows.length,
          workerCount,
          translated,
          total,
        });

        for (let start = 0; start < rowsWithScope.length; start += workerCount) {
          if (this.isCanceled) {
            throw new CancelError();
          }
          const batchStart = Date.now();
          const batch = rowsWithScope.slice(start, start + workerCount);
          const items = await this.buildTranslationItems(batch, referenceLocales, chunkIndex);
          await Promise.all(
            items.map((item, index) =>
              this.translateItem({
                workerIndex: index + 1,
                item,
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
            ),
          );
          this.logger?.debug('Localization AI translation batch completed', {
            taskId: this.record.id,
            chunkIndex,
            batchSize: items.length,
            referenceTranslations: items.filter((item) => item.referenceTranslation).length,
            elapsedMs: elapsed(batchStart),
            translated,
            total,
          });
        }

        this.logger?.debug('Localization AI translation chunk completed', {
          taskId: this.record.id,
          chunkIndex,
          rows: textRows.length,
          elapsedMs: elapsed(chunkStart),
          translated,
          total,
        });
      },
    });

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

  private async getLocaleReferences(textIds: Array<string | number>, locale: string) {
    const references = new Map<string, string>();
    if (!textIds.length) {
      return references;
    }
    const rows = await this.app.db.getRepository('localizationTranslations').find({
      fields: ['textId', 'translation'],
      filter: {
        textId: {
          $in: textIds,
        },
        locale,
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

  private async getReferenceMaps(textIds: Array<string | number>, locales: string[]) {
    const result = new Map<string, Map<string, string>>();
    await Promise.all(
      Array.from(new Set(locales)).map(async (locale) => {
        result.set(locale, await this.getLocaleReferences(textIds, locale));
      }),
    );
    return result;
  }

  private async getBuiltInReferenceMaps(rows: LocalizationTextRecord[], locales: string[]) {
    const result = new Map<string, Map<string, string>>();
    if (!rows.length) {
      return result;
    }
    await Promise.all(
      Array.from(new Set(locales)).map(async (locale) => {
        const resources = await this.app.localeManager.getCacheResources(locale);
        const references = new Map<string, string>();
        for (const row of rows) {
          const moduleName = getModuleName(row);
          if (!moduleName) {
            continue;
          }
          const modules = Array.from(new Set([normalizeModuleName(moduleName), moduleName]));
          for (const module of modules) {
            const translation = resources?.[module]?.[row.text];
            if (translation) {
              references.set(String(row.id), translation);
              break;
            }
          }
        }
        result.set(locale, references);
      }),
    );
    return result;
  }

  private pickDbReference(
    row: LocalizationTextRecord,
    references: Map<string, Map<string, string>>,
    locales: ReferenceLocaleConfig,
  ) {
    for (const locale of [locales.primary, locales.fallback].filter(isString)) {
      const translation = references.get(locale)?.get(String(row.id));
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

  private async buildTranslationItems(
    batch: TranslationSourceItem[],
    referenceLocales: Required<TranslationReferenceLocales>,
    chunkIndex: number,
  ) {
    const builtInRows = batch.filter((item) => item.isBuiltIn).map((item) => item.row);
    const customTextIds = batch.filter((item) => !item.isBuiltIn).map((item) => item.row.id);
    const builtInReferences = await this.getBuiltInReferenceMaps(
      builtInRows,
      [referenceLocales.builtIn.primary, referenceLocales.builtIn.fallback].filter(isString),
    );
    const customReferences = await this.getReferenceMaps(
      customTextIds,
      [referenceLocales.custom.primary, referenceLocales.custom.fallback].filter(isString),
    );

    return batch.map(({ row, isBuiltIn }) => {
      const references = isBuiltIn ? referenceLocales.builtIn : referenceLocales.custom;
      const reference = isBuiltIn
        ? pickBuiltInResourceReference(row, builtInReferences, references)
        : this.pickDbReference(row, customReferences, references);
      return {
        row,
        chunkIndex,
        referenceTranslation: reference.translation,
        referenceLocale: reference.locale,
        isBuiltIn,
      };
    });
  }

  private async translateItem(options: {
    workerIndex: number;
    item: TranslationItem;
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
      item,
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

    if (this.isCanceled) {
      throw new CancelError();
    }

    const { row, chunkIndex, referenceTranslation, referenceLocale, isBuiltIn } = item;
    try {
      const textStart = Date.now();
      this.logger?.trace?.('Localization AI translation text started', {
        taskId: this.record.id,
        workerIndex,
        chunkIndex,
        textId: row.id,
        textLength: row.text?.length ?? 0,
        hasReferenceTranslation: Boolean(referenceTranslation),
        referenceLocale,
        isBuiltIn,
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
      throw new LocalizationAITranslationError(`Failed to translate localization text ${row.id}: ${message}`, details);
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
