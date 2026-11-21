/**
 * The models agents are named after. Runners report each coding tool's models by the ids the tool lists them under;
 * the server keeps one agent per tool and model (`agents.ts`), so the same model reported under two spellings has to
 * become one agent: `normalizeModel` turns what a runner reports into the id the agent keeps, and `agentNameOf` names
 * it, such as "Claude · Opus 5.5" for Claude Code's `claude-opus-5-5`.
 *
 * The catalog ships with the plugin. A model it does not know still becomes an agent, named after its id, with nothing
 * suggested for what it is good at. Keep it to the models the tools offer today, checked against the same lists as
 * `TOOL_MODEL_SUGGESTIONS` in `@nocobase/agent-protocol`; a model leaving it only loses its suggestion and its label.
 */
import { isNativeTool, type AgentTool } from '@nocobase/agent-protocol';
import { AGENTS } from '@nocobase/acp-bridge/catalog';

/** A coding tool as agent names show it. */
export const TOOL_LABELS: Readonly<Record<AgentTool, string>> = {
  ...(Object.fromEntries(
    AGENTS.map((agent) => [agent.id, agent.name]),
  ) as Record<AgentTool, string>),
  claude: 'Claude',
  codex: 'Codex',
  opencode: 'OpenCode',
  pi: 'Pi',
};

/** Product names used outside the shorter agent identity labels. */
export const TOOL_DISPLAY_NAMES: Readonly<Record<AgentTool, string>> = {
  ...TOOL_LABELS,
  claude: 'Claude Code',
};

/**
 * What a person runs in a terminal on the runtime to sign a tool in, as the catalog states it for its own "not
 * signed in" message (`acp-bridge`'s `AgentSpec.signIn`); absent for a tool the catalog does not cover (`pi`), which
 * is shown as an honest gap rather than a guessed command.
 */
export const TOOL_SIGN_IN: Readonly<Partial<Record<AgentTool, string>>> =
  Object.fromEntries(AGENTS.map((agent) => [agent.id, agent.signIn]));

/** What the catalog knows about one model. */
export interface CatalogModel {
  /** The model's id without a provider, as Claude Code or Codex take it. */
  readonly id: string;
  /** How names show it: `Opus 5.5`. */
  readonly label: string;
  /** Other ids the same model is listed under, such as Claude Code's `opus`. */
  readonly aliases?: readonly string[];
  /** What it is good at, suggested when someone enables its agent. */
  readonly goodAt: { readonly en: string; readonly zh: string };
}

/** The models the catalog names. OpenCode and Pi list them as `provider/<id>` and are matched by `<id>`. */
export const MODEL_CATALOG: readonly CatalogModel[] = [
  ...[
    ['claude-opus-4-6', 'Opus 4.6'],
    ['claude-sonnet-4-6', 'Sonnet 4.6'],
    ['gpt-5.5', 'GPT-5.5'],
    ['gpt-4', 'GPT-4'],
    ['o1', 'o1'],
    ['gpt-4o', 'GPT-4o'],
    ['gpt-4o-2024-05-13', 'GPT-4o (2024-05-13)'],
  ].map(([id, label]) => ({
    id: id,
    label: label,
    goodAt: { en: '', zh: '' },
  })),
  {
    id: 'claude-opus-5-5',
    label: 'Opus 5.5',
    aliases: ['opus'],
    goodAt: {
      en: 'Designs, architecture, hard investigations and reviews of important changes.',
      zh: '方案、架构、疑难排查、重要改动的评审。',
    },
  },
  {
    id: 'claude-sonnet-5',
    label: 'Sonnet 5',
    aliases: ['sonnet'],
    goodAt: {
      en: 'Well-scoped implementation, small fixes, tests and wording.',
      zh: '范围清楚的常规实现、小修复、补测试、文案。',
    },
  },
  {
    id: 'claude-haiku-4-5',
    label: 'Haiku 4.5',
    aliases: ['haiku'],
    goodAt: {
      en: 'Small, mechanical changes; cheap and fast.',
      zh: '小改动、机械性修改，便宜、快。',
    },
  },
  {
    id: 'claude-fable-5-1',
    label: 'Fable 5.1',
    goodAt: {
      en: 'Understanding requirements, writing proposals and explanations.',
      zh: '理解需求、写方案和说明。',
    },
  },
  {
    id: 'gpt-6.1-sol',
    label: 'GPT-6.1 Sol',
    goodAt: {
      en: 'Larger implementations, changes across packages and refactoring.',
      zh: '较大的实现、跨包改动、重构。',
    },
  },
  {
    id: 'gpt-6-sol',
    label: 'GPT-6 Sol',
    goodAt: {
      en: 'Larger implementations, changes across packages and refactoring.',
      zh: '较大的实现、跨包改动、重构。',
    },
  },
  {
    id: 'gpt-6-astra',
    label: 'GPT-6 Astra',
    goodAt: {
      en: 'Code review and reading CI failures.',
      zh: '代码评审、读 CI 失败。',
    },
  },
  {
    id: 'gpt-6-luna',
    label: 'GPT-6 Luna',
    goodAt: {
      en: 'Small, mechanical changes; cheap and fast.',
      zh: '小改动、机械性修改，便宜、快。',
    },
  },
];

/**
 * Whether a tool names models `provider/model` (OpenCode, Pi). The same model can be reached through two providers
 * (`opencode/qwen3.8-flash` and `example-provider/qwen3.8-flash`) with different credentials, so labels keep the provider.
 */
export function providerQualified(tool: AgentTool): boolean {
  return tool === 'opencode' || tool === 'pi';
}

/** A dated release suffix (`-20261001`) or `-latest`, which name the same model. */
const RELEASE_SUFFIX = /-(?:\d{8}|latest)$/u;

/** The catalog entry an id (without a provider) names, by id or alias in any case, once its release suffix is dropped. */
function catalogById(id: string): CatalogModel | undefined {
  const bare = id.replace(RELEASE_SUFFIX, '').toLowerCase();
  return MODEL_CATALOG.find(
    (model) => model.id === bare || (model.aliases ?? []).includes(bare),
  );
}

/**
 * The id an agent keeps for what a runner reports: without a dated release suffix (`claude-haiku-4-5-20251001`), an
 * alias (`opus`) resolved to the model it names, and for OpenCode and Pi the provider kept in front
 * (`anthropic/claude-opus-5-5`; a nested id such as `alibaba-cn/kimi/kimi-k2.5` keeps everything after the provider).
 * Case is kept: OpenCode and Pi take ids such as `minimax/MiniMax-M2.7` as written. Versions are never folded together:
 * `gpt-6-sol` and `gpt-6.1-sol` are two models.
 */
export function normalizeModel(tool: AgentTool, reported: string): string {
  if (!isNativeTool(tool)) return reported;
  const id = reported.trim();
  if (providerQualified(tool)) {
    const slash = id.indexOf('/');
    if (slash > 0) {
      const provider = id.slice(0, slash);
      const model = id.slice(slash + 1);
      return `${provider}/${catalogById(model)?.id ?? model.replace(RELEASE_SUFFIX, '')}`;
    }
  }
  return catalogById(id)?.id ?? id.replace(RELEASE_SUFFIX, '');
}

/** What the catalog knows about a tool's model, normalized or not; undefined for a model it does not know. */
export function catalogEntry(
  tool: AgentTool,
  model: string,
): CatalogModel | undefined {
  if (!isNativeTool(tool)) return undefined;
  const id = normalizeModel(tool, model);
  const slash = providerQualified(tool) ? id.indexOf('/') : -1;
  return catalogById(slash > 0 ? id.slice(slash + 1) : id);
}

/** Abbreviations names write in capitals: `gpt-6.2-astra` reads "GPT-6.2 Astra". */
const MODEL_ACRONYMS: ReadonlySet<string> = new Set([
  'ai',
  'api',
  'glm',
  'gpt',
  'llm',
  'oss',
  'r1',
  'vl',
]);

/** Brands written their own way, at the start of a word such as `qwen3.8` or `deepseek`. */
const MODEL_BRANDS: Readonly<Record<string, string>> = {
  chatglm: 'ChatGLM',
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
  gemma: 'Gemma',
  kimi: 'Kimi',
  llama: 'Llama',
  minimax: 'MiniMax',
  mistral: 'Mistral',
  qwen: 'Qwen',
  qwq: 'QwQ',
};

/** One word of a model id as a name shows it: `flash` "Flash", `qwen3.8` "Qwen3.8", `v4.1` "V4.1", `o3` "o3". */
function modelWord(word: string): string {
  const lower = word.toLowerCase();
  if (MODEL_ACRONYMS.has(lower)) return lower.toUpperCase();
  // A parameter count: `120b` reads "120B".
  if (/^\d+(?:\.\d+)?[bkmt]$/u.test(lower)) return lower.toUpperCase();
  const brand = /^([a-z]+)(.*)$/u.exec(lower);
  if (brand && MODEL_BRANDS[brand[1]] && word === lower)
    return `${MODEL_BRANDS[brand[1]]}${brand[2]}`;
  // OpenAI's reasoning models are written in lower case, as the catalog writes `o1`.
  if (/^o\d/u.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * A readable name for a model id the catalog does not know: the part after its last `/`, split at `-` and `_`, each
 * word capitalized, abbreviations in capitals and versions written as the catalog writes them, so
 * `example-provider/qwen3.8-flash` reads "Qwen3.8 Flash" and `gpt-6.2-astra` "GPT-6.2 Astra". A leading word naming the
 * tool itself (`claude-…` under Claude) is dropped, since the agent's name says the tool, unless a version follows it. A word already written with
 * capitals (`MiniMax-M2.7`) keeps them.
 */
export function readableModelName(tool: AgentTool, id: string): string {
  const slash = id.lastIndexOf('/');
  const words = (slash >= 0 ? id.slice(slash + 1) : id)
    .split(/[-_]+/u)
    .filter(Boolean);
  // `claude-opus-9` under Claude reads "Opus 9", but `gemini-3.1-pro` keeps its brand before the version.
  if (
    words.length > 1 &&
    words[0].toLowerCase() === tool &&
    !/^\d/u.test(words[1])
  )
    words.shift();
  let name = '';
  words.forEach((word, index) => {
    const previous = words[index - 1];
    const shown = modelWord(word);
    if (index === 0) name = shown;
    // `gpt-6.2` is "GPT-6.2", `gpt-oss` "GPT-OSS" and `opus-4-7` "Opus 4.7": a version or another abbreviation keeps
    // its hyphen after an abbreviation, and two numbers are joined by a dot.
    else if (/^\d+$/u.test(word) && previous && /^\d+$/u.test(previous))
      name += `.${shown}`;
    else if (
      (/^\d/u.test(word) || MODEL_ACRONYMS.has(word.toLowerCase())) &&
      previous &&
      MODEL_ACRONYMS.has(previous.toLowerCase())
    )
      name += `-${shown}`;
    else name += ` ${shown}`;
  });
  return name || id;
}

/**
 * How names show a tool's model: the catalog's label, else a readable name made from its id (`readableModelName`).
 * For OpenCode and Pi the provider is left out (`example-provider/qwen3.8-flash` reads "Qwen3.8 Flash"); the whole id is
 * shown beside the name (`agentModelOf`), and two providers' agents of one model are told apart by `uniqueAgentName`.
 */
export function modelLabel(tool: AgentTool, model: string): string {
  // An ACP tool's id stays its identity (`normalizeModel` keeps it as reported); only its label is made readable.
  if (!isNativeTool(tool))
    return model ? readableModelName(tool, model) : model;
  const known = catalogEntry(tool, model);
  if (known) return known.label;
  return readableModelName(tool, normalizeModel(tool, model));
}

/** The provider an OpenCode or Pi model is reached through (`example-provider`); null for other tools. */
export function modelProvider(tool: AgentTool, model: string): string | null {
  if (!providerQualified(tool)) return null;
  const id = normalizeModel(tool, model);
  const slash = id.indexOf('/');
  return slash > 0 ? id.slice(0, slash) : null;
}

/**
 * An agent's name is shown as a markdown mention link (`[@name](mention://…)`); a `[` or `]` in it closes that link
 * early, breaking the mention. Model names an ACP tool reports sometimes carry them (a "Token Plan" option in
 * brackets) or newlines: replace the former with the visually closest safe punctuation and the rest with spaces.
 */
export function sanitizeAgentNamePart(value: string): string {
  return (
    value
      .replace(/\[/gu, '(')
      .replace(/\]/gu, ')')
      // eslint-disable-next-line no-control-regex -- stripping control characters an agent mention link must not carry.
      .replace(/[\u0000-\u001f\u007f]/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim()
  );
}

/** An agent's name for a tool and model: "Claude · Opus 5.5". */
export function agentNameOf(
  tool: AgentTool,
  model: string,
  displayModel?: string,
): string {
  if (!model) return TOOL_DISPLAY_NAMES[tool] ?? tool;
  // A tool's own display name is taken as it is for single-provider tools; OpenCode and Pi names are made from the
  // id the same way for every provider, so `uniqueAgentName` can tell two providers' agents apart.
  const label = sanitizeAgentNamePart(
    displayModel && displayModel !== model && !providerQualified(tool)
      ? displayModel
      : modelLabel(tool, model),
  );
  return `${TOOL_LABELS[tool]} · ${label || model}`;
}

/**
 * The name a new agent of a tool and model is saved with, given whether a name is already held by another agent:
 * `agentNameOf`; when that is held, for OpenCode and Pi, the name with the model's provider after it
 * ("OpenCode · Qwen3.8 Flash (example-provider)"); else the first free `#2`, `#3`… after one of them. Agents are not
 * renamed afterwards, so two agents that already read the same are renamed by an administrator.
 */
export function uniqueAgentName(
  tool: AgentTool,
  model: string,
  taken: (name: string) => boolean,
  displayModel?: string,
): string {
  const base = agentNameOf(tool, model, displayModel);
  if (!taken(base)) return base;
  const provider = model ? modelProvider(tool, model) : null;
  const named = provider
    ? `${base} (${sanitizeAgentNamePart(provider)})`
    : base;
  if (named !== base && !taken(named)) return named;
  let suffix = 2;
  while (taken(`${named} #${suffix}`)) suffix += 1;
  return `${named} #${suffix}`;
}

/**
 * What a page shows about an agent's model beside its name, for every tool.
 *
 * - `model`: the whole model id (`example-provider/qwen3.8-flash`, `claude-opus-5-5`), shown under the name or as its
 *   "Model" line.
 * - `shortName`: what a narrow place (a chip, a picker, a table column) shows, the name without its tool
 *   ("Qwen3.8 Flash (example-provider)"); absent when the name does not start with the tool, such as an agent someone
 *   renamed, which shows its own name.
 * - `modelTitle`: what that place shows on hover, the tool and the whole id ("OpenCode · example-provider/qwen3.8-flash").
 */
export interface AgentModel {
  readonly model?: string;
  readonly shortName?: string;
  readonly modelTitle?: string;
}

/** `AgentModel` of an agent by its saved name. */
export function agentModelOf(agent: {
  readonly name: string | null;
  readonly tool: AgentTool | null;
  readonly model: string | null;
}): AgentModel {
  if (!agent.tool || !agent.model) return {};
  const model = normalizeModel(agent.tool, agent.model);
  const prefix = `${TOOL_LABELS[agent.tool] ?? agent.tool} · `;
  const shortName =
    agent.name?.startsWith(prefix) && agent.name.length > prefix.length
      ? agent.name.slice(prefix.length)
      : undefined;
  return {
    model,
    ...(shortName ? { shortName } : {}),
    modelTitle: `${prefix}${model}`,
  };
}

/** Whether two ids of one tool's model name the same model. */
export function sameModel(tool: AgentTool, a: string, b: string): boolean {
  return normalizeModel(tool, a) === normalizeModel(tool, b);
}

/** Provider ids remain execution identities; these names are for display only. */
export function providerLabel(provider: string): string {
  const names: Readonly<Record<string, string>> = {
    openrouter: 'OpenRouter',
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    'google-generative-ai': 'Google',
    azure: 'Azure',
    'amazon-bedrock': 'Amazon Bedrock',
  };
  return (
    names[provider.toLowerCase()] ??
    provider
      .replace(
        /(^|[-_ ])([a-z])/gu,
        (_all, _space, letter: string) => ` ${letter.toUpperCase()}`,
      )
      .trim()
  );
}

export function quotaTargetLabel(
  tool: AgentTool,
  scope: 'tool' | 'provider' | 'model',
  target: string,
): string {
  return scope === 'tool'
    ? TOOL_LABELS[tool]
    : scope === 'provider'
      ? providerLabel(target)
      : modelLabel(tool, target);
}
