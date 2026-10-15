import type { Tool } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { ServiceResolver } from '@nocobase/service-provider';
import type { ZodObject } from 'zod';
import { invalid } from '../kernel/errors.js';
import { jsonSafe, type Json } from './codec.js';

export type Context = Readonly<{
  user: { id: string };
  authorization: AuthorizationContext;
  /** Full entry credentials remain in memory and are passed to the business service unchanged. */
  credentials: unknown;
  business?: Json;
  variable?: Json;
  systemPrompt?: string;
}>;
export type ToolContext = Context & { readonly signal: AbortSignal };
export type Scope = {
  systemPromptTemplate?:
    string | { variableSchema?: ZodObject; template(context: Context): string };
  context?: { variable?: Json; systemPrompt?: string };
  tool?: string[];
  model?: string[];
  thinking?: string;
  permissions?: never;
};
export type ScopeProvider = (context: Context) => Scope | Promise<Scope>;
export type Options = Scope & { scope?: string[] };
export type Config = {
  scope: string[];
  systemPrompt: string;
  variable?: Json;
  tool: string[];
  toolVersions: Record<string, string>;
  model: string[];
  thinking?: string;
};
export type Definition<I, O, C = ToolContext> = Tool<I, O, C> & {
  execute: NonNullable<Tool<I, O, C>['execute']>;
  permissions?: never;
  needsApproval?: never;
};

type Registered = {
  version: string;
  resolve(
    resolver?: ServiceResolver,
  ): Definition<unknown, unknown, ToolContext>;
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
  private globals: (Scope | ScopeProvider)[] = [];
  private scopes = new Map<string, (Scope | ScopeProvider)[]>();
  private tools = new Map<string, Registered>();

  registerOnlineAgentGlobalScope(...scope: (Scope | ScopeProvider)[]): void {
    scope.forEach((item) => {
      if (typeof item !== 'function') supported(item);
    });
    this.globals.push(...scope);
  }

  registerOnlineAgentScope(
    name: string,
    ...scope: (Scope | ScopeProvider)[]
  ): void {
    if (this.scopes.has(name))
      throw invalid(`Scope ${name} is already registered.`);
    scope.forEach((item) => {
      if (typeof item !== 'function') supported(item);
    });
    this.scopes.set(name, scope);
  }

  registerTool<I, O, C = ToolContext>(
    name: string,
    options: {
      version: string;
      definition:
        | Definition<I, O, C>
        | ((resolver: ServiceResolver) => Definition<I, O, C>);
    },
  ): void {
    if (
      !/^[a-zA-Z0-9_-]{1,64}$/u.test(name) ||
      !options.version ||
      this.tools.has(name)
    )
      throw invalid(`Invalid or duplicate tool ${name}.`);
    if (typeof options.definition !== 'function') supported(options.definition);
    let resolved: Definition<I, O, C> | undefined;
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
        return resolved as unknown as Definition<unknown, unknown, ToolContext>;
      },
    });
  }

  async resolve(
    context: Context,
    options: Options,
    previous?: Config,
    fallbackModels: string[] = [],
  ): Promise<Config> {
    supported(options);
    const result: Config = previous
      ? structuredClone(previous)
      : {
          scope: [],
          systemPrompt: '',
          tool: [],
          toolVersions: {},
          model: [...fallbackModels],
        };
    const layers: (Scope | ScopeProvider)[] = previous ? [] : [...this.globals];
    for (const name of options.scope ?? []) {
      const found = this.scopes.get(name);
      if (!found) throw invalid(`Scope ${name} is not registered.`);
      layers.push(...found);
    }
    layers.push(options);
    for (const layer of layers) {
      const current: Context = {
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
      if (scope.tool !== undefined) result.tool = [...scope.tool];
      if (scope.model !== undefined) result.model = [...scope.model];
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
    return result;
  }

  bind(
    config: Config,
    context: ToolContext,
    resolver: ServiceResolver | undefined,
    track: (task: Promise<unknown>) => void = () => {},
  ): Record<string, Tool<unknown, unknown, ToolContext>> {
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
        } as Tool<unknown, unknown, ToolContext>;
        return [name, bound];
      }),
    );
  }
}
