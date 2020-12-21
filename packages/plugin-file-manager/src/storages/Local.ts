import path from 'path';
import mkdirp from 'mkdirp';
import { v4 as uuid } from 'uuid';
import multer from 'multer';

import * as rules from '../rules';

export default function(ctx) {
  return {
    fileFilter(req, file, cb) {
      const ruleKeys = Object.keys(ctx.storage.rules);
      const result = !ruleKeys.length || !ruleKeys
        .some(key => typeof rules[key] !== 'function'
          || !rules[key](file, ctx.storage.rules[key], ctx));
      cb(null, result);
    },
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const { documentRoot = 'uploads' } = ctx.storage.options || {};
        // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
        const destPath = path.resolve(path.isAbsolute(documentRoot) ? documentRoot : path.join(process.env.PWD, documentRoot), ctx.storage.path);
        mkdirp(destPath).then(() => {
          cb(null, destPath);
        });
      },
      filename: function (req, file, cb) {
        cb(null, `${uuid()}${path.extname(file.originalname)}`);
      }
    })
  };
}
