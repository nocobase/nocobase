import actions, { Context, Next } from '@nocobase/actions';
import { Model } from '@nocobase/database';

export default {
  all: async (ctx: Context, next: Next) => {
    const repo = ctx.db.getRepository('localizationTexts');
    const records = await repo.find({
      appends: ['translations'],
      filter: {
        'translations.locale': ctx.get('X-Locale') || 'en-US',
      },
    });
    console.log(records);
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
  create: async (ctx: Context, next: Next) => {
    const locale = ctx.get('X-Locale');
    if (!locale) {
      ctx.throw(400, ctx.t('Locale is required'));
    }
    const { module, text, translation } = ctx.action.params.values;
    const repository = ctx.db.getRepository('localizationTexts');
    ctx.body = await repository.create({
      values: {
        module,
        text,
        translations: [
          {
            locale,
            translation,
          },
        ],
      },
    });
    await next();
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
  destroyText: async (ctx: Context, next: Next) => {
    const { id } = ctx.action.params.values;
    const repository = ctx.db.getRepository('localizationTexts');
    ctx.body = await repository.destroy({
      filter: {
        id,
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
};
