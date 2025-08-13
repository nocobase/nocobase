import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';
import { Client } from '@microsoft/microsoft-graph-client';
import { Request } from 'express';
import { File } from 'multer';
import { Readable } from 'stream';

const STORAGE_TYPE_ONEDRIVE = 'onedrive';

class OneDriveStorageEngine implements StorageEngine {
  private getFilename(req: Request, file: File, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }

  _handleFile(req: Request, file: File, cb) {
    this.getFilename(req, file, (err, filename) => {
      if (err) {
        return cb(err);
      }

      const { accessToken } = req.body;
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const stream = new Readable();
      stream.push(file.stream);
      stream.push(null);

      client
        .api(`/me/drive/root:/${filename}:/content`)
        .put(stream, (err, res) => {
          if (err) {
            return cb(err);
          }
          cb(null, {
            id: res.id,
            filename: res.name,
            size: res.size,
            webUrl: res.webUrl,
          });
        });
    });
  }

  _removeFile(req: Request, file: any, cb) {
    const { accessToken } = req.body;
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    client.api(`/me/drive/items/${file.id}`).delete((err) => {
      if (err) {
        return cb(err);
      }
      cb(null);
    });
  }
}

export default class extends StorageType {
  static defaults() {
    return {
      title: 'OneDrive',
      name: 'onedrive',
      type: STORAGE_TYPE_ONEDRIVE,
      options: {
        accessToken: process.env.ONEDRIVE_ACCESS_TOKEN,
      },
    };
  }

  static filenameKey = 'id';

  make() {
    return new OneDriveStorageEngine();
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { accessToken } = this.storage.options;
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    const deleted = [];
    for (const record of records) {
      const fileId = this.getFileKey(record);
      try {
        await client.api(`/me/drive/items/${fileId}`).delete();
        deleted.push(record);
      } catch (err) {
        // ignore error
      }
    }
    return [deleted.length, records.filter(record => !deleted.includes(record))];
  }
}
