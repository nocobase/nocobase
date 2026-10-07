import { AGENT_TOOLS, type AgentTool } from '@nocobase/agent-protocol';
import { AppCommand } from '@nocobase/app-cli';
import { Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

/** What `agents runner-token` returns, and the `result` of its `--json` document. */
export interface RunnerTokenResult {
  readonly token: string;
  readonly trust: 'team' | 'ownerOnly';
  /** The coding tools the runner may run; null for every tool. */
  readonly enabledTools: readonly AgentTool[] | null;
  readonly expiresAt: string;
}

export default class RunnerToken extends AppCommand {
  static override summary =
    'Create a one-time token a runner registers with (valid for 10 minutes).';
  static override flags: {
    trust: Interfaces.OptionFlag<string>;
    owner: Interfaces.OptionFlag<string | undefined>;
    tools: Interfaces.OptionFlag<string | undefined>;
  } = {
    trust: Flags.string({
      default: 'ownerOnly',
      options: ['team', 'ownerOnly'],
      description:
        'team runs anyone’s work; ownerOnly runs only work the owner started.',
    }),
    owner: Flags.string({
      description: 'The user id that owns the runner (required for ownerOnly).',
    }),
    tools: Flags.string({
      description: `The coding tools the runner may run, comma-separated (${AGENT_TOOLS.join(', ')}); every tool when omitted. They can be changed on the Runtimes page later.`,
    }),
  };

  public async run(): Promise<RunnerTokenResult> {
    const { flags } = await this.parse(RunnerToken);
    if (flags.trust === 'ownerOnly' && !flags.owner)
      this.error('An ownerOnly runner needs --owner <user id>.');
    const tools = flags.tools
      ?.split(',')
      .map((tool) => tool.trim())
      .filter(Boolean);
    const unknown = tools?.filter(
      (tool) => !(AGENT_TOOLS as readonly string[]).includes(tool),
    );
    if (unknown?.length)
      this.error(
        `Unknown coding tool: ${unknown.join(', ')}. Choose from ${AGENT_TOOLS.join(', ')}.`,
      );
    if (tools && tools.length === 0)
      this.error('--tools needs at least one coding tool.');
    // Loaded here rather than at the top of the file: the command tree imports this module for `--help` too.
    const { agentsToken } = await import('../server/tokens.js');
    const created = await this.withApp(async ({ app }) => {
      await app.registerProviders();
      return app.container
        .resolve(agentsToken)
        .runners.createRegistrationToken(flags.owner ?? null, {
          trust: flags.trust as 'team' | 'ownerOnly',
          ...(tools ? { enabledTools: tools as AgentTool[] } : {}),
        });
    });
    this.log(created.token);
    return {
      token: created.token,
      trust: created.trust,
      enabledTools: created.enabledTools,
      expiresAt: created.expiresAt,
    };
  }
}
