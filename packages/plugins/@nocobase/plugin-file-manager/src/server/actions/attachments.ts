/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PassThrough } from 'stream';
import match from 'mime-match';
import mime from 'mime-types';

import { Context, Next } from '@nocobase/actions';
import { koaMulter as multer } from '@nocobase/utils';

import Plugin from '..';
import { FILE_FIELD_NAME, FILE_SIZE_LIMIT_DEFAULT, FILE_SIZE_LIMIT_MIN, LIMIT_FILES } from '../../constants';
import { StorageClassType, StorageType } from '../storages';

function makeMulterStorage(storage: StorageType) {
  const innerStorage = storage.make();

  return {
    _handleFile(req, file, cb) {
      const pattern = storage.storage.rules.mimetype;
      const peekSize = 4100;
      const originalStream = file.stream;
      const passThrough = new PassThrough();
      const proxyFile = { ...file, stream: passThrough };
      let detectedMime = null;

      const finalCallback = (err, result) => {
        if (err) {
          return cb(err);
        }
        if (detectedMime && result) {
          result.mimetype = detectedMime;
        }
        cb(null, result);
      };

      innerStorage._handleFile(req, proxyFile, finalCallback);

      const chunks = [];
      let bytesRead = 0;
      let validationTriggered = false;

      const cleanup = () => {
        originalStream.removeListener('data', onData);
        originalStream.removeListener('end', onEnd);
        originalStream.removeListener('error', onError);
      };

      const onData = (chunk) => {
        if (validationTriggered) return;
        chunks.push(chunk);
        bytesRead += chunk.length;
        if (bytesRead >= peekSize) {
          validationTriggered = true;
          cleanup();
          originalStream.pause(); // Pause before async validation
          validate(Buffer.concat(chunks));
        }
      };

      const onEnd = () => {
        if (!validationTriggered) {
          validationTriggered = true;
          cleanup();
          validate(Buffer.concat(chunks));
        }
      };

      const onError = (err) => {
        cleanup();
        passThrough.destroy(err);
      };

      const validate = async (header) => {
        try {
          const { fileTypeFromBuffer } = await import('file-type');
          const type = await fileTypeFromBuffer(new Uint8Array(header));

          if (type) {
            detectedMime = type.mime;
          } else {
            const fromFilename = mime.lookup(file.originalname);
            if (fromFilename) {
              detectedMime = fromFilename;
            }
          }

          if (!detectedMime || (pattern !== '*' && !pattern.toString().split(',').some(match(detectedMime)))) {
            const err = new Error('Mime type not allowed by storage rule');
            err.name = 'MulterError';
            originalStream.destroy();
            passThrough.destroy();
            return cb(err);
          }

          // Validation passed. Now, write the header and pipe the rest.
          passThrough.write(header, (writeErr) => {
            if (writeErr) {
              originalStream.destroy();
              passThrough.destroy();
              return cb(writeErr);
            }

            if (originalStream.readableEnded) {
              passThrough.end();
            } else {
              originalStream.pipe(passThrough);
              originalStream.resume();
            }
          });
        } catch (err) {
          originalStream.destroy();
          passThrough.destroy();
          return cb(err);
        }
      };

      originalStream.on('data', onData);
      originalStream.on('end', onEnd);
      originalStream.on('error', onError);
    },

    _removeFile(req, file, cb) {
      innerStorage._removeFile(req, file, cb);
    },
  };
}

async function multipart(ctx: Context, next: Next) {
  const { storage } = ctx;
  if (!storage) {
    ctx.logger.error('[file-manager] no linked or default storage provided');
    return ctx.throw(500);
  }

  const StorageClass = ctx.app.pm.get(Plugin).storageTypes.get(storage.type) as StorageClassType;
  if (!StorageClass) {
    ctx.logger.error(`[file-manager] storage type "${storage.type}" is not defined`);
    return ctx.throw(500);
  }
  const storageInstance = new StorageClass(storage);

  const multerOptions = {
    // fileFilter: getFileFilter(storageInstance),
    limits: {
      // 每次只允许提交一个文件
      files: LIMIT_FILES,
    },
    storage: storage.rules?.mimetype ? makeMulterStorage(storageInstance) : storageInstance.make(),
  };
  multerOptions.limits['fileSize'] = Math.max(FILE_SIZE_LIMIT_MIN, storage.rules.size ?? FILE_SIZE_LIMIT_DEFAULT);

  const upload = multer(multerOptions).single(FILE_FIELD_NAME);
  try {
    // NOTE: empty next and invoke after success
    await upload(ctx, () => {});
  } catch (err) {
    if (err.name === 'MulterError') {
      return ctx.throw(400, err);
    }
    ctx.logger.error(err);
    return ctx.throw(500, err);
  }

  const { [FILE_FIELD_NAME]: file } = ctx;
  if (!file) {
    return ctx.throw(400, 'file validation failed');
  }

  const values = storageInstance.getFileData(file, ctx.request.body);

  ctx.action.mergeParams({
    values,
  });

  await next();
}

export async function createMiddleware(ctx: Context, next: Next) {
  const { resourceName, actionName } = ctx.action;
  const { attachmentField } = ctx.action.params;
  const collection = ctx.db.getCollection(resourceName);

  if (collection?.options?.template !== 'file' || !['upload', 'create'].includes(actionName)) {
    return next();
  }

  const storageName =
    resourceName === 'attachments'
      ? ctx.db.getFieldByPath(attachmentField)?.options?.storage
      : collection.options.storage;
  // const StorageRepo = ctx.db.getRepository('storages');
  // const storage = await StorageRepo.findOne({ filter: storageName ? { name: storageName } : { default: true } });
  const plugin = ctx.app.pm.get(Plugin) as Plugin;
  const storage = Array.from(plugin.storagesCache.values()).find((storage) =>
    storageName ? storage.name === storageName : storage.default,
  );
  if (!storage) {
    ctx.logger.error(`[file-manager] no storage found`);
    return ctx.throw(500);
  }
  ctx.storage = storage;

  if (ctx?.request.is('multipart/*')) {
    await multipart(ctx, next);
  } else {
    ctx.action.mergeParams({
      values: {
        storage: { id: storage.id },
      },
    });
    await next();
  }
}
