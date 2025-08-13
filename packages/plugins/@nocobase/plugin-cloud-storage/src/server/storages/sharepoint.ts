import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';
import { Client } from '@microsoft/microsoft-graph-client';
import { Request } from 'express';
import { File } from 'multer';
import { Readable } from 'stream';

const STORAGE_TYPE_SHAREPOINT = 'sharepoint';

class SharePointStorageEngine implements StorageEngine {
  private getFilename(req: Request, file: File, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }

  _handleFile(req: Request, file: File, cb) {
    this.getFilename(req, file, (err, filename) => {
      if (err) {
        return cb(err);
      }

      const { accessToken, siteId, driveId } = req.body;
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const stream = new Readable();
      stream.push(file.stream);
      stream.push(null);

      client
        .api(`/sites/${siteId}/drives/${driveId}/root:/${filename}:/content`)
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
    const { accessToken, siteId, driveId } = req.body;
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    client.api(`/sites/${siteId}/drives/${driveId}/items/${file.id}`).delete((err) => {
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
      title: 'SharePoint',
      name: 'sharepoint',
      type: STORAGE_TYPE_SHAREPOINT,
      options: {
        accessToken: process.env.SHAREPOINT_ACCESS_TOKEN,
        siteId: process.env.SHAREPOINT_SITE_ID,
        driveId: process.env.SHAREPOINT_DRIVE_ID,
      },
    };
  }

  static filenameKey = 'id';

  make() {
    return new SharePointStorageEngine();
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { accessToken, siteId, driveId } = this.storage.options;
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    const deleted = [];
    for (const record of records) {
      const fileId = this.getFileKey(record);
      try {
        await client.api(`/sites/${siteId}/drives/${driveId}/items/${fileId}`).delete();
        deleted.push(record);
      } catch (err) {
        // ignore error
      }
    }
    return [deleted.length, records.filter(record => !deleted.includes(record))];
  }
}
