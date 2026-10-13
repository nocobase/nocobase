import { Args, type Interfaces } from '@oclif/core';

import { AGENT_TOOLS, type AgentTool } from '../../protocol/index.ts';
import { RunnerCommand, UsageError } from '../../lib/command.ts';
import {
  MODEL_ID_PATTERN,
  modelListOverrides,
  readSettings,
  writeSettings,
} from '../../lib/config.ts';
import { builtInModels } from '../../core/model-list.ts';

const ACTIONS = ['add', 'remove', 'reset', 'show'] as const;
type Action = (typeof ACTIONS)[number];

/** What a tool's list changes are after `config models`. */
export interface ModelListChange {
  readonly tool: AgentTool;
  readonly add: readonly string[];
  readonly remove: readonly string[];
  /** The list the runner reports for a tool that cannot list its models. */
  readonly builtin: readonly string[];
}

export default class ConfigModels extends RunnerCommand {
  static override summary: string =
    'Add or remove models a coding tool is reported with.';
  static override description: string =
    'The runner reports the models each coding tool can run: those the tool lists, or, for a tool that cannot list ' +
    'them, a built-in list for its kind. `add` reports a model besides those, `remove` leaves one out, `reset` drops ' +
    'every change for the tool and `show` prints them. The application makes an agent of each tool and model it is ' +
    'told of. A running runner reports the change with its next heartbeat.';
  static override examples: string[] = [
    '<%= config.bin %> config models codex add gpt-6.1-sol',
    '<%= config.bin %> config models pi remove openai/gpt-6-luna',
    '<%= config.bin %> config models pi reset',
    '<%= config.bin %> config models claude show',
  ];
  static override args: {
    tool: Interfaces.Arg<string>;
    action: Interfaces.Arg<string>;
    model: Interfaces.Arg<string | undefined>;
  } = {
    tool: Args.string({
      description: 'The coding tool.',
      required: true,
      options: [...AGENT_TOOLS],
    }),
    action: Args.string({
      description: 'What to do.',
      required: true,
      options: [...ACTIONS],
    }),
    model: Args.string({
      description: 'The model id, as the tool takes it (add and remove).',
    }),
  };

  async run(): Promise<ModelListChange> {
    const { args } = await this.parse(ConfigModels);
    const tool = args.tool as AgentTool;
    const action = args.action as Action;
    if (!(AGENT_TOOLS as readonly string[]).includes(tool))
      throw new UsageError(`Unknown coding tool ${args.tool}.`);
    const settings = await readSettings(this.paths);
    const overrides = { ...modelListOverrides(settings.models) };
    const current = overrides[tool] ?? {};
    let add = [...(current.add ?? [])];
    let remove = [...(current.remove ?? [])];
    if (action === 'add' || action === 'remove') {
      const model = args.model;
      if (model === undefined || !MODEL_ID_PATTERN.test(model))
        throw new UsageError(
          `${action} needs a model id, such as gpt-6.1-sol.`,
        );
      add = add.filter((id) => id !== model);
      remove = remove.filter((id) => id !== model);
      if (action === 'add') add.push(model);
      else remove.push(model);
    } else if (action === 'reset') {
      add = [];
      remove = [];
    }
    if (action !== 'show') {
      if (add.length > 0 || remove.length > 0)
        overrides[tool] = { add, remove };
      else delete overrides[tool];
      const next = { ...settings };
      if (Object.keys(overrides).length > 0) next.models = overrides;
      else delete next.models;
      await writeSettings(next, this.paths);
    }
    const change: ModelListChange = {
      tool,
      add,
      remove,
      builtin: builtInModels(tool).map((model) => model.id),
    };
    this.log(
      [
        `${tool}: added ${add.length > 0 ? add.join(', ') : 'none'}; removed ${remove.length > 0 ? remove.join(', ') : 'none'}.`,
        `Built-in list (used when ${tool} cannot list its models): ${change.builtin.join(', ')}.`,
      ].join('\n'),
    );
    return change;
  }
}
