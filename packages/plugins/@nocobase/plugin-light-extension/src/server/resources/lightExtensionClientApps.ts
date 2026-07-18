/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import { koaMulter as multer } from '@nocobase/utils';
import fs from 'fs/promises';
import os from 'os';

import { isLightExtensionError, LightExtensionError } from '../../shared/errors';
import { CLIENT_APP_ARCHIVE_LIMITS } from '../services/ClientAppArchive';
import { ClientAppService } from '../services/ClientAppService';
import { getServiceContext, type LightExtensionResourceContext, toRecord } from './resourceAction';

export const lightExtensionClientAppActionNames = ['upload', 'list', 'get', 'delete', 'listReferences'] as const;
export const CLIENT_APP_UPLOAD_LIMITS = Object.freeze({
  files: 1,
  fileSize: CLIENT_APP_ARCHIVE_LIMITS.compressedBytes,
  fields: 3,
  fieldNameSize: 64,
  fieldSize: 4 * 1024,
  parts: 4,
  headerPairs: 32,
});

type MultipartRequest = NonNullable<LightExtensionResourceContext['request']> & {
  body?: Record<string, unknown>;
  file?: {
    path?: string;
  };
};

export function createLightExtensionClientAppsResource(
  clientAppService: ClientAppService,
  deleteClientApp: (entryId: string) => Promise<void> = (entryId) => clientAppService.deleteClientApp(entryId),
  listClientAppReferences: (entryId: string) => Promise<unknown> = async () => [],
): ResourceOptions {
  return {
    name: 'lightExtensionClientApps',
    only: [...lightExtensionClientAppActionNames],
    middleware: createClientAppUploadMiddleware(),
    actions: {
      upload: createClientAppResourceAction(async (ctx) => {
        const request = ctx.request as MultipartRequest | undefined;
        const zipPath = request?.file?.path;
        if (!zipPath) {
          throw invalidInput('A client app ZIP file is required');
        }
        try {
          return await clientAppService.upload(
            {
              repoId: requireRepoId(ctx, request?.body),
              zipPath,
              ...(optionalString(request?.body?.expectedEntryId)
                ? {
                    expectedEntryId: optionalString(request?.body?.expectedEntryId),
                  }
                : {}),
              ...(optionalString(request?.body?.expectedContentHash)
                ? {
                    expectedContentHash: optionalString(request?.body?.expectedContentHash),
                  }
                : {}),
            },
            {
              ...getServiceContext(ctx),
              can: ctx.can,
            },
          );
        } finally {
          await fs.rm(zipPath, { force: true });
        }
      }),
      list: createClientAppResourceAction((ctx) => clientAppService.listClientApps(requireRepoId(ctx))),
      get: createClientAppResourceAction((ctx) => clientAppService.resolveClientApp(requireEntryId(ctx))),
      delete: createClientAppResourceAction(async (ctx) => {
        const entryId = requireEntryId(ctx);
        await deleteClientApp(entryId);
        return { entryId, deleted: true };
      }),
      listReferences: createClientAppResourceAction((ctx) => listClientAppReferences(requireEntryId(ctx))),
    },
  };
}

function createClientAppUploadMiddleware(): HandlerType {
  const storage = multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_request, _file, callback) => {
      callback(null, `nocobase-client-app-upload-${Date.now()}-${Math.random().toString(16).slice(2)}.zip`);
    },
  });
  const upload = multer({
    storage,
    limits: CLIENT_APP_UPLOAD_LIMITS,
  }).single('file');

  return async (ctx, next) => {
    if (ctx.action.actionName !== 'upload') {
      await next();
      return;
    }
    try {
      await upload(ctx, next);
    } catch (error) {
      await removeMultipartTemporaryFile(ctx);
      if (!isMulterLimitError(error)) {
        throw error;
      }
      const domainError = new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'Client app upload exceeds multipart limits',
        {
          status: 413,
          details: { category: 'client-app-upload', limitCode: error.code },
        },
      );
      ctx.withoutDataWrapping = true;
      ctx.type = 'application/json';
      ctx.status = domainError.status;
      ctx.body = domainError.toResponseBody();
    }
  };
}

async function removeMultipartTemporaryFile(ctx: unknown): Promise<void> {
  const context = toRecord(ctx);
  const candidates = [toRecord(context.request).file, context.file, toRecord(context.req).file];
  for (const candidate of candidates) {
    const filePath = toRecord(candidate).path;
    if (typeof filePath === 'string' && filePath) {
      await fs.rm(filePath, { force: true });
    }
  }
}

function isMulterLimitError(error: unknown): error is { name: 'MulterError'; code: string } {
  const record = toRecord(error);
  return record.name === 'MulterError' && typeof record.code === 'string' && record.code.startsWith('LIMIT_');
}

function createClientAppResourceAction(run: (ctx: LightExtensionResourceContext) => Promise<unknown>): HandlerType {
  return async (ctx: Context, next) => {
    const resourceContext = ctx as LightExtensionResourceContext;
    try {
      resourceContext.body = await run(resourceContext);
      await next();
    } catch (error) {
      if (!isLightExtensionError(error)) {
        throw error;
      }
      resourceContext.withoutDataWrapping = true;
      resourceContext.type = 'application/json';
      resourceContext.status = error.status;
      resourceContext.body = error.toResponseBody();
    }
  };
}

function requireRepoId(ctx: LightExtensionResourceContext, multipartBody?: Record<string, unknown>): string {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  return requireString(multipartBody?.repoId || values.repoId || params.repoId || params.filterByTk, 'repoId');
}

function requireEntryId(ctx: LightExtensionResourceContext): string {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  return requireString(values.entryId || params.entryId || params.filterByTk, 'entryId');
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw invalidInput(`${field} is required`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return;
  }
  return value.trim() || undefined;
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}
