import {
  providerOf,
  type ModelCapabilities,
  type ModelKind,
  type ModelProviderName,
  type ModelReasoning,
  type ProviderCapabilitiesDefinition,
} from '../../shared/models.js';
import type { ModelConnection } from './providers.js';

type Level = ModelReasoning['levels'][number];
const OPENAI_FULL: readonly Level[] = [
  'off',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
];
const OPENAI_ALWAYS_ON: readonly Level[] = [
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
];
const CLAUDE_OFF_TO_XHIGH: readonly Level[] = [
  'off',
  'low',
  'medium',
  'high',
  'xhigh',
];
const CLAUDE_ALWAYS_ON: readonly Level[] = ['low', 'medium', 'high', 'xhigh'];
const DEEPSEEK: readonly Level[] = ['off', 'low', 'high', 'xhigh'];
const GEMINI_LOW_TO_HIGH: readonly Level[] = ['low', 'medium', 'high'];

/**
 * The thinking levels each provider's chat models take besides `default`, by exact model id: never guessed from a
 * name, and the same over any base URL. A level is listed only when the provider documents it for the model and the
 * provider's Vercel AI SDK package (`ai` 7) turns it into that model's own parameter; a model not listed takes only
 * `default`. An administrator may replace a model's levels (`ModelInput.reasoning`).
 *
 * Checked against the providers' documentation on 2026-11-13:
 * - OpenAI, https://developers.openai.com/api/docs/models/<id> and /api/docs/guides/reasoning: GPT-5.6 Terra and
 *   Luna, GPT-6 Sol and Luna take `none` to `max`; GPT-6 Astra answers `none` with a 400. The SDK passes the level on
 *   as `reasoning.effort`.
 * - Anthropic, https://platform.claude.com/docs/en/build-with-claude/effort: Opus 5.5 and Sonnet 5.5 cannot turn
 *   thinking off (the SDK sends effort `low` or `between_tools` for `none`); Opus 4.6 and Sonnet 4.6 have no `xhigh`.
 *   The SDK has no `max` for any Claude model, so none is listed.
 * - DeepSeek, https://api-docs.deepseek.com/guides/thinking_mode: thinking on or off and effort `high` or `max`;
 *   the SDK sends `low` and `high` as they are and `xhigh` as `max`, and folds `medium` into `high`.
 * - Qwen, https://www.alibabacloud.com/help/en/model-studio/deep-thinking: `enable_thinking` turns thinking off.
 *   The SDK maps other levels to a `thinking_budget` of at most 16,384 tokens, below these models' own default, so
 *   only `off` is listed.
 * - Gemini, https://ai.google.dev/gemini-api/docs/generate-content/thinking: Gemini 3 and later cannot turn thinking
 *   off and take the `thinkingLevel`s listed; Gemini 2.5 Flash and Flash-Lite turn it off with a budget of 0 (Gemini
 *   2.5 Pro cannot). Check 2.5 Flash again after Google's announced routing change of 2026-12-01.
 */
const REASONING: Partial<
  Record<ModelProviderName, Readonly<Record<string, readonly Level[]>>>
> = {
  openai: {
    'gpt-5.6-terra': OPENAI_FULL,
    'gpt-5.6-luna': OPENAI_FULL,
    'gpt-6-sol': OPENAI_FULL,
    'gpt-6-luna': OPENAI_FULL,
    'gpt-6-astra': OPENAI_ALWAYS_ON,
  },
  anthropic: {
    'claude-opus-5-5': CLAUDE_ALWAYS_ON,
    'claude-sonnet-5-5': CLAUDE_ALWAYS_ON,
    'claude-opus-5': CLAUDE_OFF_TO_XHIGH,
    'claude-sonnet-5': CLAUDE_OFF_TO_XHIGH,
    'claude-opus-4-8': CLAUDE_OFF_TO_XHIGH,
    'claude-opus-4-7': CLAUDE_OFF_TO_XHIGH,
    'claude-opus-4-6': ['off', 'low', 'medium', 'high'],
    'claude-sonnet-4-6': ['off', 'low', 'medium', 'high'],
  },
  deepseek: {
    'deepseek-flash': DEEPSEEK,
    'deepseek-v4-pro': DEEPSEEK,
  },
  alibaba: Object.fromEntries(
    [
      'qwen3.8-max',
      'qwen3.8-flash',
      'qwen3.7-max',
      'qwen3.7-plus',
      'qwen3.7-flash',
      'qwen3.6-plus',
      'qwen3.6-flash',
      'qwen-plus',
      'qwen-flash',
    ].map((id) => [id, ['off'] as const]),
  ),
  google: {
    'gemini-4-carbon': GEMINI_LOW_TO_HIGH,
    'gemini-4-argon': GEMINI_LOW_TO_HIGH,
    'gemini-4-hydrogen': GEMINI_LOW_TO_HIGH,
    'gemini-3.8-flash': GEMINI_LOW_TO_HIGH,
    'gemini-3.1-pro-preview': GEMINI_LOW_TO_HIGH,
    'gemini-3.6-flash': ['minimal', 'low', 'medium', 'high'],
    'gemini-3-flash-preview': ['minimal', 'low', 'medium', 'high'],
    'gemini-3-pro-preview': ['low', 'high'],
    'gemini-2.5-flash': ['off'],
    'gemini-2.5-flash-lite': ['off'],
  },
};

/** The built-in thinking levels of a provider's chat model; undefined when it takes only `default`. */
export function builtinReasoning(
  provider: ModelProviderName,
  model: string,
): ModelReasoning | undefined {
  const table = REASONING[provider];
  const levels =
    table && Object.hasOwn(table, model) ? table[model] : undefined;
  return levels ? { levels: [...levels] } : undefined;
}

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
    defaults: { webSearch: true },
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
      (url.pathname.replace(/\/+$/u, '') ===
        expected.pathname.replace(/\/+$/u, '') ||
        (connection.provider === 'deepseek' &&
          url.pathname.replace(/\/+$/u, '') === '/v1')) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

/**
 * A model's capabilities over a connection. Web search and image input need the provider's official endpoint; the
 * thinking levels do not: `reasoning` is the administrator's (`false` for none) when set, else the built-in ones.
 */
export function resolveModelCapabilities(
  connection: Pick<ModelConnection, 'provider' | 'baseUrl'>,
  model: string,
  kind: ModelKind = 'chat',
  reasoning?: false | ModelReasoning,
): ModelCapabilities {
  const capabilities = endpointCapabilities(connection, model, kind);
  if (kind !== 'chat') return capabilities;
  const levels =
    reasoning === undefined
      ? builtinReasoning(connection.provider, model)
      : reasoning || undefined;
  return levels
    ? { ...capabilities, reasoning: { levels: [...levels.levels] } }
    : capabilities;
}

function endpointCapabilities(
  connection: Pick<ModelConnection, 'provider' | 'baseUrl'>,
  model: string,
  kind: ModelKind,
): ModelCapabilities {
  const definition = definitions[connection.provider];
  if (kind !== 'chat' || !definition || !officialSearchEndpoint(connection)) {
    return { webSearch: false };
  }
  const capabilities = mergeModelCapabilities(definition, model);
  // Search's documented /v1 alias does not expand separately verified image admission.
  if (
    connection.provider === 'deepseek' &&
    connection.baseUrl &&
    new URL(connection.baseUrl).pathname.replace(/\/+$/u, '') === '/v1'
  )
    return { webSearch: capabilities.webSearch };
  return capabilities;
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
