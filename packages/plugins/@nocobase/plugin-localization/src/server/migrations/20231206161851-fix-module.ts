/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Op } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { NAMESPACE_COLLECTIONS, NAMESPACE_PREFIX } from '../constants';
import { getTextsFromDBRecord } from '../utils';
const NAMESPACE_MENUS = `${NAMESPACE_PREFIX}menus`;

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

export const getSchemaUid = async (db: Database, migrate = false) => {
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
  const repo = db.getRepository('uiSchemas') as any;
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

export default class FixModuleMigration extends Migration {
  appVersion = '<0.17.0-alpha.3';
  async up() {
    const result = await this.app.version.satisfies('<=0.17.0-alpha.4');

    if (!result) {
      return;
    }

    const resources = await this.app.localeManager.getCacheResources('zh-CN');
    const menus = await getTextsFromMenu(this.context.db, true);
    const collections = await getTextsFromDB(this.context.db);

    const db = this.context.db;
    await db.getCollection('localizationTexts').sync();
    await db.sequelize.transaction(async (t) => {
      const menuTexts = Object.keys(menus);
      await db.getModel('localizationTexts').update(
        {
          module: `resources.${NAMESPACE_MENUS}`,
        },
        {
          where: {
            text: {
              [Op.in]: menuTexts,
            },
          },
          transaction: t,
        },
      );

      const collectionTexts = Object.keys(collections);
      await db.getModel('localizationTexts').update(
        {
          module: `resources.${NAMESPACE_COLLECTIONS}`,
        },
        {
          where: {
            text: {
              [Op.in]: collectionTexts,
            },
          },
          transaction: t,
        },
      );

      for (const [module, resource] of Object.entries(resources)) {
        if (module === 'client') {
          continue;
        }
        const texts = Object.keys(resource);
        await db.getModel('localizationTexts').update(
          {
            module: `resources.${module}`,
          },
          {
            where: {
              text: {
                [Op.in]: texts,
              },
            },
            transaction: t,
          },
        );
      }
    });
  }

  async down() {}
}
