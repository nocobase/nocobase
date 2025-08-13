import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';
import { google } from 'googleapis';
import { Request } from 'express';
import { File } from 'multer';
import { Readable } from 'stream';

const STORAGE_TYPE_GOOGLE_DRIVE = 'google-drive';

class GoogleDriveStorageEngine implements StorageEngine {
  private getFilename(req: Request, file: File, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }

  _handleFile(req: Request, file: File, cb) {
    this.getFilename(req, file, (err, filename) => {
      if (err) {
        return cb(err);
      }

      const { clientId, clientSecret, redirectUri, refreshToken } = req.body;
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const fileMetadata = {
        name: filename,
      };
      const media = {
        mimeType: file.mimetype,
        body: file.stream,
      };
      drive.files.create(
        {
          resource: fileMetadata,
          media: media,
          fields: 'id,name,size,webContentLink',
        },
        (err, file) => {
          if (err) {
            return cb(err);
          }
          cb(null, {
            id: file.data.id,
            filename: file.data.name,
            size: file.data.size,
            webContentLink: file.data.webContentLink,
          });
        },
      );
    });
  }

  _removeFile(req: Request, file: any, cb) {
    const { clientId, clientSecret, redirectUri, refreshToken } = req.body;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    drive.files.delete({ fileId: file.id }, (err) => {
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
      title: 'Google Drive',
      name: 'google-drive',
      type: STORAGE_TYPE_GOOGLE_DRIVE,
      options: {
        clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI,
        refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
      },
    };
  }

  static filenameKey = 'id';

  make() {
    return new GoogleDriveStorageEngine();
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { clientId, clientSecret, redirectUri, refreshToken } = this.storage.options;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const deleted = [];
    for (const record of records) {
      const fileId = this.getFileKey(record);
      try {
        await drive.files.delete({ fileId });
        deleted.push(record);
      } catch (err) {
        // ignore error
      }
    }
    return [deleted.length, records.filter(record => !deleted.includes(record))];
  }
}
