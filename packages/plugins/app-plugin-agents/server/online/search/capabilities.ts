import {
  providerOf,
  type ModelCapabilities,
  type ModelKind,
  type ModelProviderName,
  type ProviderCapabilitiesDefinition,
} from '../../../shared/models.js';
import type { ModelConnection } from '../providers.js';

/** Admission is code-owned, never a user-editable service setting or a model-name heuristic. */
const definitions: Partial<
  Record<ModelProviderName, ProviderCapabilitiesDefinition>
> = {
  alibaba: {
    defaults: { webSearch: true },
    models: {},
  },
  anthropic: {
    defaults: { webSearch: true },
    models: {},
  },
  deepseek: {
    defaults: { webSearch: false },
    models: {
      // Verified against https://api-docs.deepseek.com/zh-cn/guides/vision on 2026-10-23.
      'deepseek-flash': {
        imageMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      },
    },
  },
  google: {
    defaults: { webSearch: true },
    models: {},
  },
  openai: {
    defaults: { webSearch: true },
    models: {},
  },
};

export function mergeModelCapabilities(
  definition: ProviderCapabilitiesDefinition,
  model: string,
): ModelCapabilities {
  const capabilities = {
    ...definition.defaults,
    ...(Object.hasOwn(definition.models, model)
      ? definition.models[model]
      : {}),
  };
  return capabilities.imageMediaTypes
    ? { ...capabilities, imageMediaTypes: [...capabilities.imageMediaTypes] }
    : capabilities;
}

export function officialSearchEndpoint(
  connection: Pick<ModelConnection, 'provider' | 'baseUrl'>,
): boolean {
  const official = providerOf(connection.provider)?.defaultBaseUrl;
  if (!official) return false;
  if (!connection.baseUrl) return true;
  try {
    const url = new URL(connection.baseUrl);
    if (connection.provider === 'alibaba') {
      const host = url.hostname;
      const officialHost =
        [
          'dashscope.aliyuncs.com',
          'dashscope-intl.aliyuncs.com',
          'cn-hongkong.dashscope.aliyuncs.com',
        ].includes(host) ||
        /^[a-z0-9-]+\.(?:cn-beijing|ap-southeast-1|cn-hongkong)\.maas\.aliyuncs\.com$/u.test(
          host,
        );
      return (
        officialHost &&
        url.protocol === 'https:' &&
        !url.port &&
        url.pathname.replace(/\/+$/u, '') === '/compatible-mode/v1' &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    }
    const expected = new URL(official);
    return (
      url.origin === expected.origin &&
      url.pathname.replace(/\/+$/u, '') ===
        expected.pathname.replace(/\/+$/u, '') &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function resolveModelCapabilities(
  connection: Pick<ModelConnection, 'provider' | 'baseUrl'>,
  model: string,
  kind: ModelKind = 'chat',
): ModelCapabilities {
  const definition = definitions[connection.provider];
  if (kind !== 'chat' || !definition || !officialSearchEndpoint(connection)) {
    return { webSearch: false };
  }
  return mergeModelCapabilities(definition, model);
}

export function supportsOpenAISearch(
  connection: Pick<ModelConnection, 'provider' | 'baseUrl'>,
  model: string,
): boolean {
  return (
    connection.provider === 'openai' &&
    resolveModelCapabilities(connection, model).webSearch
  );
}
