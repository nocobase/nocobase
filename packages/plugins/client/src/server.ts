import { Plugin, PluginManager } from '@nocobase/server';
import fs from 'fs';
import send from 'koa-send';
import serve from 'koa-static';
import isEmpty from 'lodash/isEmpty';
import { isAbsolute, resolve } from 'path';
import { getAntdLocale } from './antd';
import { getCronLocale } from './cron';
import { getCronstrueLocale } from './cronstrue';
import { getMomentLocale } from './moment-locale';
import { getResourceLocale } from './resource';

async function getReadMe(name: string, locale: string) {
  const packageName = PluginManager.getPackageName(name);
  const dir = resolve(process.cwd(), 'node_modules', packageName);
  let file = resolve(dir, `README.${locale}.md`);
  if (fs.existsSync(file)) {
    return (await fs.promises.readFile(file)).toString();
  }
  file = resolve(dir, `README.md`);
  return (await fs.promises.readFile(file)).toString();
}

async function getLang(ctx) {
  const SystemSetting = ctx.db.getRepository('systemSettings');
  const systemSetting = await SystemSetting.findOne();
  const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
  const currentUser = ctx.state.currentUser;
  let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
  if (enabledLanguages.includes(currentUser?.appLang)) {
    lang = currentUser?.appLang;
  }
  if (ctx.request.query.locale) {
    lang = ctx.request.query.locale;
  }
  return lang;
}

export class ClientPlugin extends Plugin {
  async beforeLoad() {
    // const cmd = this.app.findCommand('install');
    // if (cmd) {
    //   cmd.option('--import-demo');
    // }
    this.app.on('afterInstall', async (app, options) => {
      const [opts] = options?.cliArgs || [{}];
      if (opts?.importDemo) {
        //
      }
    });
  }

  async load() {
    this.app.acl.allow('app', 'getLang');
    this.app.acl.allow('app', 'getInfo');
    this.app.acl.allow('app', 'getPlugins');
    this.app.acl.allow('plugins', '*', 'public');
    const dialect = this.app.db.sequelize.getDialect();
    const locales = require('./locale').default;
    this.app.resource({
      name: 'app',
      actions: {
        async getInfo(ctx, next) {
          const SystemSetting = ctx.db.getRepository('systemSettings');
          const systemSetting = await SystemSetting.findOne();
          const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
          const currentUser = ctx.state.currentUser;
          let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
          if (enabledLanguages.includes(currentUser?.appLang)) {
            lang = currentUser?.appLang;
          }
          ctx.body = {
            database: {
              dialect,
            },
            version: await ctx.app.version.get(),
            lang,
            theme: currentUser?.systemSettings?.theme || systemSetting?.options?.theme || 'default',
          };
          await next();
        },
        async getLang(ctx, next) {
          const lang = await getLang(ctx);
          if (isEmpty(locales[lang])) {
            locales[lang] = {};
          }
          if (isEmpty(locales[lang].resources)) {
            locales[lang].resources = await getResourceLocale(lang, ctx.db);
          }
          if (isEmpty(locales[lang].antd)) {
            locales[lang].antd = getAntdLocale(lang);
          }
          if (isEmpty(locales[lang].cronstrue)) {
            locales[lang].cronstrue = getCronstrueLocale(lang);
          }
          if (isEmpty(locales[lang].cron)) {
            locales[lang].cron = getCronLocale(lang);
          }
          ctx.body = {
            lang,
            moment: getMomentLocale(lang),
            ...locales[lang],
          };
          await next();
        },
        async getPlugins(ctx, next) {
          const pm = ctx.db.getRepository('applicationPlugins');
          const items = await pm.find({
            filter: {
              enabled: true,
            },
          });
          ctx.body = items
            .filter((item) => {
              try {
                const packageName = PluginManager.getPackageName(item.name);
                require.resolve(`${packageName}/client`);
                return true;
              } catch (error) {}
              return false;
            })
            .map((item) => item.name);
          await next();
        },
      },
    });
    this.app.resource({
      name: 'plugins',
      actions: {
        // TODO: 临时
        async getPinned(ctx, next) {
          ctx.body = [
            { component: 'CollectionManagerShortcut' },
            { component: 'ACLShortcut' },
            { component: 'WorkflowShortcut' },
            { component: 'SchemaTemplateShortcut' },
            { component: 'SystemSettingsShortcut' },
            { component: 'FileStorageShortcut' },
          ];
          await next();
        },
        async getInfo(ctx, next) {
          const lang = await getLang(ctx);
          const { filterByTk } = ctx.action.params;
          ctx.body = {
            filterByTk,
            readMe: await getReadMe(filterByTk, lang),
          };
          await next();
        },
      },
    });
    let root = this.options.dist || `./packages/app/client/dist`;
    if (!isAbsolute(root)) {
      root = resolve(process.cwd(), root);
    }
    if (process.env.APP_ENV !== 'production' && root) {
      this.app.use(
        async (ctx, next) => {
          if (ctx.path.startsWith(this.app.resourcer.options.prefix)) {
            return next();
          }
          await serve(root)(ctx, next);
          // console.log('koa-send', root, ctx.status);
          if (ctx.status == 404) {
            return send(ctx, 'index.html', { root });
          }
        },
        { tag: 'clientStatic', before: 'cors' },
      );
    }
  }
}

export default ClientPlugin;
