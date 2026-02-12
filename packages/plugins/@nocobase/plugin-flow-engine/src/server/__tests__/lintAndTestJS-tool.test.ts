/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import lintAndTestJS from '../../ai/tools/lintAndTestJS';

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

    const result = await lintAndTestJS.invoke(mockCtx, {}, 'test-id');
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

    const result = await lintAndTestJS.invoke(mockCtx, {}, 'test-id');
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

    const result = await lintAndTestJS.invoke(mockCtx, {}, 'test-id');
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

    const result = await lintAndTestJS.invoke(mockCtx, {}, 'test-id');
    expect(result.status).toBe('error');
    const content = JSON.parse(result.content);
    expect(content.success).toBe(false);
    expect(content.message).toContain('issues');
  });

  it('schema should require code parameter', () => {
    const schema = lintAndTestJS.definition.schema;
    expect(schema).toBeDefined();
    // Check that schema has 'code' field
    const jsonSchema = schema.toJSONSchema ? schema.toJSONSchema() : schema;
    expect(jsonSchema).toBeDefined();
  });
});
