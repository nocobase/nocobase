import { Context, Next } from '@nocobase/actions';
import { Database, Model, Op } from '@nocobase/database';
import { getResourceLocale } from '@nocobase/plugin-client';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '../constans';
import LocalizationManagementPlugin from '../plugin';
import { getTextsFromDBRecord, getTextsFromUISchema } from '../utils';

const updateCacheTexts = async (ctx: Context, texts: string[]) => {
  const plugin = ctx.app.getPlugin('localization-management') as LocalizationManagementPlugin;
  await plugin.setCacheTexts(texts);
};

const all = async (ctx: Context, next: Next) => {
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
};

const appendTranslations = async (db: Database, rows: Model[], locale: string): Promise<any[]> => {
  const texts = rows || [];
  const textIds = texts.map((text: any) => text.id);
  const textMp = texts.reduce((memo: any, text: any) => {
    memo[text.id] = text;
    return memo;
  }, {});
  const repo = db.getRepository('localizationTranslations');
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
  return Object.values(textMp);
};

const listText = async (db: Database, params: any): Promise<[any[], number]> => {
  const { searchType, keyword, hasTranslation, locale, options } = params;
  if (searchType === 'text' && keyword) {
    options['where'] = {
      text: {
        [Op.like]: `%${keyword}%`,
      },
    };
  }
  if (!hasTranslation) {
    options['include'] = [
      {
        association: 'translations',
        where: {
          locale,
        },
        required: false,
      },
    ];
    options['where'] = { ...options['where'], '$translations.id$': null };
  }
  const [rows, count] = await db.getRepository('localizationTexts').findAndCount(options);
  if (!hasTranslation) {
    return [rows, count];
  }
  return [await appendTranslations(db, rows, locale), count];
};

const listTextByTranslation = async (db: Database, params: any): Promise<[any[], number]> => {
  const repository = db.getRepository('localizationTranslations');
  const { keyword, locale, options } = params;
  const [rows, count] = await repository.findAndCount({
    ...options,
    filter: {
      translation: {
        $includes: keyword,
      },
      locale,
    },
    appends: ['text'],
  });
  return [
    rows.map((row: Model) => ({
      id: row.textId,
      module: row.text.module,
      text: row.text.text,
      translation: row.translation,
      translationId: row.id,
    })),
    count,
  ];
};

const list = async (ctx: Context, next: Next) => {
  const locale = ctx.get('X-Locale') || 'en-US';
  let { page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE, hasTranslation } = ctx.action.params;
  page = parseInt(String(page));
  pageSize = parseInt(String(pageSize));
  hasTranslation = hasTranslation === 'true' || hasTranslation === undefined;
  const { searchType, keyword } = ctx.action.params;
  const options = {
    context: ctx,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
  let rows: any[];
  let count: number;
  if (searchType === 'translation' && keyword) {
    [rows, count] = await listTextByTranslation(ctx.db, { keyword, locale, options });
  } else {
    [rows, count] = await listText(ctx.db, { searchType, keyword, hasTranslation, locale, options });
  }

  ctx.body = {
    count,
    rows,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
  await next();
};

const update = async (ctx: Context, next: Next) => {
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
};

const destroyTranslation = async (ctx: Context, next: Next) => {
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
};

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
        {
          schema: {
            'x-decorator-props': {
              title: {
                [Op.ne]: null,
              },
            },
          },
        },
        {
          schema: {
            'x-data-templates': {
              [Op.ne]: null,
            },
          },
        },
      ],
    },
  });
  return uiSchemas;
};

export const resourcesToRecords = async (
  ctx: Context,
  locale: string,
  resources: any,
): Promise<{
  records: {
    [key: string]: { module: string; text: string; locale: string; translation: string };
  };
  newTexts: string[];
}> => {
  const plugin = ctx.app.getPlugin('localization-management') as LocalizationManagementPlugin;
  const texts = await plugin.getCacheTexts();
  const newTexts = [];
  const records = {};
  for (const module in resources) {
    const resource = resources[module];
    for (const text in resource) {
      if (texts.includes(text)) {
        continue;
      }
      if (resource[text] || module === 'client') {
        newTexts.push(text);
        records[text] = {
          module,
          text,
          locale,
          translation: resource[text],
        };
      }
    }
  }
  return { records, newTexts };
};

const getTextsFromUISchemas = async (db: Database) => {
  const result = {};
  const schemas = await getUISchemas(db);
  schemas.forEach((schema: Model) => {
    const texts = getTextsFromUISchema(schema.schema);
    texts.forEach((text) => (result[text] = ''));
  });
  return result;
};

const getTextsFromDB = async (db: Database) => {
  const result = {};
  const collections = Array.from(db.collections.values());
  for (const collection of collections) {
    const fields = Array.from(collection.fields.values())
      .filter((field) => field.options?.translation)
      .map((field) => field.name);
    if (!fields.length) {
      continue;
    }
    const repo = db.getRepository(collection.name);
    const records = await repo.find({ fields });
    records.forEach((record) => {
      const texts = getTextsFromDBRecord(fields, record);
      texts.forEach((text) => (result[text] = ''));
    });
  }
  return result;
};

const getAdminSchemaUid = async (db: Database) => {
  const systemSettings = await db.getRepository('systemSettings').findOne();
  const options = systemSettings?.options || {};
  return options.adminSchemaUid;
};

const getTextsFromMenu = async (db: Database) => {
  const result = {};
  const uid = await getAdminSchemaUid(db);
  const repo = db.getRepository('uiSchemas') as UiSchemaRepository;
  const schema = await repo.getProperties(uid);
  const extractTitle = (schema: any) => {
    if (schema.properties) {
      Object.values(schema.properties).forEach((item: any) => {
        if (item.title) {
          result[item.title] = '';
        }
        extractTitle(item);
      });
    }
  };
  extractTitle(schema);
  return result;
};

const sync = async (ctx: Context, next: Next) => {
  const startTime = Date.now();
  ctx.app.logger.info('Start sync localization resources');
  const locale = ctx.get('X-Locale') || 'en-US';
  const { type = [] } = ctx.action.params.values || {};
  if (!type.length) {
    ctx.throw(400, ctx.t('Please provide synchronization source.'));
  }

  let resources: { [module: string]: any } = { client: {} };
  if (type.includes('local')) {
    resources = await getResources(locale, ctx.db);
  }
  if (type.includes('menu')) {
    const menuTexts = await getTextsFromMenu(ctx.db);
    resources['client'] = {
      ...menuTexts,
      ...resources['client'],
    };
  }
  if (type.includes('db')) {
    const dbTexts = await getTextsFromDB(ctx.db);
    resources['client'] = {
      ...dbTexts,
      ...resources['client'],
    };
  }

  const { records, newTexts } = await resourcesToRecords(ctx, locale, resources);
  const textValues = Object.values(records).map((record) => ({
    module: `resources.${record.module}`,
    text: record.text,
  }));
  await ctx.db.sequelize.transaction(async (t) => {
    const texts = await ctx.db.getModel('localizationTexts').bulkCreate(textValues, {
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
      transaction: t,
    });
  });
  await updateCacheTexts(ctx, newTexts);
  ctx.app.logger.info(`Sync localization resources done, ${Date.now() - startTime}ms`);
  await next();
};

export default { all, list, update, destroyTranslation, sync };
