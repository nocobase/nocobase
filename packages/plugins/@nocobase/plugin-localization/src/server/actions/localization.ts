/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { PluginLocalizationServer } from '../plugin';

const sync = async (ctx: Context, next: Next) => {
  const startTime = Date.now();
  ctx.logger.info('Start sync localization resources');
  const plugin = ctx.app.pm.get('localization') as PluginLocalizationServer;
  const resourcesInstance = plugin.resources;
  const locale = ctx.get('X-Locale') || 'en-US';
  const { types = [], resetTranslations = false } = ctx.action.params.values || {};
  if (!types.length) {
    ctx.throw(400, ctx.t('Please provide synchronization source.'));
  }

  const resources = await ctx.app.localeManager.syncSources(ctx, types);
  const normalizedResources = {};
  Object.entries(resources).forEach(([module, resource]) => {
    const normalizedModule = plugin.normalizeResourceModule(module).replace('resources.', '');
    normalizedResources[normalizedModule] = {
      ...(normalizedResources[normalizedModule] || {}),
      ...(resource as Record<string, string>),
    };
  });
  let textValues = [];
  Object.entries(normalizedResources).forEach(([module, resource]) => {
    Object.keys(resource).forEach((text) => {
      textValues.push({ module: plugin.normalizeResourceModule(module), text });
    });
  });
  textValues = (await resourcesInstance.filterExists(textValues)) as any[];
  await ctx.db.sequelize.transaction(async (t) => {
    const newTexts = await ctx.db.getModel('localizationTexts').bulkCreate(textValues, {
      transaction: t,
    });
    const texts = await ctx.db.getModel('localizationTexts').findAll({
      include: [{ association: 'translations', where: { locale }, required: false }],
      where: resetTranslations ? undefined : { '$translations.id$': null },
      transaction: t,
    });
    const translationValues = texts
      .filter((text: Model) => {
        const module = plugin.normalizeResourceModule(text.module).replace('resources.', '');
        return normalizedResources[module]?.[text.text];
      })
      .map((text: Model) => {
        const module = plugin.normalizeResourceModule(text.module).replace('resources.', '');
        return {
          locale,
          textId: text.id,
          translation: normalizedResources[module]?.[text.text],
        };
      });

    if (resetTranslations) {
      await ctx.db.getModel('localizationTranslations').bulkCreate(translationValues, {
        updateOnDuplicate: ['translation'],
        transaction: t,
      });
    } else {
      await ctx.db.getModel('localizationTranslations').bulkCreate(translationValues, {
        transaction: t,
      });
    }
    await resourcesInstance.updateCacheTexts(newTexts);
    await resourcesInstance.reset();
  });
  ctx.logger.info(`Sync localization resources done, ${Date.now() - startTime}ms`);
  await next();
};

const publish = async (ctx: Context, next: Next) => {
  ctx.app.localeManager.reload();
  await next();
};

const getSources = async (ctx: Context, next: Next) => {
  const sources = Array.from(ctx.app.localeManager.sources.getEntities());
  ctx.body = sources
    .filter(([, source]) => source.sync)
    .map(([name, source]) => ({
      name,
      title: source.title,
    }));
  await next();
};

export default { publish, sync, getSources };
