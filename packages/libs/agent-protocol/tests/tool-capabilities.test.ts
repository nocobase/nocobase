import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  MAX_TOOL_MODELS,
  MAX_MODEL_ID_LENGTH,
  MAX_MODEL_EFFORTS,
  MAX_EFFORT_LENGTH,
  ToolInfoSchema,
  PROTOCOL_VERSION,
} from '../src/index.js';

const legacy = { kind: 'pi', authenticated: true };
const capabilities = {
  ...legacy,
  models: [
    { id: 'gpt-6-sol', efforts: ['high'], config: { secret: 'never sent' } },
  ],
  modelsDetectedAt: '2026-10-09T10:00:00.000Z',
  modelsDetectionStatus: 'detected',
};

describe('tool capabilities within protocol 7', () => {
  it('accepts legacy tools and lets legacy receivers strip the optional additions', () => {
    expect(PROTOCOL_VERSION).toBe(7);
    expect(ToolInfoSchema.parse(legacy)).toEqual(legacy);
    expect(
      z
        .object({ kind: z.string(), authenticated: z.boolean() })
        .parse(capabilities),
    ).toEqual(legacy);
    expect(ToolInfoSchema.parse(capabilities).models).toEqual([
      { id: 'gpt-6-sol', efforts: ['high'] },
    ]);
  });
  it('allows unsupported, failed and unknown effort information', () => {
    expect(
      ToolInfoSchema.parse({ ...legacy, modelsDetectionStatus: 'unsupported' })
        .models,
    ).toBeUndefined();
    expect(
      ToolInfoSchema.parse({ ...legacy, models: [{ id: 'gpt-6-sol' }] })
        .models?.[0]?.efforts,
    ).toBeUndefined();
    expect(
      ToolInfoSchema.safeParse({
        ...legacy,
        modelsDetectionStatus: 'failed',
        modelsDetectionError: 'Model detection failed',
      }).success,
    ).toBe(true);
  });
  it.each([
    {
      models: Array.from({ length: MAX_TOOL_MODELS + 1 }, () => ({
        id: 'model',
      })),
    },
    { models: [{ id: 'x'.repeat(MAX_MODEL_ID_LENGTH + 1) }] },
    {
      models: [
        {
          id: 'model',
          efforts: Array.from({ length: MAX_MODEL_EFFORTS + 1 }, () => 'high'),
        },
      ],
    },
    { models: [{ id: 'model', efforts: ['x'.repeat(MAX_EFFORT_LENGTH + 1)] }] },
    { models: [{ id: 'https://secret.example/model' }] },
    { models: [{ id: 'sk-1' + 'x'.repeat(48) }] },
    { modelsDetectedAt: 'yesterday' },
    { modelsDetectionStatus: 'broken' },
    { modelsDetectionError: '/home/private/config: token=secret' },
  ])('rejects unsafe or unbounded capability input %j', (extra) => {
    expect(ToolInfoSchema.safeParse({ ...legacy, ...extra }).success).toBe(
      false,
    );
  });
});
