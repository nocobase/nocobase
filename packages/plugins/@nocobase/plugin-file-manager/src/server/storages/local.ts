import fs from 'fs/promises';
import mkdirp from 'mkdirp';
import multer from 'multer';
import path from 'path';
import { AttachmentModel } from '.';
import { STORAGE_TYPE_LOCAL } from '../constants';
import { getFilename } from '../utils';

function getDocumentRoot(storage): string {
  const { documentRoot = process.env.LOCAL_STORAGE_DEST || 'storage/uploads' } = storage.options || {};
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return path.resolve(path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot));
}

export default {
  make(storage) {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        const destPath = path.join(getDocumentRoot(storage), storage.path);
        mkdirp(destPath, (err: Error | null) => cb(err, destPath));
      },
      filename: getFilename,
    });
  },
  defaults() {
    return {
      title: 'Local storage',
      type: STORAGE_TYPE_LOCAL,
      name: `local`,
      baseUrl: '/storage/uploads',
      options: {
        documentRoot: 'storage/uploads',
      },
    };
  },
  async delete(storage, records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const documentRoot = getDocumentRoot(storage);
    let count = 0;
    const undeleted = [];
    await records.reduce(
      (promise, record) =>
        promise.then(async () => {
          try {
            await fs.unlink(path.join(documentRoot, record.path, record.filename));
            count += 1;
          } catch (ex) {
            if (ex.code === 'ENOENT') {
              console.warn(ex.message);
              count += 1;
            } else {
              console.error(ex);
              undeleted.push(record);
            }
          }
        }),
      Promise.resolve(),
    );

    return [count, undeleted];
  },
};
