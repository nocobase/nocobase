import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';

import { LLMServiceCommand } from './service-command.js';

export interface LLMModelsResult {
  readonly service: string;
  readonly provider: string;
  readonly models: readonly { readonly id: string }[];
}

export default class LLMModels extends LLMServiceCommand {
  static override summary = 'List live model IDs for a configured LLM service.';
  static override description =
    'Reads the final application AI configuration and queries a built-in provider without starting the application or accessing its database. Does not change enabled models.';
  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> openai --json',
    '<%= config.bin %> <%= command.id %> openai --search gpt',
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
    search: Interfaces.OptionFlag<string | undefined, Interfaces.CustomOptions>;
  } = {
    search: Flags.string({
      description: 'Filter model IDs by a case-insensitive substring.',
    }),
  };

  public async run(): Promise<LLMModelsResult> {
    const { args, flags } = await this.parse(LLMModels);
    const result = await this.withProvider(
      args.service,
      undefined,
      async (provider, providerName) => {
        const response = await provider.listModels();
        if (
          response.errMsg ||
          (response.code !== undefined &&
            response.code !== 0 &&
            (response.code < 200 || response.code >= 300)) ||
          !Array.isArray(response.models) ||
          response.models.some(
            (model) => typeof model?.id !== 'string' || model.id.length === 0,
          )
        ) {
          throw this.providerFailure();
        }
        const search = flags.search?.toLowerCase();
        // Whitelist the public fields: model metadata can include provider-specific or sensitive data.
        const models = response.models
          .filter(
            ({ id }) =>
              search === undefined || id.toLowerCase().includes(search),
          )
          .map(({ id }) => ({ id }));
        return { service: args.service, provider: providerName, models };
      },
    );
    for (const { id } of result.models) this.log(id);
    return result;
  }
}
