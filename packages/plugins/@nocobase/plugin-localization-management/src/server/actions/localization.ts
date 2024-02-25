import { Context, Next } from '@nocobase/actions';
import { Database, Model, Op } from '@nocobase/database';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { NAMESPACE_COLLECTIONS, NAMESPACE_MENUS } from '../constans';
import LocalizationManagementPlugin from '../plugin';
import { getTextsFromDBRecord, getTextsFromUISchema } from '../utils';

const getResourcesInstance = async (ctx: Context) => {
  const plugin = ctx.app.getPlugin('localization-management') as LocalizationManagementPlugin;
  return plugin.resources;
};

export const getResources = async (ctx: Context) => {
  const resources = await ctx.app.localeManager.getCacheResources(ctx.get('X-Locale') || 'en-US');
  return { ...resources };
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

const getTextsFromUISchemas = async (db: Database) => {
  const result = {};
  const schemas = await getUISchemas(db);
  schemas.forEach((schema: Model) => {
    const texts = getTextsFromUISchema(schema.schema);
    texts.forEach((text) => (result[text] = ''));
  });
  return result;
};

export const getTextsFromDB = async (db: Database) => {
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

const getSchemaUid = async (db: Database, migrate = false) => {
  if (migrate) {
    const systemSettings = await db.getRepository('systemSettings').findOne();
    const options = systemSettings?.options || {};
    const { adminSchemaUid, mobileSchemaUid } = options;
    return { adminSchemaUid, mobileSchemaUid };
  }
  return { adminSchemaUid: 'nocobase-admin-menu', mobileSchemaUid: 'nocobase-mobile-container' };
};

export const getTextsFromMenu = async (db: Database, migrate = false) => {
  const result = {};
  const { adminSchemaUid, mobileSchemaUid } = await getSchemaUid(db, migrate);
  const repo = db.getRepository('uiSchemas') as UiSchemaRepository;
  if (adminSchemaUid) {
    const schema = await repo.getProperties(adminSchemaUid);
    const extractTitle = (schema: any) => {
      if (schema?.properties) {
        Object.values(schema.properties).forEach((item: any) => {
          if (item.title) {
            result[item.title] = '';
          }
          extractTitle(item);
        });
      }
    };
    extractTitle(schema);
  }
  if (mobileSchemaUid) {
    const schema = await repo.getProperties(mobileSchemaUid);
    if (schema?.['properties']?.tabBar?.properties) {
      Object.values(schema['properties']?.tabBar?.properties).forEach((item: any) => {
        const title = item['x-component-props']?.title;
        if (title) {
          result[title] = '';
        }
      });
    }
  }
  return result;
};

const sync = async (ctx: Context, next: Next) => {
  const startTime = Date.now();
  ctx.logger.info('Start sync localization resources');
  const resourcesInstance = await getResourcesInstance(ctx);
  const locale = ctx.get('X-Locale') || 'en-US';
  const { type = [] } = ctx.action.params.values || {};
  if (!type.length) {
    ctx.throw(400, ctx.t('Please provide synchronization source.'));
  }

  let resources: { [module: string]: any } = { client: {} };
  if (type.includes('local')) {
    resources = await getResources(ctx);
  }
  if (type.includes('menu')) {
    const menuTexts = await getTextsFromMenu(ctx.db);
    resources[NAMESPACE_MENUS] = {
      ...menuTexts,
    };
  }
  if (type.includes('db')) {
    const dbTexts = await getTextsFromDB(ctx.db);
    resources[NAMESPACE_COLLECTIONS] = {
      ...dbTexts,
    };
  }

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
  const resources = await getResourcesInstance(ctx);
  ctx.body = await resources.resetCache(ctx.get('X-Locale') || 'en-US');
  await next();
};

export default { publish, sync };
