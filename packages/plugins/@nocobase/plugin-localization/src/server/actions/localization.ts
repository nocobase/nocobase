/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Model, Op } from '@nocobase/database';
import { PluginLocalizationServer } from '../plugin';

type LocalizationPackEntry = {
  module: string;
  text: string;
  translation?: string;
  referenceTranslation?: string;
};

type NormalizedLocalizationPackEntry = {
  module: string;
  text: string;
  translation: string;
};

type ImportMode = 'createOnly' | 'upsert' | 'overwrite';

const normalizeModule = (module: string) => {
  if (!module) {
    return module;
  }
  return module.startsWith('resources.') ? module : `resources.${module}`;
};

const getActionValues = (ctx: Context) => ctx.action.params.values || ctx.request.body || {};

const parseBoolean = (value: any) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return Boolean(value);
};

const getTranslationByLocale = (text: Model, locale: string) => {
  const translations = text.get('translations') || text['translations'] || [];
  return translations.find((translation) => {
    return (translation?.get('locale') ?? translation?.locale) === locale;
  });
};

const getTextKey = (module: string, text: string) => `${module}\0${text}`;

const createSummary = () => ({
  total: 0,
  createdTexts: 0,
  createdTranslations: 0,
  updatedTranslations: 0,
  skipped: 0,
  invalid: 0,
});

const sync = async (ctx: Context, next: Next) => {
  const startTime = Date.now();
  ctx.logger.info('Start sync localization resources');
  const plugin = ctx.app.pm.get('localization') as PluginLocalizationServer;
  const resourcesInstance = plugin.resources;
  const locale = ctx.get('X-Locale') || 'en-US';
  const { types = [] } = ctx.action.params.values || {};
  if (!types.length) {
    ctx.throw(400, ctx.t('Please provide synchronization source.'));
  }

  const resources = await plugin.sourceManager.sync(ctx, types);
  let textValues = [];
  Object.entries(resources).forEach(([module, resource]) => {
    Object.keys(resource).forEach((text) => {
      textValues.push({ module: `resources.${module}`, text });
    });
  });
  textValues = (await resourcesInstance.filterExists(textValues)) as any[];
  await ctx.db.sequelize.transaction(async (t) => {
    const newTexts = await ctx.db.getModel('localizationTexts').bulkCreate(textValues, {
      transaction: t,
    });
    const texts = await ctx.db.getModel('localizationTexts').findAll({
      include: [{ association: 'translations', where: { locale }, required: false }],
      where: { '$translations.id$': null },
      transaction: t,
    });
    const translationValues = texts
      .filter((text: Model) => {
        const module = text.module.replace('resources.', '');
        return resources[module]?.[text.text];
      })
      .map((text: Model) => {
        const module = text.module.replace('resources.', '');
        return {
          locale,
          textId: text.id,
          translation: resources[module]?.[text.text],
        };
      });

    await ctx.db.getModel('localizationTranslations').bulkCreate(translationValues, {
      transaction: t,
    });
    await resourcesInstance.updateCacheTexts(newTexts);
  });
  ctx.logger.info(`Sync localization resources done, ${Date.now() - startTime}ms`);
  await next();
};

const publish = async (ctx: Context, next: Next) => {
  ctx.app.localeManager.reload();
  await next();
};

const getSources = async (ctx: Context, next: Next) => {
  const plugin = ctx.app.pm.get('localization') as PluginLocalizationServer;
  const sources = Array.from(plugin.sourceManager.sources.getEntities());
  ctx.body = sources.map(([name, source]) => ({
    name,
    title: source.title,
  }));
  await next();
};

const exportPack = async (ctx: Context, next: Next) => {
  const values = getActionValues(ctx);
  const locale = values.locale || ctx.get('X-Locale') || 'en-US';
  const referenceLocale = values.referenceLocale || 'en-US';
  const modules = Array.isArray(values.modules) ? values.modules.map(normalizeModule).filter(Boolean) : [];
  const hasTranslation = parseBoolean(values.hasTranslation);

  const where: any = {};
  if (modules.length) {
    where.module = { [Op.in]: modules };
  }

  const texts = await ctx.db.getModel('localizationTexts').findAll({
    include: [
      {
        association: 'translations',
        where: {
          locale: referenceLocale === locale ? locale : { [Op.in]: [locale, referenceLocale] },
        },
        required: false,
      },
    ],
    where,
    order: [
      ['module', 'ASC'],
      ['text', 'ASC'],
    ],
  });

  const entries: LocalizationPackEntry[] = [];
  for (const text of texts) {
    const translation = getTranslationByLocale(text, locale);
    const translationValue = translation?.get('translation') ?? translation?.translation;
    const translated = translationValue !== undefined && translationValue !== null && translationValue !== '';
    const untranslated = translationValue === undefined || translationValue === null || translationValue === '';

    if (hasTranslation === true && !translated) {
      continue;
    }
    if (hasTranslation === false && !untranslated) {
      continue;
    }

    const entry: LocalizationPackEntry = {
      module: text.get('module') as string,
      text: text.get('text') as string,
      translation: translationValue ?? '',
    };
    const referenceTranslation = getTranslationByLocale(text, referenceLocale);
    const referenceTranslationValue = referenceTranslation?.get('translation') ?? referenceTranslation?.translation;
    if (referenceTranslationValue !== undefined && referenceTranslationValue !== null) {
      entry.referenceTranslation = referenceTranslationValue;
    }
    entries.push(entry);
  }

  ctx.body = {
    locale,
    referenceLocale,
    entries,
  };
  await next();
};

const importPack = async (ctx: Context, next: Next) => {
  const values = getActionValues(ctx);
  const locale = values.locale || ctx.get('X-Locale') || 'en-US';
  const mode = (values.mode || 'createOnly') as ImportMode;
  const dryRun = parseBoolean(values.dryRun) === true;
  const shouldPublish = parseBoolean(values.publish) === true;
  const createTexts = parseBoolean(values.createTexts) !== false;
  const entries = Array.isArray(values.entries) ? values.entries : [];
  const summary = createSummary();
  const errors = [];

  if (!['createOnly', 'upsert', 'overwrite'].includes(mode)) {
    ctx.throw(400, ctx.t('Invalid import mode.'));
  }
  if (!entries.length) {
    ctx.throw(400, ctx.t('Please provide localization entries.'));
  }

  summary.total = entries.length;
  const normalizedEntries: NormalizedLocalizationPackEntry[] = [];
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    const module = normalizeModule(entry?.module);
    const text = entry?.text;
    const translation = entry?.translation;

    if (!module || typeof text !== 'string' || translation === undefined || translation === null) {
      summary.invalid += 1;
      errors.push({ index, message: 'Invalid localization entry.' });
      return;
    }

    const key = getTextKey(module, text);
    if (seen.has(key)) {
      summary.skipped += 1;
      errors.push({ index, module, text, message: 'Duplicate localization entry.' });
      return;
    }
    seen.add(key);

    if (mode !== 'overwrite' && translation === '') {
      summary.skipped += 1;
      return;
    }

    normalizedEntries.push({
      module,
      text,
      translation: String(translation),
    });
  });

  const applyImport = async (transaction?: any) => {
    const modules = [...new Set(normalizedEntries.map((entry) => entry.module))];
    const entryTexts = [...new Set(normalizedEntries.map((entry) => entry.text))];
    const texts = modules.length
      ? await ctx.db.getModel('localizationTexts').findAll({
          where: {
            module: { [Op.in]: modules },
            text: { [Op.in]: entryTexts },
          },
          transaction,
        })
      : [];
    const textsMap = new Map<string, Model>();
    texts.forEach((text: Model) =>
      textsMap.set(getTextKey(text.get('module') as string, text.get('text') as string), text),
    );

    const textIds = texts.map((text: Model) => text.get('id'));
    const translations = textIds.length
      ? await ctx.db.getModel('localizationTranslations').findAll({
          where: {
            locale,
            textId: { [Op.in]: textIds },
          },
          transaction,
        })
      : [];
    const translationsMap = new Map<any, Model>();
    translations.forEach((translation: Model) => translationsMap.set(translation.get('textId'), translation));

    const newTexts: Model[] = [];
    for (const entry of normalizedEntries) {
      const key = getTextKey(entry.module, entry.text);
      let text = textsMap.get(key);

      if (!text) {
        if (!createTexts) {
          summary.skipped += 1;
          continue;
        }
        summary.createdTexts += 1;
        if (!dryRun) {
          text = await ctx.db.getModel('localizationTexts').create(
            {
              module: entry.module,
              text: entry.text,
            },
            { transaction },
          );
          textsMap.set(key, text);
          newTexts.push(text);
        }
      }

      const textId = text?.get('id');
      const translation = textId ? translationsMap.get(textId) : undefined;

      if (!translation) {
        summary.createdTranslations += 1;
        if (!dryRun && textId) {
          const newTranslation = await ctx.db.getModel('localizationTranslations').create(
            {
              locale,
              textId,
              translation: entry.translation,
            },
            { transaction },
          );
          translationsMap.set(textId, newTranslation);
        }
        continue;
      }

      if (mode === 'createOnly') {
        summary.skipped += 1;
        continue;
      }

      summary.updatedTranslations += 1;
      if (!dryRun) {
        await translation.update({ translation: entry.translation }, { transaction });
      }
    }

    if (!dryRun && newTexts.length) {
      const plugin = ctx.app.pm.get('localization') as PluginLocalizationServer;
      await plugin.resources.updateCacheTexts(newTexts, transaction);
      plugin.sendSyncMessage(
        {
          type: 'updateCacheTexts',
          texts: newTexts,
        },
        { transaction },
      );
    }
  };

  if (dryRun) {
    await applyImport();
  } else {
    await ctx.db.sequelize.transaction(async (transaction) => {
      await applyImport(transaction);
    });
    if (shouldPublish) {
      ctx.app.localeManager.reload();
    }
  }

  ctx.body = {
    summary,
    errors,
  };
  await next();
};

export default { publish, sync, getSources, export: exportPack, import: importPack };
