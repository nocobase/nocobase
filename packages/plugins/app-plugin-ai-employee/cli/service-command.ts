import {
  AppCommand,
  CommandError,
  type CommandErrorOptions,
  type CommandSuggestion,
} from '@nocobase/app-cli';
import type { LLMProvider } from '@nocobase/ai-employee';

import type { AIApplicationConfig } from '../server/config.js';

/** Configuration-only access: never register application providers or resolve database-backed services. */
export abstract class LLMServiceCommand extends AppCommand {
  readonly #safeErrors: Set<unknown> = new Set();

  public override warn(_input: Error | string): Error | string {
    // withApp reports cleanup errors through warn(error.message). Never forward that potentially sensitive excerpt.
    return super.warn(
      'Application cleanup failed. Sensitive diagnostic details were omitted.',
    );
  }

  private safeError(
    message: string,
    options: CommandErrorOptions,
  ): CommandError {
    const error = new CommandError(message, options);
    this.#safeErrors.add(error);
    return error;
  }

  private configCheckSuggestion(): CommandSuggestion {
    return {
      message:
        'Check the application configuration without connecting to databases.',
      run: this.cliCommand(['config', 'check', '--no-connect', '--json']),
    };
  }

  protected async withProvider<T>(
    name: string,
    model: string | undefined,
    run: (provider: LLMProvider, providerName: string) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.withApp(async ({ app }) => {
        const { findLLMServiceConfigIssues, findLLMServicesMissingApiKey } =
          await import('../server/manager/llm-service-config.js');
        const services = app.config.get<AIApplicationConfig>('ai')?.llmServices;
        const issues = findLLMServiceConfigIssues(services);
        const check = this.configCheckSuggestion();
        if (issues.length > 0) {
          throw this.safeError(
            'The ai.llmServices configuration is malformed.',
            {
              code: 'AI_LLM_CONFIG_INVALID',
              suggestions: [check],
              details: { issues },
            },
          );
        }
        if (!services || !Object.hasOwn(services, name)) {
          throw this.safeError(
            'The requested LLM service is not configured in ai.llmServices.',
            {
              code: 'AI_LLM_SERVICE_NOT_FOUND',
              suggestions: [
                'Use a service name from the final application ai.llmServices configuration.',
                check,
              ],
            },
          );
        }
        const service = services[name]!;
        if (findLLMServicesMissingApiKey(services).includes(name)) {
          const repair = this.cliCommand([
            'config',
            'set',
            '--from-env',
            `ai.llmServices.${name}.options.apiKey=<VARIABLE>`,
          ]);
          const rendered = [repair.command, ...repair.args]
            .map(quoteArgument)
            .join(' ');
          throw this.safeError('The LLM service requires an API key.', {
            code: 'AI_LLM_API_KEY_MISSING',
            suggestions: [
              `Set it with ${rendered}, replacing <VARIABLE> with the name of an environment variable containing the key. In a source application, you can also map a variable onto it in env of server/config/ai.ts.`,
              check,
            ],
          });
        }
        const { createAIManager } = await import('@nocobase/ai-employee');
        const manager = createAIManager();
        const meta = manager.llmProviderManager.llmProviders.get(
          service.provider,
        );
        if (!meta) {
          throw this.safeError(
            'This CLI supports only built-in LLM providers.',
            {
              code: 'AI_LLM_PROVIDER_UNSUPPORTED',
              suggestions: [
                'Use the AI management UI in the running application for providers registered by application plugins.',
              ],
            },
          );
        }
        try {
          const provider = new meta.provider({
            serviceOptions: service.options,
            ...(model === undefined
              ? {}
              : { modelOptions: { model, maxRetries: 0 } }),
          });
          return await run(provider, service.provider);
        } catch {
          // Provider errors may contain arbitrary options, headers, URLs and raw credentials. Do not retain a cause:
          // AppCommand debug output prints causes, and redacting known credential names cannot cover arbitrary secrets.
          throw this.providerFailure();
        }
      });
    } catch (error) {
      // Only our own error identities are safe: config factories can throw CommandError with arbitrary secrets too.
      if (this.#safeErrors.has(error)) throw error;
      // Do not retain the original error, even as a cause: debug output must not expose YAML excerpts or options.
      throw this.safeError(
        'The LLM command could not initialize the application configuration or provider.',
        {
          code: 'AI_LLM_INITIALIZATION_FAILED',
          suggestions: [this.configCheckSuggestion()],
        },
      );
    }
  }

  protected providerFailure(): CommandError {
    return this.safeError('The LLM provider request failed.', {
      code: 'AI_LLM_PROVIDER_FAILED',
      suggestions: [
        'Check the service credentials, endpoint, network access and provider availability in the application configuration.',
        'For a completion test, verify that the requested model supports chat and that the account has access and sufficient quota.',
        this.configCheckSuggestion(),
      ],
    });
  }
}

function quoteArgument(argument: string): string {
  return /^[\w./:=-]+$/.test(argument)
    ? argument
    : `'${argument.replaceAll("'", "'\"'\"'")}'`;
}
