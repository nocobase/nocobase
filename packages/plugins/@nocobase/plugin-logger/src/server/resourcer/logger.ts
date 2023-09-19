import { Context, Next } from '@nocobase/actions';
import { getLoggerFilePath } from '@nocobase/logger';
import { readdir } from 'fs/promises';
import { join } from 'path';
import tar from 'tar';
import fs from 'fs';

const tarFile = (files: string[], stream: fs.WriteStream) => {
  return new Promise((resolve, reject) => {
    tar
      .c(
        {
          gzip: true,
          cwd: getLoggerFilePath(),
        },
        files,
      )
      .on('error', (err) => reject(err))
      .pipe(stream)
      .on('error', (err) => reject(err));
  });
};

export default {
  name: 'logger',
  actions: {
    list: async (ctx: Context, next: Next) => {
      const path = getLoggerFilePath();
      const readDir = async (path: string) => {
        const fileTree = [];
        try {
          const files = await readdir(path, { withFileTypes: true });
          for (const file of files) {
            if (file.isDirectory()) {
              const subFiles = await readDir(join(path, file.name));
              if (!subFiles.length) {
                continue;
              }
              fileTree.push({
                name: file.name,
                files: subFiles,
              });
            } else if (file.name.endsWith('.log')) {
              fileTree.push(file.name);
            }
          }
          return fileTree;
        } catch (err) {
          ctx.log.error('readDir error', err, { meta: { path } });
          return [];
        }
      };
      const files = await readDir(path);
      ctx.body = files;
      await next();
    },
    download: async (ctx: Context, next: Next) => {
      const { files = [] } = ctx.action.params.values || {};
      const invalid = files.some((file: string) => !file.endsWith('.log'));
      if (invalid) {
        ctx.throw(400, ctx.t('Invalid file type: ') + invalid);
      }
      try {
        ctx.res.setHeader('Content-Type', 'application/octet-stream');
        const file = fs.createWriteStream('logs.tgz');
        await tarFile(files, file);
        ctx.body = file;
      } catch (err) {
        ctx.log.error('download error', err, { meta: { files } });
        ctx.throw(500, ctx.t('Download logs failed.'));
      }
      await next();
    },
  },
};
