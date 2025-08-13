import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';
import { Dropbox } from 'dropbox';
import { Request } from 'express';
import { File } from 'multer';

const STORAGE_TYPE_DROPBOX = 'dropbox';

class DropboxStorageEngine implements StorageEngine {
  private getFilename(req: Request, file: File, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }

  _handleFile(req: Request, file: File, cb) {
    this.getFilename(req, file, (err, filename) => {
      if (err) {
        return cb(err);
      }

      const dbx = new Dropbox({ accessToken: req.body.accessToken });
      const path = `/${filename}`;

      dbx.filesUpload({ path, contents: file.stream })
        .then(response => {
          cb(null, {
            path: response.result.path_display,
            size: response.result.size,
          });
        })
        .catch(err => {
          cb(err);
        });
    });
  }

  _removeFile(req: Request, file: any, cb) {
    const dbx = new Dropbox({ accessToken: req.body.accessToken });
    const path = file.path;

    dbx.filesDeleteV2({ path })
      .then(() => {
        cb(null);
      })
      .catch(err => {
        cb(err);
      });
  }
}

export default class extends StorageType {
  static defaults() {
    return {
      title: 'Dropbox',
      name: 'dropbox',
      type: STORAGE_TYPE_DROPBOX,
      options: {
        accessToken: process.env.DROPBOX_ACCESS_TOKEN,
      },
    };
  }

  static filenameKey = 'path';

  make() {
    return new DropboxStorageEngine();
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const dbx = new Dropbox({ accessToken: this.storage.options.accessToken });
    const deleted = [];
    for (const record of records) {
      const path = this.getFileKey(record);
      try {
        await dbx.filesDeleteV2({ path });
        deleted.push(record);
      } catch (err) {
        // ignore error
      }
    }
    return [deleted.length, records.filter(record => !deleted.includes(record))];
  }
}
