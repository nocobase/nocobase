import { CommandError } from '@nocobase/app-cli';
import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';

import { LLMServiceCommand } from './service-command.js';

export interface LLMTestResult {
  readonly service: string;
  readonly provider: string;
  readonly model: string;
  readonly callable: true;
}

export default class LLMTest extends LLMServiceCommand {
  static override summary =
    'Test a configured LLM service with a real completion (incurs provider cost).';
  static override description =
    'Sends the provider a minimal hello prompt using the required model. This makes a real completion request and may incur charges. Reports only whether the model is callable; never prints the completion. Does not start the application, access its database or change configuration.';
  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> openai --model gpt-4.1-mini --json',
  ];
  static override args: {
    service: Interfaces.Arg<string, Interfaces.CustomOptions>;
  } = {
    service: Args.string({
      description: 'Service name in ai.llmServices.',
      required: true,
    }),
  };
  static override flags: {
    model: Interfaces.OptionFlag<string, Interfaces.CustomOptions>;
  } = {
    model: Flags.string({
      description: 'Exact model ID to call (a real, billable completion).',
      required: true,
    }),
  };

  public async run(): Promise<LLMTestResult> {
    const { args, flags } = await this.parse(LLMTest);
    if (!flags.model.trim()) {
      throw new CommandError('Pass a non-empty model ID with --model.', {
        code: 'INVALID_USAGE',
        exit: 2,
      });
    }
    const result = await this.withProvider<LLMTestResult>(
      args.service,
      flags.model,
      async (provider, providerName) => {
        // The provider's testFlight sends only "hello" and discards the completion, unlike an agent/chat invocation.
        const response = await provider.testFlight();
        if (response.status !== 'success' || response.code !== 0)
          throw this.providerFailure();
        return {
          service: args.service,
          provider: providerName,
          model: flags.model,
          callable: true,
        };
      },
    );
    this.log('Model is callable.');
    return result;
  }
}
