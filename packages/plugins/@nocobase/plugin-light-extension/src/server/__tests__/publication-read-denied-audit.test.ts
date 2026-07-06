/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { vi } from 'vitest';

import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationResolveService } from '../services/LightExtensionPublicationResolveService';

describe('plugin-light-extension publication read denied audit', () => {
  it('records denied readPublication attempts without artifact code, source maps, or settings payloads', async () => {
    const db = {
      getRepository: () => ({
        findOne: vi.fn(),
      }),
    } as unknown as Database;
    const auditService = new LightExtensionAuditService(db);
    const recordPublicationReadDenied = vi
      .spyOn(auditService, 'recordPublicationReadDenied')
      .mockResolvedValue(undefined);
    const permissionService = new LightExtensionPermissionService(auditService);
    const service = new LightExtensionPublicationResolveService(db, auditService, permissionService);

    await expect(
      service.getMetadata('lep_secret', {
        actorUserId: '2',
        requestId: 'req_publication_denied',
        requestSource: 'unit-denied',
        can: () => null,
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
      status: 403,
    });

    expect(recordPublicationReadDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        publicationId: 'lep_secret',
        requestId: 'req_publication_denied',
        actorUserId: '2',
        reasonCode: 'LIGHT_EXTENSION_PERMISSION_DENIED',
        requestSource: 'unit-denied',
      }),
    );
    expect(JSON.stringify(recordPublicationReadDenied.mock.calls)).not.toContain('artifact');
    expect(JSON.stringify(recordPublicationReadDenied.mock.calls)).not.toContain('sourceMap');
    expect(JSON.stringify(recordPublicationReadDenied.mock.calls)).not.toContain('settingsSchemaSnapshot');
    expect(JSON.stringify(recordPublicationReadDenied.mock.calls)).not.toContain('settingsDefaultsSnapshot');
  });
});
