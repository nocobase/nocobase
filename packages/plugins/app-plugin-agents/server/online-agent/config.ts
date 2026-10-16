import type { Tool } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { ServiceResolver } from '@nocobase/service-provider';
import type { ZodObject } from 'zod';
import { invalid } from '../kernel/errors.js';
import { jsonSafe, type OnlineAgentJson } from './codec.js';

export type OnlineAgentContext = Readonly<{
  user: { id: string };
  authorization: AuthorizationContext;
  /** Full entry credentials remain in memory and are passed to the business service unchanged. */
  credentials: unknown;
  business?: OnlineAgentJson;
  variable?: OnlineAgentJson;
  systemPrompt?: string;
}>;
export type OnlineAgentToolContext = OnlineAgentContext & {
  /** The executing session, supplied by the runtime rather than model or page input. */
  readonly sessionId: string;
  readonly signal: AbortSignal;
};
export type OnlineAgentScope = {
  agentId?: string;
  systemPromptTemplate?:
    | string
    | {
        variableSchema?: ZodObject;
        template(context: OnlineAgentContext): string;
      };
  context?: { variable?: OnlineAgentJson; systemPrompt?: string };
  tool?: string[];
  model?: string[];
  thinking?: string;
  permissions?: never;
};
export type OnlineAgentScopeProvider = (
  context: OnlineAgentContext,
) => OnlineAgentScope | Promise<OnlineAgentScope>;
export type OnlineAgentOptions = OnlineAgentScope & { scope?: string[] };
export type OnlineAgentConfig = {
  agentId?: string;
  scope: string[];
  systemPrompt: string;
  variable?: OnlineAgentJson;
  tool: string[];
  toolVersions: Record<string, string>;
  model: string[];
  thinking?: string;
};
export type OnlineAgentToolDefinition<I, O, C = OnlineAgentToolContext> = Tool<
  I,
  O,
  C
> & {
  execute: NonNullable<Tool<I, O, C>['execute']>;
  permissions?: never;
  needsApproval?: never;
};

type OnlineAgentRegisteredTool = {
  version: string;
  resolve(
    resolver?: ServiceResolver,
  ): OnlineAgentToolDefinition<unknown, unknown, OnlineAgentToolContext>;
};

function supported(value: object) {
  if ('skill' in value && Array.isArray(value.skill) && value.skill.length)
    throw invalid('Skills execution is not supported in PR1.');
  if (
    'permissions' in value ||
    'needsApproval' in value ||
    'toolApproval' in value
  )
    throw invalid(
      'Permissions and approval declarations are not supported in PR1.',
    );
}

export class OnlineAgentConfigurer {
  private globals: (OnlineAgentScope | OnlineAgentScopeProvider)[] = [];
  private scopes = new Map<
    string,
    (OnlineAgentScope | OnlineAgentScopeProvider)[]
  >();
  private tools = new Map<string, OnlineAgentRegisteredTool>();

  registerOnlineAgentGlobalScope(
    ...scope: (OnlineAgentScope | OnlineAgentScopeProvider)[]
  ): void {
    scope.forEach((item) => {
      if (typeof item !== 'function') supported(item);
    });
    this.globals.push(...scope);
  }

  registerOnlineAgentScope(
    name: string,
    ...scope: (OnlineAgentScope | OnlineAgentScopeProvider)[]
  ): void {
    if (this.scopes.has(name))
      throw invalid(`Scope ${name} is already registered.`);
    scope.forEach((item) => {
      if (typeof item !== 'function') supported(item);
    });
    this.scopes.set(name, scope);
  }

  registerTool<I, O, C = OnlineAgentToolContext>(
    name: string,
    options: {
      version: string;
      definition:
        | OnlineAgentToolDefinition<I, O, C>
        | ((resolver: ServiceResolver) => OnlineAgentToolDefinition<I, O, C>);
    },
  ): void {
    if (
      !/^[a-zA-Z0-9_-]{1,64}$/u.test(name) ||
      !options.version ||
      this.tools.has(name)
    )
      throw invalid(`Invalid or duplicate tool ${name}.`);
    if (typeof options.definition !== 'function') supported(options.definition);
    let resolved: OnlineAgentToolDefinition<I, O, C> | undefined;
    this.tools.set(name, {
      version: options.version,
      resolve: (resolver) => {
        if (!resolved) {
          if (typeof options.definition === 'function' && !resolver)
            throw invalid(
              'A tool factory requires the application service resolver.',
            );
          const definition =
            typeof options.definition === 'function'
              ? options.definition(resolver!)
              : options.definition;
          supported(definition);
          if (typeof definition.execute !== 'function')
            throw invalid(`Tool ${name} needs an execute function.`);
          resolved = definition;
          Object.freeze(resolved);
        }
        return resolved as unknown as OnlineAgentToolDefinition<
          unknown,
          unknown,
          OnlineAgentToolContext
        >;
      },
    });
  }

  async resolve(
    context: OnlineAgentContext,
    options: OnlineAgentOptions,
    previous?: OnlineAgentConfig,
    fallbackModels: string[] = [],
  ): Promise<OnlineAgentConfig> {
    return (
      await this.resolveSelection(context, options, previous, fallbackModels)
    ).config;
  }

  async resolveSelection(
    context: OnlineAgentContext,
    options: OnlineAgentOptions,
    previous?: OnlineAgentConfig,
    fallbackModels: string[] = [],
  ): Promise<{ config: OnlineAgentConfig; hasModel: boolean }> {
    let hasModel = previous !== undefined;
    supported(options);
    const result: OnlineAgentConfig = previous
      ? structuredClone(previous)
      : {
          scope: [],
          systemPrompt: '',
          tool: [],
          toolVersions: {},
          model: [...fallbackModels],
        };
    const layers: (OnlineAgentScope | OnlineAgentScopeProvider)[] = previous
      ? []
      : [...this.globals];
    for (const name of options.scope ?? []) {
      const found = this.scopes.get(name);
      if (!found) throw invalid(`Scope ${name} is not registered.`);
      layers.push(...found);
    }
    layers.push(options);
    for (const layer of layers) {
      const current: OnlineAgentContext = {
        ...context,
        variable: result.variable,
        systemPrompt: result.systemPrompt,
      };
      const scope = typeof layer === 'function' ? await layer(current) : layer;
      supported(scope);
      if (scope.context?.variable !== undefined)
        result.variable = jsonSafe(scope.context.variable);
      if (scope.context?.systemPrompt !== undefined)
        result.systemPrompt = scope.context.systemPrompt;
      const template = scope.systemPromptTemplate;
      if (typeof template === 'string') result.systemPrompt = template;
      else if (template) {
        if (template.variableSchema)
          result.variable = jsonSafe(
            template.variableSchema.parse(result.variable),
          );
        result.systemPrompt = template.template({
          ...context,
          variable: result.variable,
          systemPrompt: result.systemPrompt,
        });
      }
      if (scope.agentId !== undefined) {
        if (typeof scope.agentId !== 'string' || !scope.agentId.trim())
          throw invalid('Select a valid agentId.');
        result.agentId = scope.agentId;
      }
      if (scope.tool !== undefined) result.tool = [...scope.tool];
      if (scope.model !== undefined) {
        result.model = [...scope.model];
        hasModel = true;
      }
      if (scope.thinking !== undefined) result.thinking = scope.thinking;
    }
    if (options.scope !== undefined) result.scope = [...options.scope];
    result.toolVersions = Object.fromEntries(
      result.tool.map((name) => {
        const registered = this.tools.get(name);
        if (!registered) throw invalid(`Tool ${name} is not registered.`);
        return [name, registered.version];
      }),
    );
    jsonSafe(result);
    return { config: result, hasModel };
  }

  bind(
    config: OnlineAgentConfig,
    context: OnlineAgentToolContext,
    resolver: ServiceResolver | undefined,
    track: (task: Promise<unknown>) => void = () => {},
  ): Record<string, Tool<unknown, unknown, OnlineAgentToolContext>> {
    return Object.fromEntries(
      config.tool.map((name) => {
        const registered = this.tools.get(name);
        if (!registered || registered.version !== config.toolVersions[name])
          throw invalid(`Tool ${name} has changed or is unavailable.`);
        const definition = registered.resolve(resolver);
        const execute = definition.execute;
        const bound = {
          ...definition,
          execute: (input: unknown, options: Parameters<typeof execute>[1]) => {
            context.signal.throwIfAborted();
            const result = execute(input, options);
            if (
              result &&
              typeof result === 'object' &&
              Symbol.asyncIterator in result
            ) {
              const iterable = result as AsyncIterable<unknown>;
              let done!: () => void;
              track(
                new Promise<void>((resolve) => {
                  done = resolve;
                }),
              );
              return (async function* () {
                try {
                  yield* iterable;
                } finally {
                  done();
                }
              })();
            }
            const task = Promise.resolve(result);
            track(task);
            return task;
          },
        } as Tool<unknown, unknown, OnlineAgentToolContext>;
        return [name, bound];
      }),
    );
  }
}
