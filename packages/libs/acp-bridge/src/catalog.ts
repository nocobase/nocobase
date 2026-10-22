/** Browser-safe catalog shared by personal sessions and runners. Home-relative search directories are resolved by the launcher. */
export interface AgentLauncher {
  /** The program's name, found in `dirs` or on PATH; on Windows, with one of PATHEXT's extensions. */
  readonly command: string;
  readonly args: readonly string[];
  /** Directories searched before PATH. */
  readonly dirs?: readonly string[];
  /** Another program this launcher needs, such as the agent itself for an adapter fetched with npx. */
  readonly requires?: string;
  /**
   * The launcher is an adapter the bridge manages: `package` at `version`, installed from npm on first use, whose
   * program `command` is run by Node.js. The agent it `requires`, at least `minVersion`, is named to it in the
   * environment variable `variable`. `batchFiles` says the adapter can start an agent that is a Windows batch file, as
   * npm installs agents.
   */
  readonly managed?: {
    readonly package: string;
    readonly version: string;
    readonly variable: string;
    readonly minVersion: string;
    readonly batchFiles?: boolean;
  };
}

export interface AgentSpec {
  readonly id: string;
  readonly name: string;
  /** Ways to start it, in order of preference. */
  readonly launchers: readonly AgentLauncher[];
  /** The values of the session's `mode` choice that give the agent full access: a session opens in the first offered. */
  readonly modes?: readonly string[];
  /** The agent offers no such mode: the bridge allows whatever it asks permission for. */
  readonly allowAll?: boolean;
  /** What a person runs in a terminal to sign in to it, for the message when it is not signed in. */
  readonly signIn: string;
  /** Environment the agent runs with, over the bridge's own. */
  readonly env?: Readonly<Record<string, string>>;
  /** Full-access defaults for real sessions; never applied during runner detection. */
  readonly permissionEnv?: Readonly<Record<string, string>>;
  /**
   * The session's `configOptions`/model-like choices are not models (Amp's are reasoning modes): the runner reports
   * no model list for this agent rather than one entry per choice, and names its agent after the tool alone.
   */
  readonly modelsAreNotModels?: boolean;
  /**
   * Confirms a program found under this agent's expected name actually is it, before trying to speak ACP to it:
   * run it with `args`; if the combined stdout and stderr match `reject`, the program found is something else
   * (Goose, the AI agent, and the unrelated `pressly/goose` database migration tool share a name on PATH).
   */
  readonly identify?: {
    readonly args: readonly string[];
    readonly reject: RegExp;
    /** Default 5000. */
    readonly timeoutMs?: number;
  };
  /**
   * A successful detection handshake (`initialize` and `session/new`) does not mean this agent is signed in: it
   * opens a session the same way whether or not it is (Amp, by the owner's own tested report). Detection reads this
   * agent's own `initialize.authMethods` instead of taking the handshake's success at face value: a populated list
   * names sign-in methods not yet used (`needsLogin`/`notLoggedIn`), an empty list is read as signed in (`ready`),
   * and an absent field — the handshake saying nothing either way — stays `needsLogin`/`signInUnconfirmed` rather
   * than a `ready` it cannot back up.
   */
  readonly signInUnconfirmable?: boolean;
}

const localBin = '~/.local/bin';

/** The program `command` run with `args`, found as it is installed. */
function program(
  command: string,
  args: readonly string[] = [],
  dirs: readonly string[] = [],
): AgentLauncher {
  return { command, args, ...(dirs.length > 0 ? { dirs } : {}) };
}

/** The adapter versions the bridge installs. */
const CODEX_ACP = { name: '@agentclientprotocol/codex-acp', version: '2.2.2' };
const CLAUDE_AGENT_ACP = {
  name: '@agentclientprotocol/claude-agent-acp',
  version: '0.89.1',
};

/**
 * The ACP adapter `adapter`, whose program `bin` runs the agent `requires` that it finds in `variable`: managed by the
 * bridge, unless installed on PATH. The adapter is built against `minVersion` of the agent and may
 * not drive an older one.
 */
function adapter(
  pkg: { readonly name: string; readonly version: string },
  bin: string,
  requires: string,
  agent: Omit<NonNullable<AgentLauncher['managed']>, 'package' | 'version'>,
): AgentLauncher[] {
  return [
    program(bin),
    {
      command: bin,
      args: [],
      requires,
      managed: { package: pkg.name, version: pkg.version, ...agent },
    },
  ];
}

/** The agents the bridge offers, the most used first. */
export const CATALOG_IDS = [
  'codex',
  'claude',
  'gemini',
  'copilot',
  'cursor',
  'opencode',
  'qwen',
  'kimi',
  'codebuddy',
  'qoder',
  'goose',
  'auggie',
  'droid',
  'kilo',
  'cline',
  'amp',
  'vibe',
] as const;
export type CatalogAgentId = (typeof CATALOG_IDS)[number];
export const AGENTS: readonly (AgentSpec & { readonly id: CatalogAgentId })[] =
  [
    {
      id: 'codex',
      name: 'Codex',
      // codex-acp starts Codex with cross-spawn, which runs npm's `codex.cmd` on Windows.
      launchers: adapter(CODEX_ACP, 'codex-acp', 'codex', {
        variable: 'CODEX_PATH',
        minVersion: '0.160.1',
        batchFiles: true,
      }),
      modes: ['agent-full-access'],
      signIn: 'codex login',
    },
    {
      id: 'claude',
      name: 'Claude Code',
      launchers: adapter(CLAUDE_AGENT_ACP, 'claude-agent-acp', 'claude', {
        variable: 'CLAUDE_CODE_EXECUTABLE',
        minVersion: '2.1.200',
      }),
      modes: ['bypassPermissions'],
      signIn: 'claude',
    },
    {
      id: 'gemini',
      name: 'Gemini CLI',
      launchers: [program('gemini', ['--acp'])],
      modes: ['yolo'],
      signIn: 'gemini',
    },
    {
      id: 'copilot',
      name: 'GitHub Copilot',
      launchers: [program('copilot', ['--acp'])],
      allowAll: true,
      signIn: 'copilot',
    },
    {
      id: 'cursor',
      name: 'Cursor',
      launchers: [program('cursor-agent', ['acp'], [localBin])],
      allowAll: true,
      signIn: 'cursor-agent login',
    },
    {
      id: 'opencode',
      name: 'OpenCode',
      launchers: [program('opencode', ['acp'], ['~/.opencode/bin'])],
      modes: ['build'],
      signIn: 'opencode auth login',
      permissionEnv: {
        OPENCODE_PERMISSION: JSON.stringify({
          edit: 'allow',
          bash: 'allow',
          webfetch: 'allow',
          external_directory: 'allow',
        }),
      },
    },
    {
      id: 'qwen',
      name: 'Qwen Code',
      launchers: [program('qwen', ['--acp'])],
      modes: ['yolo'],
      signIn: 'qwen',
    },
    {
      id: 'kimi',
      name: 'Kimi CLI',
      launchers: [program('kimi', ['acp'], [localBin])],
      allowAll: true,
      signIn: 'kimi',
    },
    {
      id: 'codebuddy',
      name: 'CodeBuddy Code',
      launchers: [program('codebuddy', ['--acp'])],
      allowAll: true,
      signIn: 'codebuddy',
    },
    {
      id: 'qoder',
      name: 'Qoder CLI',
      launchers: [program('qodercli', ['--acp'])],
      allowAll: true,
      signIn: 'qodercli',
    },
    {
      id: 'goose',
      name: 'Goose',
      launchers: [program('goose', ['acp'], [localBin])],
      allowAll: true,
      signIn: 'goose configure',
      permissionEnv: { GOOSE_MODE: 'auto' },
      identify: {
        args: ['--help'],
        // The unrelated `pressly/goose` database migration CLI of the same name documents these subcommands and
        // flags (`up`, `down`, `-dir`, a DSN); the AI agent's own CLI vocabulary (session, acp, mcp, configure,
        // recipe) does not use them. A negative match, not a positive one: it only rejects the known other
        // program, so an agent CLI surface this list has not seen still passes. Not verified against either
        // program's real --help output in this environment.
        reject: /\bdbstring\b|-dir string|\bup-by-one\b|\bgoose:\s*version\b/iu,
      },
    },
    {
      id: 'auggie',
      name: 'Auggie',
      launchers: [program('auggie', ['--acp'])],
      allowAll: true,
      signIn: 'auggie login',
      env: { AUGMENT_DISABLE_AUTO_UPDATE: '1' },
    },
    {
      id: 'droid',
      name: 'Factory Droid',
      launchers: [
        program(
          'droid',
          ['exec', '--output-format', 'acp-daemon'],
          [localBin, '~/.factory/bin'],
        ),
      ],
      allowAll: true,
      signIn: 'droid',
      env: {
        DROID_DISABLE_AUTO_UPDATE: 'true',
        FACTORY_DROID_AUTO_UPDATE_ENABLED: 'false',
      },
    },
    {
      id: 'kilo',
      name: 'Kilo Code',
      launchers: [program('kilo', ['acp'])],
      allowAll: true,
      signIn: 'kilo',
    },
    {
      id: 'cline',
      name: 'Cline',
      launchers: [program('cline', ['--acp'])],
      allowAll: true,
      signIn: 'cline',
    },
    {
      id: 'amp',
      name: 'Amp',
      launchers: [program('amp-acp', [], [localBin])],
      allowAll: true,
      signIn: 'amp login',
      // Amp's ACP session reports its reasoning modes (low/medium/high/ultra) as configOptions, not models.
      modelsAreNotModels: true,
      // A successful handshake happens whether or not Amp is signed in; see `AgentSpec.signInUnconfirmable`.
      signInUnconfirmable: true,
    },
    {
      id: 'vibe',
      name: 'Mistral Vibe',
      launchers: [program('vibe-acp', [], [localBin])],
      allowAll: true,
      signIn: 'vibe',
    },
  ];
