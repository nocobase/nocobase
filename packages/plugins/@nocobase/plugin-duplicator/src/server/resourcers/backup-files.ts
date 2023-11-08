import { getApp } from '../actions/get-app';
import { Dumper } from '../dumper';
import { DumpDataType } from '@nocobase/database';
import fs from 'fs';
import { koaMulter as multer } from '@nocobase/utils';
import os from 'os';

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
    async get(ctx, next) {},

    /**
     * create dump task
     * @param ctx
     * @param next
     */
    async create(ctx, next) {
      const data = <
        {
          dataTypes: string[];
          app?: string;
        }
      >ctx.request.body;

      const app = await getApp(ctx, data.app);

      const dumper = new Dumper(app);

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
      const { app: appName } = ctx.request.query;

      const app = await getApp(ctx, appName);
      const dumper = new Dumper(app);

      const filePath = dumper.backUpFilePath(filterByTk);

      const fileState = await Dumper.getFileStatus(filePath);

      if (fileState.status !== 'ok') {
        throw new Error(`Backup file ${filterByTk} not found`);
      }

      ctx.attachment(filePath);
      ctx.body = fs.createReadStream(filePath);
      await next();
    },
    async restore(ctx, next) {},
    async destroy(ctx, next) {},
    async upload(ctx, next) {},
  },
};
