/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import Application from '../../application';
import PluginManager from '../plugin-manager';

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
      // if (values.compressedFileUrl) {
      //   args.push('--url=' + values.compressedFileUrl);
      // }
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
        // args.push(`--url=${tempFile}`);
        values.compressedFileUrl = tempFile;
      }
      app.runAsCLI(['pm', 'update', values.compressedFileUrl || values.packageName, ...args], { from: 'user' });
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
    async enable(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const app = ctx.app as Application;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const keys = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
      app.runAsCLI(['pm', 'enable', ...keys], { from: 'user' });
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
      // ctx.body = await pm.list({ locale, isPreset: false });
      const plugin = pm.get('nocobase') as any;
      ctx.body = await plugin.getAllPlugins(locale);
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
      const arr = [];
      for (const item of items) {
        const pkgPath = path.resolve(process.env.NODE_MODULES_PATH, item.packageName);
        const r = await fse.exists(pkgPath);
        if (r) {
          let t = '';
          const dist = path.resolve(pkgPath, PLUGIN_CLIENT_ENTRY_FILE);
          const distExists = await fse.exists(dist);
          if (distExists) {
            const fsState = await fse.stat(distExists ? dist : pkgPath);
            t = `&t=${fsState.mtime.getTime()}`;
          }
          const url = `${process.env.APP_SERVER_BASE_URL}${process.env.PLUGIN_STATICS_PATH}${item.packageName}/${PLUGIN_CLIENT_ENTRY_FILE}?version=${item.version}${t}`;
          arr.push({
            ...item.toJSON(),
            url,
          });
        }
      }
      ctx.body = arr;
      await next();
    },
    async get(ctx, next) {
      const locale = ctx.getCurrentLocale();
      const pm = ctx.app.pm as PluginManager;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const plugin = pm.get('nocobase') as any;
      ctx.body = await plugin.getPluginInfo(filterByTk, locale);
      // ctx.body = await pm.get(filterByTk).toJSON({ locale });
      await next();
    },
  },
};
