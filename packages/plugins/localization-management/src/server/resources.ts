import { Cache, createCache } from '@nocobase/cache';
import { Database } from '@nocobase/database';

export default class Resources {
  cache: Cache;
  db: Database;
  CACHE_KEY_PREFIX = 'localization:';

  constructor(db: Database) {
    this.cache = createCache();
    this.db = db;
  }

  async getTexts() {
    return await this.cache.wrap(`${this.CACHE_KEY_PREFIX}texts`, async () => {
      return await this.db.getRepository('localizationTexts').find({
        fields: ['id', 'module', 'text'],
        raw: true,
      });
    });
  }

  async getTranslations(locale: string) {
    return await this.cache.wrap(`${this.CACHE_KEY_PREFIX}translations:${locale}`, async () => {
      return await this.db.getRepository('localizationTranslations').find({
        fields: ['textId', 'translation'],
        filter: { locale },
        raw: true,
      });
    });
  }

  async getResources(locale: string) {
    const [texts, translations] = await Promise.all([this.getTexts(), this.getTranslations(locale)]);
    const resources = {};
    const textsMap = texts.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
    translations.forEach((item) => {
      const text = textsMap[item.textId];
      if (!text) {
        return;
      }
      const module = text.module;
      if (!resources[module]) {
        resources[module] = {};
      }
      resources[module][text.text] = item.translation;
    });
    return resources;
  }

  async filterExists(texts: (string | { text: string })[]) {
    let existTexts = await this.getTexts();
    existTexts = existTexts.map((item) => item.text);
    return texts.filter((text) => {
      if (typeof text === 'string') {
        return !existTexts.includes(text);
      }
      return !existTexts.includes(text.text);
    });
  }

  async updateCacheTexts(texts: any[]) {
    const newTexts = texts.map((text) => ({
      id: text.id,
      module: text.module,
      text: text.text,
    }));
    const existTexts = await this.getTexts();
    await this.cache.set(`${this.CACHE_KEY_PREFIX}texts`, [...existTexts, ...newTexts]);
  }

  async resetCache(locale: string) {
    await this.cache.del(`${this.CACHE_KEY_PREFIX}translations:${locale}`);
  }
}
