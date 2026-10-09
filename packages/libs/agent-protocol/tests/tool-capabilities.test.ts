import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  MAX_TOOL_MODELS,
  MAX_MODEL_ID_LENGTH,
  MAX_MODEL_EFFORTS,
  MAX_EFFORT_LENGTH,
  ToolInfoSchema,
  ReportedToolInfoSchema,
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
  it('accepts versioned model identifiers in both outgoing and reported capabilities', () => {
    const tool = {
      ...legacy,
      models: [{ id: 'claude-sonnet-4@20250514' }],
    };
    expect(ToolInfoSchema.parse(tool).models).toEqual(tool.models);
    expect(ReportedToolInfoSchema.parse(tool).models).toEqual(tool.models);
  });

  it('discards invalid advisory fields while retaining valid models and strict base fields', () => {
    const tool = {
      ...legacy,
      models: [
        null,
        { id: 'https://private.example/model' },
        { id: 'sk-1' + 'x'.repeat(48) },
        { id: 'model', efforts: ['bad effort'] },
        { id: 'gpt-6-sol', config: { token: 'must-be-stripped' } },
      ],
      modelsDetectedAt: 'yesterday',
      modelsDetectionStatus: 'future-status',
      modelsDetectionError: 'future-error',
    };
    expect(ReportedToolInfoSchema.parse(tool)).toEqual({
      ...legacy,
      models: [{ id: 'gpt-6-sol' }],
    });
    expect(ToolInfoSchema.safeParse(tool).success).toBe(false);
    expect(
      ReportedToolInfoSchema.safeParse({ ...tool, authenticated: 'yes' })
        .success,
    ).toBe(false);
    expect(
      ReportedToolInfoSchema.safeParse({ ...tool, kind: 'unknown-tool' })
        .success,
    ).toBe(false);
  });

  it('bounds received suggestions and ignores malformed capability containers', () => {
    expect(
      ReportedToolInfoSchema.parse({
        ...legacy,
        models: Array.from({ length: MAX_TOOL_MODELS + 1 }, (_, n) => ({
          id: `model${n}`,
        })),
      }).models,
    ).toHaveLength(MAX_TOOL_MODELS);
    expect(
      ReportedToolInfoSchema.parse({ ...legacy, models: 'invalid' }).models,
    ).toBeUndefined();
    expect(ReportedToolInfoSchema.parse(legacy)).toEqual(legacy);
  });

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
