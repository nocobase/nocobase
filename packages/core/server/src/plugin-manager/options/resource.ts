import { uid } from '@nocobase/utils';
import fg from 'fast-glob';
import fs from 'fs';
import matter from 'gray-matter';
import _ from 'lodash';
import path from 'path';
import Application from '../../application';
import { getExposeUrl } from '../clientStaticUtils';
import PluginManager from '../plugin-manager';
import { locales } from './locales';

function isRelative(src) {
  if (src.startsWith('http') || src.startsWith('/')) {
    return false;
  }
  return true;
}

function urlJoin(...args: string[]) {
  return path.join(...args).replace(path.sep, '/');
}

function replaceImgSrc(data, basePath) {
  return data
    .replace(/!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g, (value, p1, p2, ...args) => {
      const alt = p2 ? ` ${p2}` : '';
      const src = isRelative(p1) ? urlJoin(basePath, p1) : p1;
      return `![](${src}${alt})`;
    })
    .replace(/<img[^>]+src="([^">]+)"/g, function (v, p1) {
      const src = isRelative(p1) ? urlJoin(basePath, p1) : p1;
      return `<img src="${src}"`;
    });
}

async function getContents(ctx: any) {
  const pm = ctx.db.getRepository('applicationPlugins');
  const items = await pm.find();
  const localeSet = new Set();
  const locale = ctx.getCurrentLocale();
  const contents = {
    locale,
    paths: {},
    tags: {},
  };
  const tags2arr = (tags) => {
    if (typeof tags === 'string') {
      return [{ key: tags, label: tags }];
    }
    if (Array.isArray(tags)) {
      return tags.map((tag) => {
        if (typeof tag === 'string') {
          return { key: tags };
        }
        return tag;
      });
    }
    return tags ? [tags] : [];
  };
  for (const item of items) {
    const basePath = path.resolve(path.dirname(require.resolve(`${item.packageName}/package.json`)), 'docs');
    const files = await fg(`**/*.md`, { cwd: basePath });
    for (const file of files) {
      const keys = file.split(path.sep);
      let firstKey = keys.shift();
      let filename = locales.includes(firstKey) ? keys.join('/') : file;
      if (!locales.includes(firstKey)) {
        firstKey = 'en-US';
      }
      filename = filename.replace(/\/?index\.md$/g, '');
      filename = filename.replace(/\.md$/g, '');
      localeSet.add(firstKey);
      // contents[firstKey] = contents[firstKey] || {};
      const str = await fs.promises.readFile(path.resolve(basePath, file), 'utf-8');
      const data = matter(str);
      const m = /(?<=(^#)\s).*/gm.exec(data.content || '');
      const uri = urlJoin(item.packageName, filename || 'index');
      contents.paths[uri] = contents.paths[uri] || {};
      const content = replaceImgSrc(
        data.content,
        urlJoin('/static/plugins/', item.packageName, 'docs', path.dirname(file)),
      );
      contents.paths[uri][firstKey] = {
        file,
        filename,
        packageName: item.packageName,
        path: uri,
        content,
        title: m?.[0],
        ...data.data,
      };
      for (const tag of tags2arr(data.data.tags)) {
        contents.tags[tag.key] = contents.tags[tag.key] || {};
        const current = contents.tags[tag.key][firstKey];
        if (current) {
          if (!current.label && tag.label) {
            contents.tags[tag.key][firstKey] = { ...tag, file, locale: firstKey };
          }
        } else {
          contents.tags[tag.key][firstKey] = { ...tag, file, locale: firstKey };
        }
        contents.tags[tag.key]['paths'] = contents.tags[tag.key]['paths'] || [];
        if (!contents.tags[tag.key]['paths'].includes(uri)) {
          contents.tags[tag.key]['paths'].push(uri);
        }
      }
    }
  }
  contents['locales'] = [...localeSet.values()];
  return contents;
}

const getPluginDocMenu = async (packageName, { contents, locale }) => {
  const items = Object.keys(contents.paths)
    .filter((key) => {
      return key.startsWith(packageName);
    })
    .map((key) => {
      const data = contents.paths[key][locale] || contents.paths[key]['en-US'] || contents.paths[key]['zh-CN'] || {};
      return {
        locale,
        key: `plugins/${data.path}`,
        name: data.filename || 'index',
        label: data.title,
        file: data.file,
        sort: data.sort || 9999,
      };
    });

  const obj = {};

  for (const item of _.sortBy(items, 'name')) {
    _.set(obj, item.name.split('/').join('.children.').split('.'), item);
  }

  const toArr = (o) => {
    return _.sortBy(
      Object.values(o).map((item: any) => {
        if (item.children) {
          item.children = toArr(item.children);
        }
        if (!item.children?.length) {
          delete item.children;
        }
        return item;
      }),
      'sort',
    );
  };

  return toArr(obj);
};

export default {
  name: 'pm',
  actions: {
    async add(ctx, next) {
      const app = ctx.app as Application;
      const { values = {} } = ctx.action.params;
      if (values?.packageName) {
        const args = [];
        if (values.registry) {
          args.push('--registry=' + values.registry);
        }
        if (values.version) {
          args.push('--version=' + values.version);
        }
        if (values.authToken) {
          args.push('--auth-token=' + values.authToken);
        }
        app.runAsCLI(['pm', 'add', values.packageName, ...args], { from: 'user' });
      } else if (ctx.file) {
        const tmpDir = path.resolve(process.cwd(), 'storage', 'tmp');
        try {
          await fs.promises.mkdir(tmpDir, { recursive: true });
        } catch (error) {
          // empty
        }
        const tempFile = path.join(process.cwd(), 'storage/tmp', uid() + path.extname(ctx.file.originalname));
        await fs.promises.writeFile(tempFile, ctx.file.buffer, 'binary');
        app.runAsCLI(['pm', 'add', tempFile], { from: 'user' });
      } else if (values.compressedFileUrl) {
        app.runAsCLI(['pm', 'add', values.compressedFileUrl], { from: 'user' });
      }
      ctx.body = 'ok';
      await next();
    },
    async update(ctx, next) {
      const app = ctx.app as Application;
      const values = ctx.action.params.values || {};
      const args = [];
      if (values.registry) {
        args.push('--registry=' + values.registry);
      }
      if (values.version) {
        args.push('--version=' + values.version);
      }
      if (values.authToken) {
        args.push('--auth-token=' + values.authToken);
      }
      if (values.compressedFileUrl) {
        args.push('--url=' + values.compressedFileUrl);
      }
      if (ctx.file) {
        values.packageName = ctx.request.body.packageName;
        const tmpDir = path.resolve(process.cwd(), 'storage', 'tmp');
        try {
          await fs.promises.mkdir(tmpDir, { recursive: true });
        } catch (error) {
          // empty
        }
        const tempFile = path.join(process.cwd(), 'storage/tmp', uid() + path.extname(ctx.file.originalname));
        await fs.promises.writeFile(tempFile, ctx.file.buffer, 'binary');
        args.push(`--url=${tempFile}`);
      }
      app.runAsCLI(['pm', 'update', values.packageName, ...args], { from: 'user' });
      ctx.body = 'ok';
      await next();
    },
    async npmVersionList(ctx, next) {
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const pm = ctx.app.pm;
      ctx.body = await pm.getNpmVersionList(filterByTk);
      await next();
    },
    async getDocData(ctx, next) {
      const locale = ctx.getCurrentLocale();
      const pm = ctx.app.pm as PluginManager;
      const contents = await getContents(ctx);
      ctx.body = {
        tags: _.sortBy(
          Object.values(contents.tags).map((tag) => {
            const data = tag[locale] || tag['en-US'] || tag['zh-CN'];
            return {
              ...data,
              title: data.title || data.key,
            };
          }),
          'key',
        ),
        plugins: _.sortBy(await pm.list({ locale, isPreset: false }), 'packageName'),
      };
    },
    async getDocMenu(ctx, next) {
      ctx.withoutDataWrapping = true;
      const app = ctx.app;
      const pm = ctx.db.getRepository('applicationPlugins');
      const records = await pm.find({
        sort: 'packageName',
      });
      const plugins = [];
      const locale = ctx.getCurrentLocale();
      const contents = await getContents(ctx);

      const getInfo = (name) => {
        const instance = app.pm.get(name);
        const packageJson = instance.options.packageJson;
        return {
          displayName: packageJson[`displayName.${locale}`] || packageJson.displayName,
          description: packageJson[`description.${locale}`] || packageJson.description,
        };
      };
      for (const record of records) {
        const info = getInfo(record.name);
        const data = {
          key: `plugins/${record.packageName}`,
          displayName: info.displayName || record.name,
          label: info.displayName || record.name,
          packageName: record.packageName,
          children: await getPluginDocMenu(record.packageName, { contents, locale }),
        };
        if (!data.children.length) {
          delete data.children;
        }
        plugins.push(data);
      }

      const tags = [];

      for (const tag of Object.values(contents.tags)) {
        const data = tag[locale] || tag['en-US'] || tag['zh-CN'];
        if (data && tag['paths']) {
          const item = {
            key: `tags/${data.key}`,
            label: data.title || data.key,
          };
          const children = [];
          for (const key of tag['paths']) {
            const article =
              contents.paths[key][locale] || contents.paths[key]['en-US'] || contents.paths[key]['zh-CN'] || {};
            children.push({
              key: `tags/${data.key}/${article.path}`,
              label: article.title,
            });
          }
          if (children.length) {
            item['children'] = children;
          }
          tags.push(item);
        }
      }

      const items = [
        {
          key: 'overview',
          label: 'Overview',
        },
        // {
        //   key: 'guide',
        //   label: 'Guide',
        // },
        {
          key: 'tags',
          label: 'Tags',
          type: 'group',
          children: tags,
        },
        {
          key: 'plugins',
          label: 'Plugins',
          type: 'group',
          children: plugins,
        },
      ];

      ctx.body = {
        data: items,
        meta: {
          contents,
        },
      };

      await next();
    },
    async getDoc(ctx, next) {
      const locale = ctx.getCurrentLocale();
      const pathname = ctx.action.params.path;
      const contents = await getContents(ctx);
      ctx.body = contents.paths[pathname]?.[locale] || contents.paths[pathname]?.['en-US'] || {};
      // ctx.body.contents = contents;
      await next();
    },
    async enable(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const app = ctx.app as Application;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      app.runAsCLI(['pm', 'enable', filterByTk], { from: 'user' });
      ctx.body = filterByTk;
      await next();
    },
    async disable(ctx, next) {
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const app = ctx.app as Application;
      app.runAsCLI(['pm', 'disable', filterByTk], { from: 'user' });
      ctx.body = filterByTk;
      await next();
    },
    async remove(ctx, next) {
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const app = ctx.app as Application;
      app.runAsCLI(['pm', 'remove', filterByTk], { from: 'user' });
      ctx.body = filterByTk;
      await next();
    },
    async list(ctx, next) {
      const locale = ctx.getCurrentLocale();
      const pm = ctx.app.pm as PluginManager;
      ctx.body = await pm.list({ locale, isPreset: false });
      await next();
    },
    async listEnabled(ctx, next) {
      const pm = ctx.db.getRepository('applicationPlugins');
      const PLUGIN_CLIENT_ENTRY_FILE = 'dist/client/index.js';
      const items = await pm.find({
        filter: {
          enabled: true,
        },
      });
      ctx.body = items
        .map((item) => {
          try {
            return {
              ...item.toJSON(),
              url: getExposeUrl(item.packageName, PLUGIN_CLIENT_ENTRY_FILE),
            };
          } catch {
            return false;
          }
        })
        .filter(Boolean);
      await next();
    },
    async getByPkg(ctx, next) {
      const contents = await getContents(ctx);
      const locale = ctx.getCurrentLocale();
      const pm = ctx.app.pm as PluginManager;
      const { packageName } = ctx.action.params;
      if (!packageName) {
        ctx.throw(400, 'plugin name invalid');
      }
      const record = await pm.repository.findOne({
        filter: {
          packageName,
        },
      });
      if (!record) {
        ctx.throw(400, 'plugin name invalid');
      }
      const data = await pm.get(record.name).toJSON({ locale });
      const toc = await getPluginDocMenu(packageName, { contents, locale });
      ctx.body = { ...data, toc };
      await next();
    },
    async get(ctx, next) {
      const locale = ctx.getCurrentLocale();
      const pm = ctx.app.pm as PluginManager;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      ctx.body = await pm.get(filterByTk).toJSON({ locale });
      await next();
    },
  },
};
