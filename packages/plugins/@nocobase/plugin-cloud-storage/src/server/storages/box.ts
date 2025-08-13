import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';
import BoxSDK from 'box-node-sdk';
import { Request } from 'express';
import { File } from 'multer';
import { Readable } from 'stream';

const STORAGE_TYPE_BOX = 'box';

class BoxStorageEngine implements StorageEngine {
  private getFilename(req: Request, file: File, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }

  _handleFile(req: Request, file: File, cb) {
    this.getFilename(req, file, (err, filename) => {
      if (err) {
        return cb(err);
      }

      const { developerToken } = req.body;
      const sdk = new BoxSDK({
        clientID: '', // not needed for developer token
        clientSecret: '', // not needed for developer token
        developerToken,
      });
      const client = sdk.getBasicClient();

      client.files.uploadFile('0', filename, file.stream, (err, file) => {
        if (err) {
          return cb(err);
        }
        cb(null, {
          id: file.id,
          filename: file.name,
          size: file.size,
        });
      });
    });
  }

  _removeFile(req: Request, file: any, cb) {
    const { developerToken } = req.body;
    const sdk = new BoxSDK({
      clientID: '', // not needed for developer token
      clientSecret: '', // not needed for developer token
      developerToken,
    });
    const client = sdk.getBasicClient();

    client.files.delete(file.id, null, (err) => {
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
      title: 'Box',
      name: 'box',
      type: STORAGE_TYPE_BOX,
      options: {
        developerToken: process.env.BOX_DEVELOPER_TOKEN,
      },
    };
  }

  static filenameKey = 'id';

  make() {
    return new BoxStorageEngine();
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { developerToken } = this.storage.options;
    const sdk = new BoxSDK({
      clientID: '', // not needed for developer token
      clientSecret: '', // not needed for developer token
      developerToken,
    });
    const client = sdk.getBasicClient();

    const deleted = [];
    for (const record of records) {
      const fileId = this.getFileKey(record);
      try {
        await client.files.delete(fileId);
        deleted.push(record);
      } catch (err) {
        // ignore error
      }
    }
    return [deleted.length, records.filter(record => !deleted.includes(record))];
  }
}
