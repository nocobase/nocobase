import { describe, expect, it } from 'vitest';
import { FileInputProfiles } from '../server/online/files/profiles.js';
import type { FileInputProfile } from '../server/online/files/types.js';
import type { ModelConnection } from '../server/online/providers.js';

const ref = { modelService: 'legacy-service', model: 'custom-model' };
const connection = (
  provider: ModelConnection['provider'],
): ModelConnection => ({
  provider,
  baseUrl: 'https://fixture.invalid/v1',
  apiKey: 'fixture-key',
});

describe('legacy Provider file defaults', () => {
  it.each([
    ['openai', ['image/*', 'application/pdf'], 'local'],
    ['anthropic', ['image/*', 'application/pdf'], 'local'],
    ['google', ['image/*', 'application/pdf'], 'local'],
    ['openai-compatible', ['image/*', 'application/pdf'], 'local'],
    ['ollama', ['image/*'], 'local'],
    ['alibaba', ['image/*'], 'local'],
    ['moonshotai', ['image/*'], 'kimi-file-extract'],
    ['deepseek', [], 'local'],
    ['cohere', [], 'local'],
  ] as const)(
    '%s selects the legacy route without a model profile',
    (provider, nativeMediaTypes, extraction) => {
      expect(
        new FileInputProfiles().resolve(ref, connection(provider)),
      ).toEqual({
        nativeMediaTypes,
        extraction,
        maxNativeFiles: 100,
      });
    },
  );

  it.each([undefined, { profiles: [] }])(
    'uses the shared exact DeepSeek capability with configuration %j',
    (config) => {
      expect(
        new FileInputProfiles(config).resolve(
          { modelService: 'renamed-service', model: 'deepseek-flash' },
          { provider: 'deepseek', baseUrl: null, apiKey: 'fixture-key' },
        ),
      ).toEqual({
        nativeMediaTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        extraction: 'local',
        maxNativeFiles: 100,
      });
    },
  );

  it('keeps the explicit custom image profile and fail-closed connection checks', () => {
    const profile: FileInputProfile = {
      ...ref,
      provider: 'deepseek',
      protocol: 'chat-completions',
      baseUrl: 'https://fixture.invalid/v1',
      nativeMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      extraction: 'local',
    };
    const profiles = new FileInputProfiles({ profiles: [profile] });
    expect(
      profiles.resolve(ref, connection('deepseek')).nativeMediaTypes,
    ).toEqual(profile.nativeMediaTypes);
    expect(
      profiles.resolve({ ...ref, model: 'another' }, connection('deepseek'))
        .nativeMediaTypes,
    ).toEqual([]);
    expect(() =>
      profiles.resolve(ref, {
        ...connection('deepseek'),
        baseUrl: 'https://changed.invalid/v1',
      }),
    ).toThrow('no longer matches');
  });

  it('lets an exact profile disable Moonshot remote extraction and native images', () => {
    const profiles = new FileInputProfiles({
      profiles: [
        {
          ...ref,
          provider: 'moonshotai',
          protocol: 'chat-completions',
          baseUrl: 'https://fixture.invalid/v1',
          nativeMediaTypes: [],
          extraction: 'local',
          maxNativeFiles: 0,
        },
      ],
    });
    expect(profiles.resolve(ref, connection('moonshotai'))).toEqual({
      nativeMediaTypes: [],
      extraction: 'local',
      maxNativeFiles: 0,
    });
    expect(
      profiles.resolve({ ...ref, model: 'another' }, connection('moonshotai'))
        .extraction,
    ).toBe('kimi-file-extract');
  });
});
