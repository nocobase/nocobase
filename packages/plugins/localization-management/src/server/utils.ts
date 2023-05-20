import { Context } from '@nocobase/actions';
import { TEXTS_ALIAS, TRANSLATION_ALIAS } from './constant';
import { Sequelize } from 'sequelize';

export const getRepositoryFromCtx = (ctx: Context, nameSpace = '') => {
  return ctx.db.getCollection(nameSpace).repository;
};

export const getLangFromLocalizationManagementPlugin = async (ctx) => {
  const currentLocale = ctx.get('X-Locale');
  const textRepo = getRepositoryFromCtx(ctx, TEXTS_ALIAS);
  const translationRepo = getRepositoryFromCtx(ctx, TRANSLATION_ALIAS);

  const rows = await translationRepo.model.findAll({
    where: {
      locale: currentLocale,
    },

    attributes: [
      'id',
      'locale',
      'translation',
      [Sequelize.col('texts.module'), 'module'],
      [Sequelize.col('texts.text'), 'text'],
    ],
    include: [
      {
        model: textRepo.model,
        as: 'texts',
        required: true,
      },
    ],
  });

  const tempObj = {
    resources: {},
    antd: {},
    cronsture: {},
    moment: {},
    cron: {},
  };

  rows.forEach((row) => {
    const { texts, translation } = row;
    const text = texts.text;
    const module = texts.module || 'resources.client';
    const tempSplit = module.split('.');
    let key: string;
    if (tempSplit.length == 1) {
      key = tempSplit[0];
      if (key in tempObj) {
        tempObj[key][text] = translation;
      } else {
        tempObj[key] = {
          [text]: translation,
        };
      }
    } else {
      key = tempSplit[1];
      if (key in tempObj.resources) {
        tempObj.resources[key][text] = translation;
      } else {
        tempObj.resources[key] = {
          [text]: translation,
        };
      }
    }
  });
  return tempObj;
};
