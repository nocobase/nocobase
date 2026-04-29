/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceOptions } from '@nocobase/resourcer';
import { koaMulter as multer } from '@nocobase/utils';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { PublishArtifactService, PublishArtifactType, PublishArtifactMeta } from '../services/publish-artifact-service';
import { getPublishAdapter, getPublishAdapterCapabilities } from '../services/publish-adapters/registry';

function getTmpDir() {
  return path.resolve(process.cwd(), 'storage', 'tmp', 'publish');
}

function ensureType(rawType: string): PublishArtifactType {
  if (rawType === 'backup' || rawType === 'migration' || rawType === 'database') {
    return rawType;
  }
  throw new Error(`Unsupported publish artifact type: ${rawType}`);
}

function getUserId(ctx: any) {
  return ctx.auth?.user?.id;
}

function getUploadFile(ctx: any): any {
  const file = ctx.file || ctx.request?.file;
  if (!file) {
    throw new Error('Missing upload file');
  }
  return file;
}

function asObject(value: any) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function getPublishCommandValues(ctx: any) {
  return {
    ...asObject(ctx.req?.body),
    ...asObject(ctx.request?.body),
    ...asObject(ctx.action?.params?.values),
  };
}

function parseMetadata(raw: any) {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'object') {
    return raw;
  }
  return JSON.parse(raw);
}

function createAdapterContext(ctx: any, artifactService: PublishArtifactService) {
  return {
    ctx,
    artifactService,
    createdById: getUserId(ctx),
  };
}

export default {
  name: 'publishCommands',
  middleware: async (ctx, next) => {
    if (ctx.action.actionName !== 'upload') {
      return next();
    }

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        fsPromises
          .mkdir(getTmpDir(), { recursive: true })
          .then(() => cb(null, getTmpDir()))
          .catch((error) => cb(error, getTmpDir()));
      },
      filename: function (req, file, cb) {
        const randomName = Date.now().toString() + Math.random().toString().slice(2);
        cb(null, randomName);
      },
    });

    const upload = multer({ storage }).single('file');
    return upload(ctx, next);
  },
  actions: {
    async capabilities(ctx, next) {
      const capabilities = getPublishAdapterCapabilities();
      ctx.body = {
        status: 'ok',
        data: {
          apiVersion: '1.0',
          experimental: true,
          types: capabilities,
          maxUploadSize: 1024 * 1024 * 1024,
        },
      };
      await next();
    },

    async generate(ctx, next) {
      const values = getPublishCommandValues(ctx);
      const type = ensureType(values.type);
      const options = values.options || {};
      const artifactService = new PublishArtifactService(ctx.app);
      const adapter = getPublishAdapter(type);
      const result = await adapter.generate(createAdapterContext(ctx, artifactService), options);

      ctx.body = {
        status: 'ok',
        data: {
          taskId: result.meta.artifactId,
          artifactId: result.meta.artifactId,
          fileName: result.meta.fileName,
          state: result.meta.state,
          checksum: result.meta.checksum,
        },
      };
      await next();
    },

    async status(ctx, next) {
      const { type, artifactId, taskId } = ctx.action.params;
      const artifactService = new PublishArtifactService(ctx.app);
      const meta = await artifactService.readMeta(ensureType(type), artifactId || taskId);
      ctx.body = {
        status: 'ok',
        data: {
          taskId: meta.artifactId,
          artifactId: meta.artifactId,
          fileName: meta.fileName,
          state: meta.state,
          checksum: meta.checksum,
          result: meta.result,
          error: meta.error,
          metadata: meta.metadata,
        },
      };
      await next();
    },

    async download(ctx, next) {
      const { type, artifactId } = ctx.action.params;
      const artifactService = new PublishArtifactService(ctx.app);
      const meta = await artifactService.readMeta(ensureType(type), artifactId);
      const filePath = await artifactService.getFilePath(meta);
      ctx.set('X-NocoBase-Publish-Type', meta.type);
      if (meta.checksum) {
        ctx.set('X-NocoBase-Publish-Checksum', meta.checksum);
      }
      ctx.attachment(meta.fileName);
      ctx.body = fs.createReadStream(filePath);
      await next();
    },

    async upload(ctx, next) {
      const file = getUploadFile(ctx);
      const values = getPublishCommandValues(ctx);
      const type = ensureType(values.type);
      const adapter = getPublishAdapter(type);
      if (!adapter.capabilities().upload) {
        throw new Error(adapter.capabilities().unavailableReason || `Publish upload is not available for ${type}`);
      }
      const artifactService = new PublishArtifactService(ctx.app);
      let meta: PublishArtifactMeta | undefined;
      try {
        const result = await artifactService.createFromFile({
          type,
          filePath: file.path,
          fileName: file.originalname,
          state: 'staged',
          sourceEnv: values.sourceEnv,
          createdById: getUserId(ctx),
          metadata: parseMetadata(values.metadata),
        });
        meta = result.meta;
        artifactService.verifyChecksum(values.checksum, meta.checksum);
      } catch (error) {
        if (meta) {
          await artifactService.destroy(meta.type, meta.artifactId).catch(() => {});
        }
        throw error;
      } finally {
        await fsPromises.unlink(file.path).catch(() => {});
      }

      let nextMeta = meta;
      try {
        nextMeta = await adapter.validateUpload(createAdapterContext(ctx, artifactService), meta);
      } catch (error) {
        await artifactService
          .updateMeta(meta.type, meta.artifactId, {
            state: 'failed',
            error: error.message,
          })
          .catch(() => {});
        throw error;
      }

      ctx.body = {
        status: 'ok',
        data: {
          artifactId: nextMeta.artifactId,
          fileName: nextMeta.fileName,
          type: nextMeta.type,
          state: nextMeta.state,
          checksum: nextMeta.checksum,
          metadata: nextMeta.metadata,
          error: nextMeta.error,
        },
      };
      await next();
    },

    async execute(ctx, next) {
      const values = getPublishCommandValues(ctx);
      const type = ensureType(values.type);
      const artifactService = new PublishArtifactService(ctx.app);
      const meta = await artifactService.readMeta(type, values.artifactId);
      const options = values.options || {};
      let nextMeta: PublishArtifactMeta;
      const adapter = getPublishAdapter(type);

      artifactService.assertExecutableArtifact(meta);

      try {
        nextMeta = await adapter.execute(createAdapterContext(ctx, artifactService), meta, options);
      } catch (error) {
        await artifactService
          .updateMeta(type, values.artifactId, {
            state: 'failed',
            error: error.message,
          })
          .catch(() => {});
        throw error;
      }

      ctx.body = {
        status: 'ok',
        data: {
          taskId: nextMeta.artifactId,
          artifactId: nextMeta.artifactId,
          fileName: nextMeta.fileName,
          state: nextMeta.state,
          result: nextMeta.result,
          error: nextMeta.error,
        },
      };
      await next();
    },

    async list(ctx, next) {
      const type = ctx.action.params.type ? ensureType(ctx.action.params.type) : undefined;
      const artifactService = new PublishArtifactService(ctx.app);
      ctx.body = {
        status: 'ok',
        data: await artifactService.list(type),
      };
      await next();
    },

    async destroy(ctx, next) {
      const { type, artifactId } = ctx.action.params;
      const artifactService = new PublishArtifactService(ctx.app);
      await artifactService.destroy(ensureType(type), artifactId);
      ctx.body = {
        status: 'ok',
      };
      await next();
    },
  },
} satisfies ResourceOptions;
