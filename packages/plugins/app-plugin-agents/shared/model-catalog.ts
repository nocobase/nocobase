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

/** Whether a tool names models `provider/model`. */
function providerQualified(tool: AgentTool): boolean {
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

/** How names show a tool's model: the catalog's label, else its id without the provider. */
export function modelLabel(tool: AgentTool, model: string): string {
  if (!isNativeTool(tool)) return model;
  const known = catalogEntry(tool, model);
  if (known) return known.label;
  const id = normalizeModel(tool, model);
  const slash = id.lastIndexOf('/');
  const label = slash >= 0 ? id.slice(slash + 1) : id;
  if (label.startsWith('gemini-'))
    return label
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  return label;
}

/**
 * An agent's name is shown as a markdown mention link (`[@name](mention://…)`); a `[` or `]` in it closes that link
 * early, breaking the mention. Model names an ACP tool reports sometimes carry them (a "Token Plan" option in
 * brackets) or newlines: replace the former with the visually closest safe punctuation and the rest with spaces.
 */
export function sanitizeAgentNamePart(value: string): string {
  return value
    .replace(/\[/gu, '(')
    .replace(/\]/gu, ')')
    .replace(/[\u0000-\u001f\u007f]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** An agent's name for a tool and model: "Claude · Opus 5.5". */
export function agentNameOf(
  tool: AgentTool,
  model: string,
  displayModel?: string,
): string {
  if (!model) return TOOL_DISPLAY_NAMES[tool] ?? tool;
  const label = sanitizeAgentNamePart(displayModel ?? modelLabel(tool, model));
  return `${TOOL_LABELS[tool]} · ${label || model}`;
}

/** Whether two ids of one tool's model name the same model. */
export function sameModel(tool: AgentTool, a: string, b: string): boolean {
  return normalizeModel(tool, a) === normalizeModel(tool, b);
}

/** Display identity only. Unknown models retain their provider; execution identity never changes. */
export function discoveryKey(tool: AgentTool, model: string): string {
  return `${tool}:${catalogEntry(tool, model)?.id ?? model}`;
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
