import { z } from 'zod';
import type { ModelRef } from '../../../shared/models.js';
import { baseUrlOf, type ModelConnection } from '../providers.js';
import { invalid } from '../../kernel/errors.js';
import type {
  FileInputProfile,
  FileInputsConfig,
  ModelInputProtocol,
} from './types.js';

const protocols: Readonly<
  Record<ModelConnection['provider'], ModelInputProtocol>
> = {
  openai: 'responses',
  anthropic: 'messages',
  google: 'generate-content',
  deepseek: 'chat-completions',
  alibaba: 'chat-completions',
  moonshotai: 'chat-completions',
  'openai-compatible': 'chat-completions',
  ollama: 'ollama-chat',
  cohere: 'cohere-chat',
};
const profileSchema = z
  .object({
    modelService: z.string().min(1),
    model: z.string().min(1),
    provider: z.enum([
      'openai',
      'anthropic',
      'google',
      'deepseek',
      'alibaba',
      'moonshotai',
      'openai-compatible',
      'ollama',
      'cohere',
    ]),
    protocol: z.enum([
      'responses',
      'messages',
      'generate-content',
      'chat-completions',
      'ollama-chat',
      'cohere-chat',
    ]),
    baseUrl: z.url().refine((value) => {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    }),
    nativeMediaTypes: z.array(
      z
        .string()
        .regex(/^(?:[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+|image\/\*)$/u),
    ),
    maxNativeFiles: z.number().int().min(0).max(100).optional(),
    extraction: z.enum(['local', 'kimi-file-extract']),
  })
  .strict();
const normalizeBase = (base: string) => base.replace(/\/+$/u, '');

export class FileInputProfiles {
  private readonly profiles: readonly FileInputProfile[];
  constructor(config: FileInputsConfig = {}) {
    const parsed = z
      .object({ profiles: z.array(profileSchema).default([]) })
      .strict()
      .safeParse(config);
    if (!parsed.success)
      throw invalid('Invalid agents.fileInputs configuration.');
    this.profiles = parsed.data.profiles;
    const identities = this.profiles.map((profile) =>
      JSON.stringify([profile.modelService, profile.model]),
    );
    if (new Set(identities).size !== identities.length)
      throw invalid('Duplicate model identity in agents.fileInputs profiles.');
    for (const profile of this.profiles)
      if (
        profile.extraction === 'kimi-file-extract' &&
        !['moonshotai', 'openai-compatible'].includes(profile.provider)
      )
        throw invalid(
          'Kimi file extraction requires a Moonshot or explicitly compatible chat service.',
        );
    for (const profile of this.profiles)
      if (protocols[profile.provider] !== profile.protocol)
        throw invalid(
          'A file input profile does not match its Provider API protocol.',
        );
  }
  resolve(
    ref: ModelRef,
    connection: ModelConnection,
  ): {
    readonly nativeMediaTypes: readonly string[];
    readonly maxNativeFiles: number;
    readonly extraction: FileInputProfile['extraction'];
  } {
    const profile = this.profiles.find(
      (item) =>
        item.modelService === ref.modelService && item.model === ref.model,
    );
    if (!profile) {
      // Legacy routing is a forwarding policy, not a claim that every model accepts these inputs.
      switch (connection.provider) {
        case 'openai':
        case 'anthropic':
        case 'google':
        case 'openai-compatible':
          return {
            nativeMediaTypes: ['image/*', 'application/pdf'],
            maxNativeFiles: 100,
            extraction: 'local',
          };
        case 'ollama':
        case 'alibaba':
        case 'moonshotai':
          return {
            nativeMediaTypes: ['image/*'],
            maxNativeFiles: 100,
            extraction:
              connection.provider === 'moonshotai'
                ? 'kimi-file-extract'
                : 'local',
          };
        case 'deepseek':
        case 'cohere':
          return {
            nativeMediaTypes: [],
            maxNativeFiles: 100,
            extraction: 'local',
          };
      }
    }
    if (
      profile.provider !== connection.provider ||
      profile.protocol !== protocols[connection.provider] ||
      normalizeBase(profile.baseUrl) !==
        normalizeBase(baseUrlOf(connection) ?? '')
    )
      throw invalid(
        'The file input profile no longer matches the selected model connection.',
      );
    return {
      nativeMediaTypes: [...profile.nativeMediaTypes],
      maxNativeFiles: profile.maxNativeFiles ?? 100,
      extraction: profile.extraction,
    };
  }
}
