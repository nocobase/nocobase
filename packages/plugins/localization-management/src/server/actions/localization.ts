import { Context, Next } from '@nocobase/actions';
import { Database, Model, Op } from '@nocobase/database';
import { getResourceLocale } from '@nocobase/plugin-client';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import LocalizationManagementPlugin from '../plugin';
import { getTextsFromDBRecord, getTextsFromUISchema } from '../utils';

const getResourcesInstance = async (ctx: Context) => {
  const plugin = ctx.app.getPlugin('localization-management') as LocalizationManagementPlugin;
  return plugin.resources;
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
  locale: string,
  resources: any,
): Promise<{
  [key: string]: { module: string; text: string; locale: string; translation: string };
}> => {
  const records = {};
  for (const module in resources) {
    const resource = resources[module];
    for (const text in resource) {
      if (resource[text] || module === 'client') {
        if (records[text]) {
          // If the text already exists, put it in the client module
          records[text].module = `client`;
          continue;
        }
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
  const resourcesInstance = await getResourcesInstance(ctx);
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

  const records = await resourcesToRecords(locale, resources);
  let textValues = Object.values(records).map((record) => ({
    module: `resources.${record.module}`,
    text: record.text,
  }));
  textValues = (await resourcesInstance.filterExists(textValues)) as any[];
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
    await resourcesInstance.updateCacheTexts(texts);
  });
  ctx.app.logger.info(`Sync localization resources done, ${Date.now() - startTime}ms`);
  await next();
};

const publish = async (ctx: Context, next: Next) => {
  const resources = await getResourcesInstance(ctx);
  ctx.body = await resources.resetCache(ctx.get('X-Locale') || 'en-US');
  await next();
};

export default { publish, sync };
