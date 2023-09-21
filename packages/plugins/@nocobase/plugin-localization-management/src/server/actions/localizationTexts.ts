import { Context, Next, DEFAULT_PAGE, DEFAULT_PER_PAGE } from '@nocobase/actions';
import { Database, Model, Op } from '@nocobase/database';

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
  const { keyword, hasTranslation, locale, options } = params;
  if (keyword || !hasTranslation) {
    options['include'] = [{ association: 'translations', where: { locale }, required: false }];
    if (!hasTranslation) {
      if (keyword) {
        options['where'] = {
          [Op.and]: [
            { text: { [Op.like]: `%${keyword}%` } },
            {
              '$translations.id$': null,
            },
          ],
        };
      } else {
        options['where'] = {
          '$translations.id$': null,
        };
      }
    } else {
      options['where'] = {
        [Op.or]: [
          { text: { [Op.like]: `%${keyword}%` } },
          { '$translations.translation$': { [Op.like]: `%${keyword}%` } },
        ],
      };
    }
  }
  const [rows, count] = await db.getRepository('localizationTexts').findAndCount(options);
  if (!hasTranslation) {
    return [rows, count];
  }
  return [await appendTranslations(db, rows, locale), count];
};

const list = async (ctx: Context, next: Next) => {
  const locale = ctx.get('X-Locale') || 'en-US';
  let { page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE, hasTranslation } = ctx.action.params;
  page = parseInt(String(page));
  pageSize = parseInt(String(pageSize));
  hasTranslation = hasTranslation === 'true' || hasTranslation === undefined;
  const { keyword } = ctx.action.params;
  const options = {
    context: ctx,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
  const [rows, count] = await listText(ctx.db, { keyword, hasTranslation, locale, options });
  ctx.body = {
    count,
    rows,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
  await next();
};

export default { list };
