// @vitest-environment node
import { createDriveManager } from '@nocobase/drive';
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  generateApiDocument,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { uploadLimitRoutes } from '../server/upload-limit.routes.js';

it('publishes only disk names and limits, without authentication or storage secrets', async () => {
  const container = new ServiceContainer();
  container.instance(
    driveManagerToken,
    createDriveManager({
      default: 'remote',
      disks: {
        local: {
          driver: 'fs',
          location: '/private/location',
          visibility: 'private',
        },
        remote: {
          driver: 's3',
          bucket: 'private-bucket',
          region: 'auto',
          credentials: {
            accessKeyId: 'synthetic-id',
            secretAccessKey: 'synthetic-secret',
          },
          visibility: 'private',
          maxFileSizeMb: 50,
        },
      },
    }),
  );
  const router = await uploadLimitRoutes.createRouter({
    container,
  } as AppPluginApplication);
  const response = await router.request('/file/uploadLimits');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    data: {
      default: 'remote',
      disks: {
        local: { disk: 'local', maxFileSizeMb: 20, maxBytes: 20 * 1024 * 1024 },
        remote: {
          disk: 'remote',
          maxFileSizeMb: 50,
          maxBytes: 50 * 1024 * 1024,
        },
      },
    },
  });
  const doc = await generateApiDocument(router, {
    info: { title: 'File', version: 'test' },
  });
  expect(findApiDocumentSchemaProblems(doc)).toEqual([]);
  expect(doc.paths?.['/api/file/uploadLimits']?.get?.operationId).toBe(
    'fileUploadLimits',
  );
});
