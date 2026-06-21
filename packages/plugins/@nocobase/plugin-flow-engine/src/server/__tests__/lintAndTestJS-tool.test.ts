/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import lintAndTestJS from '../../ai/ai-employees/nathan/skills/frontend-developer/tools/lintAndTestJS';
import patchJSCode from '../../ai/ai-employees/nathan/skills/frontend-developer/tools/patchJSCode';
import readJSCode from '../../ai/ai-employees/nathan/skills/frontend-developer/tools/readJSCode';
import writeJSCode from '../../ai/ai-employees/nathan/skills/frontend-developer/tools/writeJSCode';

describe('lintAndTestJS Tool', () => {
  it('should have correct tool metadata', () => {
    expect(lintAndTestJS.definition.name).toBe('lintAndTestJS');
    expect(lintAndTestJS.execution).toBe('frontend');
    expect(lintAndTestJS.definition.schema).toBeDefined();
  });

  it('should return error when toolCallResults is missing', async () => {
    const mockCtx = {
      action: {
        params: {
          values: {},
        },
      },
    } as any;

    const result = await lintAndTestJS.invoke(mockCtx, {}, { toolCallId: 'test-id' });
    expect(result.status).toBe('error');
    const content = JSON.parse(result.content);
    expect(content.success).toBe(false);
    expect(content.message).toContain('no result returned');
  });

  it('should return error when result not found for id', async () => {
    const mockCtx = {
      action: {
        params: {
          values: {
            toolCallResults: [{ id: 'other-id', result: { status: 'success', content: { success: true } } }],
          },
        },
      },
    } as any;

    const result = await lintAndTestJS.invoke(mockCtx, {}, { toolCallId: 'test-id' });
    expect(result.status).toBe('error');
    const content = JSON.parse(result.content);
    expect(content.success).toBe(false);
  });

  it('should return success status when result.success is true', async () => {
    const mockCtx = {
      action: {
        params: {
          values: {
            toolCallResults: [
              {
                id: 'test-id',
                result: {
                  status: 'success',
                  content: {
                    success: true,
                    message: 'RunJS preview succeeded: no issues found.',
                  },
                },
              },
            ],
          },
        },
      },
    } as any;

    const result = await lintAndTestJS.invoke(mockCtx, {}, { toolCallId: 'test-id' });
    expect(result.status).toBe('success');
    const content = JSON.parse(result.content);
    expect(content.success).toBe(true);
  });

  it('should return error status when result.success is false', async () => {
    const mockCtx = {
      action: {
        params: {
          values: {
            toolCallResults: [
              {
                id: 'test-id',
                result: {
                  status: 'error',
                  content: {
                    success: false,
                    message: 'RunJS preview failed: 2 issues (lint 1 / runtime 1)',
                  },
                },
              },
            ],
          },
        },
      },
    } as any;

    const result = await lintAndTestJS.invoke(mockCtx, {}, { toolCallId: 'test-id' });
    expect(result.status).toBe('error');
    const content = JSON.parse(result.content);
    expect(content.success).toBe(false);
    expect(content.message).toContain('issues');
  });

  it('schema should allow omitting code parameter', () => {
    const schema = lintAndTestJS.definition.schema;
    expect(schema).toBeDefined();
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ code: 'return 1;' }).success).toBe(true);
    const jsonSchema = schema.toJSONSchema ? schema.toJSONSchema() : schema;
    expect(jsonSchema).toBeDefined();
  });
});

describe('Nathan editor code tools', () => {
  it('readJSCode should have correct metadata', () => {
    expect(readJSCode.definition.name).toBe('readJSCode');
    expect(readJSCode.execution).toBe('frontend');
    expect(readJSCode.definition.schema.safeParse({}).success).toBe(true);
  });

  it('writeJSCode should have correct metadata', () => {
    expect(writeJSCode.definition.name).toBe('writeJSCode');
    expect(writeJSCode.execution).toBe('frontend');
    expect(writeJSCode.definition.schema.safeParse({ code: 'return 1;' }).success).toBe(true);
  });

  it('patchJSCode should have correct metadata', () => {
    expect(patchJSCode.definition.name).toBe('patchJSCode');
    expect(patchJSCode.execution).toBe('frontend');
    expect(
      patchJSCode.definition.schema.safeParse({
        patch: '@@ -1 +1 @@\n-return 1;\n+return 2;\n',
        baseHash: 'fnv1a:00000000',
      }).success,
    ).toBe(true);
  });

  it('readJSCode should return frontend result by toolCallId', async () => {
    const mockCtx = {
      action: {
        params: {
          values: {
            toolCallResults: [
              {
                id: 'read-id',
                result: {
                  status: 'success',
                  content: { success: true, code: 'return 1;', lineCount: 1 },
                },
              },
            ],
          },
        },
      },
    } as any;

    const result = await readJSCode.invoke(mockCtx, {}, { toolCallId: 'read-id' });
    expect(result.status).toBe('success');
    expect(JSON.parse(result.content).code).toBe('return 1;');
  });

  it('writeJSCode should return frontend result by toolCallId', async () => {
    const mockCtx = {
      action: {
        params: {
          values: {
            toolCallResults: [
              {
                id: 'write-id',
                result: {
                  status: 'success',
                  content: { success: true, hash: 'fnv1a:12345678' },
                },
              },
            ],
          },
        },
      },
    } as any;

    const result = await writeJSCode.invoke(mockCtx, {}, { toolCallId: 'write-id' });
    expect(result.status).toBe('success');
    expect(JSON.parse(result.content).hash).toBe('fnv1a:12345678');
  });

  it('patchJSCode should return frontend result by toolCallId', async () => {
    const mockCtx = {
      action: {
        params: {
          values: {
            toolCallResults: [
              {
                id: 'patch-id',
                result: {
                  status: 'success',
                  content: { success: true, hash: 'fnv1a:87654321' },
                },
              },
            ],
          },
        },
      },
    } as any;

    const result = await patchJSCode.invoke(mockCtx, {}, { toolCallId: 'patch-id' });
    expect(result.status).toBe('success');
    expect(JSON.parse(result.content).hash).toBe('fnv1a:87654321');
  });
});
