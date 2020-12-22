import path from 'path';
import crypto from 'crypto';
import mkdirp from 'mkdirp';
import multer from 'multer';

export function getDocumentRoot(storage): string {
  const { documentRoot = 'uploads' } = storage.options || {};
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return path.resolve(path.isAbsolute(documentRoot)
    ? documentRoot
    : path.join(process.env.PWD, documentRoot), storage.path);
}

export default (storage) => multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = getDocumentRoot(storage);
    mkdirp(destPath).then(() => {
      cb(null, destPath);
    }).catch(cb);
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, (err, raw) => {
      cb(err, err ? undefined : `${raw.toString('hex')}${path.extname(file.originalname)}`)
    });
  }
});
