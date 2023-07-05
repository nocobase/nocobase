import actions, { Context, Next } from '@nocobase/actions';
import { Database, Model, Op } from '@nocobase/database';
import { getResourceLocale } from '@nocobase/plugin-client';

export const getResources = async (locale: string, db: Database) => {
  const resources = await getResourceLocale(locale, db);
  const client = resources['client'];
  // Remove duplicated keys
  Object.keys(resources).forEach((module) => {
    if (module === 'client') {
      return;
    }
    Object.keys(resources[module]).forEach((key) => {
      if (client[key]) {
        resources[module][key] = undefined;
      }
    });
  });
  return resources;
};

export const getUISchemas = async (db: Database) => {
  const uiSchemas = await db.getModel('uiSchemas').findAll({
    attributes: ['schema'],
    where: {
      [Op.or]: [
        {
          schema: {
            title: {
              [Op.ne]: null,
            },
          },
        },
        {
          schema: {
            'x-component-props': {
              title: {
                [Op.ne]: null,
              },
            },
          },
        },
      ],
    },
  });
  return uiSchemas;
};

export const resourcesToRecords = (
  locale: string,
  resources: any,
): {
  [key: string]: { module: string; text: string; locale: string; translation: string };
} => {
  const records = {};
  for (const module in resources) {
    const resource = resources[module];
    for (const text in resource) {
      if (resource[text] || module === 'client') {
        records[text] = {
          module,
          text,
          locale,
          translation: resource[text],
        };
      }
    }
  }
  return records;
};

export default {
  all: async (ctx: Context, next: Next) => {
    const model = ctx.db.getModel('localizationTexts');
    const records = await model.findAll({
      include: [
        {
          association: 'translations',
          where: {
            locale: ctx.get('X-Locale') || 'en-US',
          },
        },
      ],
    });
    ctx.body = records.reduce((modules: any, text: Model) => {
      const module = text.module;
      const record = { [text.text]: text.translations[0]?.translation };
      modules[module] = modules[module] ? { ...modules[module], ...record } : record;
      return modules;
    }, {});
    await next();
  },
  list: async (ctx: Context, next: Next) => {
    ctx.action.resourceName = 'localizationTexts';
    ctx.action.mergeParams({
      resourceName: 'localizationTexts',
    });
    return actions.list(ctx, async () => {
      const locale = ctx.get('X-Locale') || 'en-US';
      const texts = ctx.body.rows || [];
      const textIds = texts.map((text: any) => text.id);
      const textMp = texts.reduce((memo: any, text: any) => {
        memo[text.id] = text;
        return memo;
      }, {});
      const repo = ctx.db.getRepository('localizationTranslations');
      const translations = await repo.find({
        filter: {
          locale,
          textId: textIds,
        },
      });
      translations.forEach((translation: Model) => {
        const text = textMp[translation.textId];
        if (text) {
          text.set('translation', translation.translation, { raw: true });
          text.set('translationId', translation.id, { raw: true });
          textMp[translation.textId] = text;
        }
      });
      ctx.body = {
        ...ctx.body,
        rows: Object.values(textMp),
      };
      await next();
    });
  },
  update: async (ctx: Context, next: Next) => {
    const locale = ctx.get('X-Locale');
    if (!locale) {
      ctx.throw(400, ctx.t('Locale is required'));
    }
    const { id, translation } = ctx.action.params.values;
    const repository = ctx.db.getRepository('localizationTranslations');
    const exist = await repository.findOne({
      filter: {
        locale,
        textId: id,
      },
    });
    if (!exist) {
      ctx.body = await repository.create({
        values: {
          locale,
          textId: id,
          translation,
        },
      });
      return next();
    }
    ctx.body = await repository.update({
      values: {
        translation,
      },
      filter: {
        id: exist.id,
      },
    });
    await next();
  },
  destroyTranslation: async (ctx: Context, next: Next) => {
    const { id } = ctx.action.params.values || {};
    if (!id) {
      ctx.throw(404, ctx.t('Translation is not found'));
    }
    const repository = ctx.db.getRepository('localizationTranslations');
    ctx.body = await repository.destroy({
      filter: {
        id,
      },
    });
    await next();
  },
  sync: async (ctx: Context, next: Next) => {
    const startTime = Date.now();
    ctx.app.logger.info('Start sync localization resources');
    const locale = ctx.get('X-Locale') || 'en-US';
    const resources = await getResources(locale, ctx.db);
    const schemas = await getUISchemas(ctx.db);
    const compile = (title: string) => (title || '').replace(/{{\s*t\("(.*)"\)\s*}}/g, '$1');
    schemas.forEach((schema: Model) => {
      const title = compile(schema.schema.title);
      const componentPropsTitle = compile(schema.schema['x-component-props']?.title);
      if (title && !resources['client'][title]) {
        resources['client'][title] = '';
      }
      if (componentPropsTitle && !resources['client'][componentPropsTitle]) {
        resources['client'][componentPropsTitle] = '';
      }
    });
    const records = resourcesToRecords(locale, resources);
    const batch = Date.now();
    const textValues = Object.values(records).map((record) => ({
      module: `resources.${record.module}`,
      text: record.text,
      batch,
    }));

    await ctx.db.sequelize.transaction(async (t) => {
      await ctx.db.getModel('localizationTexts').bulkCreate(textValues, {
        updateOnDuplicate: ['module', 'batch'],
        transaction: t,
      });
      const texts = await ctx.db.getModel('localizationTexts').findAll({
        attributes: ['id', 'text'],
        where: {
          batch,
        },
        transaction: t,
      });
      const translationValues = texts
        .map((text: Model) => {
          return {
            locale,
            textId: text.id,
            translation: records[text.text].translation,
          };
        })
        .filter((translation) => translation.translation);
      await ctx.db.getModel('localizationTranslations').bulkCreate(translationValues, {
        updateOnDuplicate: ['translation'],
        transaction: t,
      });
    });
    ctx.app.logger.info(`Sync localization resources done, ${Date.now() - startTime}ms`);
    await next();
  },
};
