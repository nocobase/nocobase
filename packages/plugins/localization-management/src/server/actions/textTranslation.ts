import { Context } from '@nocobase/actions';
import { getRepositoryFromCtx } from '../utils';
import { TEXT_NAME_SPACE, TRANSLATION_NAME_SPACE } from '../constant';
import { Sequelize } from 'sequelize';
function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}
export const textTranslationActions = {
  query: async function (ctx: Context, next) {
    const { page = 1, pageSize = 10 } = ctx.action.params;
    const offset = (page - 1) * pageSize;
    const limit = 1 * pageSize;
    const currentLocale = ctx.get('X-Locale');
    const textRepo = getRepositoryFromCtx(ctx, TEXT_NAME_SPACE);
    const translationRepo = getRepositoryFromCtx(ctx, TRANSLATION_NAME_SPACE);

    const { rows, count } = await translationRepo.model.findAndCountAll({
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
      limit,
      offset,
    });
    ctx.body = {
      count,
      rows,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPage: totalPage(count, pageSize),
    };
    await next();
  },
  create: async (ctx: Context, next) => {
    const { values } = ctx.action.params;
    const { text, translation, module } = values;
    const textRepo = getRepositoryFromCtx(ctx, TEXT_NAME_SPACE);
    const translationRepo = getRepositoryFromCtx(ctx, TRANSLATION_NAME_SPACE);
    const currentLocale = ctx.get('X-Locale');
    const res = await textRepo.create({
      values: {
        module,
        text,
      },
    });
    await translationRepo.create({
      values: {
        locale: currentLocale,
        translation,
        textId: res?.id,
      },
    });
    ctx.body = 'ok';
    await next();
  },
  update: async (ctx: Context, next) => {
    const { values } = ctx.action.params;
    const { id, translation } = values;
    const translationRepo = getRepositoryFromCtx(ctx, TRANSLATION_NAME_SPACE);

    const record = translationRepo.findOne({
      filter: {
        id,
      },
    });

    if (record) {
      translationRepo.update({
        filterByTk: id,
        values: {
          translation,
        },
      });
    }
    ctx.body = 'ok';
    await next();
  },
};
