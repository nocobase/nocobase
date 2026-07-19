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
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

describe('plugin-light-extension workspace compiler import/security denials', () => {
  let bridge: LightExtensionWorkspaceCompilerBridge;
  let recordCompileEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const auditService = new LightExtensionAuditService({} as Database);
    recordCompileEvent = vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const permissionService = new LightExtensionPermissionService(auditService);
    bridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
  });

  it.each([
    {
      name: 'dynamic import',
      source: "const mod = await import('./secret');\nctx.render(<div>{mod}</div>);\n",
      expectedCode: 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED',
      expectedReason: 'unsafe_import_denied',
    },
    {
      name: 'require fs',
      source: "const fs = require('fs');\nctx.render(<div>{String(fs)}</div>);\n",
      expectedCode: 'RUNJS_IMPORT_NOT_ALLOWED',
      expectedReason: 'unsafe_import_denied',
    },
    {
      name: 'unsupported package import',
      source: "import moduleValue from 'unsupported-package';\nctx.render(<div>{String(moduleValue)}</div>);\n",
      expectedCode: 'RUNJS_IMPORT_NOT_ALLOWED',
      expectedReason: 'unsafe_import_denied',
    },
    {
      name: 'unknown process global',
      source: 'const value = process.env.NODE_ENV;\nctx.render(<div>{value}</div>);\n',
      expectedRuleId: 'runjs-global-unknown',
      expectedReason: 'compile_failed',
    },
  ])('rejects $name without storing source in audit logs', async (caseItem) => {
    const requestId = `req_${caseItem.name.replace(/\s+/g, '_')}`;
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_security',
        kind: 'js-block',
        entryName: 'security-negative',
        entryPath: 'src/client/js-blocks/security-negative/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/security-negative/index.tsx',
            content: `${caseItem.source}\nconst secret = 'secret-code';\n`,
          },
          {
            path: 'src/client/js-blocks/security-negative/settings.json',
            content: '{"secret":"secret-settings"}',
          },
        ],
      },
      {
        requestId,
      },
    );

    expect(result.accepted).toBe(false);
    if (caseItem.expectedCode) {
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: caseItem.expectedCode,
          }),
        ]),
      );
    }
    if (caseItem.expectedRuleId) {
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            details: expect.objectContaining({
              ruleId: caseItem.expectedRuleId,
            }),
          }),
        ]),
      );
    }

    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'blocked',
        reasonCode: caseItem.expectedReason,
        requestId,
      }),
    );
    const auditPayload = recordCompileEvent.mock.calls[0][0];
    expect(JSON.stringify(auditPayload)).not.toContain('secret-code');
    expect(JSON.stringify(auditPayload)).not.toContain('secret-settings');
    expect(JSON.stringify(auditPayload)).not.toContain('sourceMap');
  });

  it.each([
    {
      name: 'Function constructor',
      source: 'const value = Function("return 1")();\nctx.render(<div>{value}</div>);\n',
    },
    {
      name: 'eval call',
      source: 'const value = eval("1");\nctx.render(<div>{value}</div>);\n',
    },
  ])('allows $name as a normal RunJS global', async (caseItem) => {
    const requestId = `req_allow_${caseItem.name.replace(/\s+/g, '_')}`;
    const result = await bridge.compileEntry(
      {
        repoId: 'ler_security',
        kind: 'js-block',
        entryName: 'security-allowed',
        entryPath: 'src/client/js-blocks/security-allowed/index.tsx',
        files: [
          {
            path: 'src/client/js-blocks/security-allowed/index.tsx',
            content: caseItem.source,
          },
        ],
      },
      {
        requestId,
      },
    );

    expect(result.accepted).toBe(true);
    expect(result.diagnostics.some((diagnostic) => diagnostic.severity === 'error')).toBe(false);
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'success',
        reasonCode: undefined,
        requestId,
      }),
    );
  });
});
