import { STORAGE_TYPE_S3 } from '../constants';
import { cloudFilenameGetter } from '../utils';

export default {
  filenameKey: 'key',
  make(storage) {
    const S3Client = require('aws-sdk/clients/s3');
    const multerS3 = require('multer-s3');
    const { accessKeyId, secretAccessKey, bucket, acl = 'public-read', ...options } = storage.options;
    const s3 = new S3Client({
      ...options,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return multerS3({
      s3,
      bucket,
      acl,
      contentType(req, file, cb) {
        if (file.mimetype) {
          cb(null, file.mimetype);
          return;
        }

        multerS3.AUTO_CONTENT_TYPE(req, file, cb);
      },
      key: cloudFilenameGetter(storage),
    });
  },
  defaults() {
    return {
      title: 'AWS S3',
      name: 'aws-s3',
      type: STORAGE_TYPE_S3,
      baseUrl: process.env.AWS_S3_STORAGE_BASE_URL,
      options: {
        region: process.env.AWS_S3_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_S3_BUCKET,
      },
    };
  },
};
