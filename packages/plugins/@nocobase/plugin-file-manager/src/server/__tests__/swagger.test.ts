/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import swaggerDocument from '../../swagger/index.json';

describe('file manager swagger', () => {
  it('documents storage CRUD, upload discovery, and file collection creation actions', () => {
    expect(swaggerDocument.openapi).toBe('3.0.2');
    expect(Object.keys(swaggerDocument.paths).sort()).toEqual(
      [
        '/storages:check',
        '/storages:create',
        '/storages:destroy',
        '/storages:get',
        '/storages:getBasicInfo',
        '/storages:list',
        '/storages:update',
        '/{fileCollectionName}:create',
      ].sort(),
    );
  });

  it('exposes actionable storage request fields and protects credential metadata', () => {
    const schemas = swaggerDocument.components.schemas;
    expect(schemas.StorageCreate.allOf[1].required).toEqual(['title', 'name', 'type']);
    expect(schemas.StorageWriteFields.properties.renameMode.enum).toEqual(['appendRandomID', 'random', 'none']);
    expect(schemas.StorageOptions.properties.secretAccessKey.writeOnly).toBe(true);
    expect(schemas.StorageOptions.properties.accessKeySecret.writeOnly).toBe(true);
    expect(schemas.StorageOptions.properties.SecretKey.writeOnly).toBe(true);
  });

  it('documents both multipart upload and direct-upload record finalization', () => {
    const operation = swaggerDocument.paths['/{fileCollectionName}:create'].post;
    expect(operation.requestBody.content['multipart/form-data'].schema.$ref).toContain('FileUploadRequest');
    expect(operation.requestBody.content['application/json'].schema.$ref).toContain('FileRecordCreate');
    expect(operation.description).toContain('dedicated file collection');
    expect(swaggerDocument.components.parameters.AttachmentField.deprecated).toBe(true);
  });

  it('keeps upload-safe storage discovery separate from credential-bearing records', () => {
    const safeFields = swaggerDocument.components.schemas.StorageBasicInfo.properties;
    expect(safeFields.options).toBeUndefined();
    expect(safeFields.rules).toBeDefined();
    expect(swaggerDocument.paths['/storages:getBasicInfo'].get.description).toContain('does not expose credentials');
  });
});
