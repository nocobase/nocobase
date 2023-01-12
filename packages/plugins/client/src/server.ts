import { Plugin, PluginManager } from '@nocobase/server';
import send from 'koa-send';
import serve from 'koa-static';
import isEmpty from 'lodash/isEmpty';
import { isAbsolute, resolve } from 'path';

const getAntdLocale = (lang) => {
  try {
    require.resolve(`antd/lib/locale/${lang}`);
    return require(`antd/lib/locale/${lang}`).default;
  } catch (error) {
    if (lang.replace('-', '_') !== lang) {
      return getAntdLocale(lang.replace('-', '_'));
    }
  }
};

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
    this.app.acl.allow('plugins', 'getPinned', 'loggedIn');
    const dialect = this.app.db.sequelize.getDialect();
    let antd = {};
    let allResources = {};
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
          };
          await next();
        },
        async getLang(ctx, next) {
          const arr2obj = (items: any[]) => {
            const obj = {};
            for (const item of items) {
              Object.assign(obj, item);
            }
            return obj;
          };
          const getResource = (packageName: string, lang: string) => {
            let resources = [];
            const prefixes = ['src', 'lib'];
            const localeKeys = ['locale', 'client/locale', 'server/locale'];
            for (const prefix of prefixes) {
              for (const localeKey of localeKeys) {
                try {
                  const file = `${packageName}/${prefix}/${localeKey}/${lang}`;
                  require.resolve(file);
                  const resource = require(file).default;
                  resources.push(resource);
                } catch (error) {}
              }
              if (resources.length) {
                break;
              }
            }
            if (resources.length === 0 && lang.replace('-', '_') !== lang) {
              return getResource(packageName, lang.replace('-', '_'));
            }
            return arr2obj(resources);
          };
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
          if (isEmpty(allResources[lang])) {
            allResources[lang] = {};
            const plugins = await ctx.db.getRepository('applicationPlugins').find({
              filter: {
                enabled: true,
              },
            });
            for (const plugin of plugins) {
              allResources[lang][plugin.get('name')] = getResource(
                PluginManager.getPackageName(plugin.get('name')),
                lang,
              );
            }
            allResources[lang]['client'] = getResource('@nocobase/client', lang);
          }
          if (isEmpty(antd[lang])) {
            antd[lang] = getAntdLocale(lang);
          }
          ctx.body = {
            lang,
            antd: antd[lang],
            resources: allResources[lang],
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
