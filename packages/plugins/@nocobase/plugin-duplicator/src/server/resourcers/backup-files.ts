import { getApp } from '../actions/get-app';
import { Dumper } from '../dumper';
import { DumpDataType } from '@nocobase/database';
import fs from 'fs';
import { koaMulter as multer } from '@nocobase/utils';
import os from 'os';
import path from 'path';
import fsPromises from 'fs/promises';

export default {
  name: 'backupFiles',
  middleware: async (ctx, next) => {
    if (ctx.action.actionName !== 'upload') {
      return next();
    }

    const storage = multer.diskStorage({
      destination: os.tmpdir(),
      filename: function (req, file, cb) {
        const randomName = Date.now().toString() + Math.random().toString().slice(2); // 随机生成文件名
        cb(null, randomName);
      },
    });

    const upload = multer({ storage }).single('file');
    return upload(ctx, next);
  },
  actions: {
    async list(ctx, next) {},
    async get(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const { app: appName } = ctx.request.query;

      const app = await getApp(ctx, appName);
      const dumper = new Dumper(app);

      const filePath = dumper.backUpFilePath(filterByTk);

      try {
        const fileState = await Dumper.getFileStatus(filePath);

        if (fileState.status !== 'ok') {
          ctx.body = {
            status: 'error',
            message: `Backup file ${filterByTk} not found`,
          };
          ctx.status = 404;
        } else {
          ctx.body = fileState;
        }
      } catch (e) {
        if (e.code === 'ENOENT') {
          ctx.body = {
            status: 'error',
            message: `Backup file ${filterByTk} not found`,
          };
          ctx.status = 404;
        }
      }

      await next();
    },

    /**
     * create dump task
     * @param ctx
     * @param next
     */
    async create(ctx, next) {
      const data = <
        {
          dataTypes: string[];
        }
      >ctx.request.body;

      const dumper = new Dumper(ctx.app);

      const taskId = await dumper.runDumpTask({
        dataTypes: new Set(data.dataTypes) as Set<DumpDataType>,
      });

      ctx.body = {
        key: taskId,
      };

      await next();
    },

    /**
     * download backup file
     * @param ctx
     * @param next
     */
    async download(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const dumper = new Dumper(ctx.app);

      const filePath = dumper.backUpFilePath(filterByTk);

      const fileState = await Dumper.getFileStatus(filePath);

      if (fileState.status !== 'ok') {
        throw new Error(`Backup file ${filterByTk} not found`);
      }

      ctx.attachment(filePath);
      ctx.body = fs.createReadStream(filePath);
      await next();
    },
    async restore(ctx, next) {
      const { filterByTk, dataTypes, key } = ctx.action.params;

      const filePath = (() => {
        if (key) {
          const tmpDir = os.tmpdir();
          return path.resolve(tmpDir, key);
        }

        if (filterByTk) {
          const dumper = new Dumper(ctx.app);
          return dumper.backUpFilePath(filterByTk);
        }
      })();

      if (!filePath) {
        throw new Error(`Backup file ${filterByTk} not found`);
      }

      const args = ['restore', '-f', filePath];

      for (const dataType of dataTypes) {
        args.push('-d', dataType);
      }

      await ctx.app.runCommand(...args);

      await next();
    },
    async destroy(ctx, next) {
      const { filterByTk } = ctx.action.params;
      const dumper = new Dumper(ctx.app);
      const filePath = dumper.backUpFilePath(filterByTk);

      await fsPromises.unlink(filePath);

      // remove file
      ctx.body = {
        status: 'ok',
      };
      await next();
    },

    async upload(ctx, next) {},
  },
};
