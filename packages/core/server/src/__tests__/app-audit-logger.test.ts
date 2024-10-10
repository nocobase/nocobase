/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { AuditManager } from '../AuditManager';

describe('auditManager', () => {
  let auditManager: AuditManager;

  beforeEach(() => {
    auditManager = new AuditManager();
  });

  it('audit manager register action', () => {
    auditManager.registerAction('create');
    expect(auditManager.resources).toMatchInlineSnapshot(`
        Map {
          "create" => Map {
            "*" => "create",
          },
        }
      `);
  }),
    it('audit manager register actions', () => {
      auditManager.registerActions(['update', 'app:restart', 'pm:update']);

      expect(auditManager.resources).toMatchInlineSnapshot(`
      Map {
        "update" => Map {
          "*" => "update",
        },
        "restart" => Map {
          "app" => "restart",
        },
      }
    `);
    });
});
