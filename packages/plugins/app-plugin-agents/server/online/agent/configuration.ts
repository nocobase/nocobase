import { isDeepStrictEqual } from 'node:util';
import { WEB_SEARCH_TOOL } from '../../../shared/web-search.js';
import { registerSandboxTools } from '../sandbox/tools.js';
import type { Tool } from 'ai';
import type { ServiceResolver } from '@nocobase/service-provider';
import { invalid } from '../../kernel/errors.js';
import { jsonSafe, strictJson } from './messages/json.js';
import type {
  OnlineAgentJson,
  OnlineAgentContext,
  OnlineAgentToolContext,
  OnlineAgentScope,
  OnlineAgentScopeProvider,
  OnlineAgentOptions,
  OnlineAgentConfig,
  OnlineAgentToolDefinition,
  OnlineAgentRegisteredTool,
} from './types.js';

/** Detect SDK result protocols without accidentally executing an accessor on a raw result. */
function resultMethod(value: unknown, key: string | symbol): boolean {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  )
    return false;
  let current: object | null = value;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      if (!('value' in descriptor))
        throw invalid('Tool result protocols cannot use accessors.');
      return typeof descriptor.value === 'function';
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  return false;
}

function supported(value: object) {
  if ('permissions' in value || 'toolApproval' in value)
    throw invalid(
      'Permission overrides and custom approval protocols are not supported.',
    );
}

/** Single effective selection for versioning, SDK binding, instructions and realtime projection. */
export function effectiveTools(config: OnlineAgentConfig): string[] {
  if (config.tool.includes(WEB_SEARCH_TOOL))
    throw invalid(
      'webSearch is reserved; enable it through webSearch configuration.',
    );
  return [
    ...new Set([
      ...config.tool,
      ...(config.webSearch ? [WEB_SEARCH_TOOL] : []),
    ]),
  ];
}
export class OnlineAgentConfigurator {
  private globals: (OnlineAgentScope | OnlineAgentScopeProvider)[] = [];
  private scopes = new Map<
    string,
    (OnlineAgentScope | OnlineAgentScopeProvider)[]
  >();
  private tools = new Map<string, OnlineAgentRegisteredTool>();

  constructor() {
    registerSandboxTools(this);
  }

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

  registerTool<I, O extends OnlineAgentJson, C = OnlineAgentToolContext>(
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
    if (
      typeof options.definition !== 'function' &&
      options.definition.needsApproval !== undefined &&
      options.definition.needsApproval !== false &&
      !options.definition.public
    )
      throw invalid(`Approval tool ${name} needs explicit public projections.`);
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
          if (
            definition.needsApproval !== undefined &&
            definition.needsApproval !== false &&
            !definition.public
          )
            throw invalid(
              `Approval tool ${name} needs explicit public projections.`,
            );
          if (typeof definition.execute !== 'function')
            throw invalid(`Tool ${name} needs an execute function.`);
          resolved = definition;
          Object.freeze(resolved);
        }
        return resolved as unknown as OnlineAgentToolDefinition<
          unknown,
          OnlineAgentJson,
          OnlineAgentToolContext
        >;
      },
    });
  }

  async resolve(
    context: OnlineAgentContext,
    options: OnlineAgentOptions,
    previous?: OnlineAgentConfig,
    http: boolean = false,
  ): Promise<OnlineAgentConfig> {
    return (await this.resolveSelection(context, options, previous, http))
      .config;
  }

  async resolveSelection(
    context: OnlineAgentContext,
    options: OnlineAgentOptions,
    previous?: OnlineAgentConfig,
    http: boolean = false,
  ): Promise<{ config: OnlineAgentConfig; hasModel: boolean }> {
    let hasModel = previous?.model !== undefined;
    let hasTools = previous !== undefined;
    supported(options);
    if (
      http &&
      (options.tool !== undefined ||
        options.skill !== undefined ||
        options.model !== undefined ||
        options.systemPromptTemplate !== undefined ||
        options.context?.systemPrompt !== undefined)
    )
      throw invalid(
        'HTTP configuration cannot override tools, models or system prompts.',
      );
    const supplied = http ? options.context?.variable : undefined;
    if (
      supplied !== undefined &&
      (!supplied || typeof supplied !== 'object' || Array.isArray(supplied))
    )
      throw invalid(
        'Business variables must be an object declared by a selected scope.',
      );
    const declared = new Set<string>();
    const resolved: OnlineAgentScope[] = [];
    let hasSelectedSchema = false;
    const result: OnlineAgentConfig = previous
      ? structuredClone(previous)
      : {
          scope: [],
          systemPrompt: '',
          tool: [],
          skill: [],
          toolVersions: {},
        };
    result.skill ??= [];
    const layers: {
      value: OnlineAgentScope | OnlineAgentScopeProvider;
      selected: boolean;
    }[] = previous
      ? []
      : this.globals.map((value) => ({ value, selected: false }));
    // Only explicit HTTP variable changes revisit the selected scope declarations.
    for (const name of options.scope ??
      (supplied !== undefined ? previous?.scope : undefined) ??
      []) {
      const found = this.scopes.get(name);
      if (!found) throw invalid(`Scope ${name} is not registered.`);
      layers.push(...found.map((value) => ({ value, selected: true })));
    }
    layers.push({ value: options, selected: false });
    const enteringPrompt = result.systemPrompt;
    for (const { value: layer, selected } of layers) {
      const current: OnlineAgentContext = {
        ...context,
        variable: result.variable,
        systemPrompt: enteringPrompt,
      };
      const scope = typeof layer === 'function' ? await layer(current) : layer;
      supported(scope);
      resolved.push(scope);
      const template = scope.systemPromptTemplate;
      if (
        selected &&
        template &&
        typeof template !== 'string' &&
        template.variableSchema
      ) {
        hasSelectedSchema = true;
        for (const key of Object.keys(template.variableSchema.shape))
          declared.add(key);
      }
      if (scope.context?.variable !== undefined && !(http && layer === options))
        result.variable = jsonSafe(scope.context.variable);
      if (scope.agentId !== undefined) {
        if (typeof scope.agentId !== 'string' || !scope.agentId.trim())
          throw invalid('Select a valid agentId.');
        result.agentId = scope.agentId;
      }
      if (scope.tool !== undefined) {
        result.tool = [...scope.tool];
        hasTools = true;
      }
      if (scope.skill !== undefined) result.skill = [...new Set(scope.skill)];
      if (scope.model !== undefined) {
        result.model = [...scope.model];
        hasModel = true;
      }
      if (scope.thinking !== undefined) result.thinking = scope.thinking;
      if (scope.webSearch !== undefined) {
        if (typeof scope.webSearch !== 'boolean')
          throw invalid('webSearch must be a boolean.');
        result.webSearch = scope.webSearch;
      }
    }
    if (
      supplied !== undefined &&
      (!hasSelectedSchema ||
        Object.keys(supplied).some((key) => !declared.has(key)))
    )
      throw invalid(
        'Business variables must be declared by the selected scopes.',
      );
    const schemas = resolved.flatMap((scope) => {
      const template = scope.systemPromptTemplate;
      return template && typeof template !== 'string' && template.variableSchema
        ? [template.variableSchema]
        : [];
    });
    const raw = result.variable;
    if (supplied !== undefined || schemas.length) {
      if (
        raw !== undefined &&
        (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      )
        throw invalid(
          'Business variables must be an object for template schemas.',
        );
      const candidate = { ...(raw ?? {}), ...(supplied ?? {}) };
      const normalized = new Map<string, OnlineAgentJson | undefined>();
      for (const schema of schemas) {
        const keys = Object.keys(schema.shape);
        const projected = Object.fromEntries(
          keys
            .filter((key) => Object.hasOwn(candidate, key))
            .map((key) => [key, candidate[key]]),
        );
        const parsed = schema.safeParse(projected);
        if (!parsed.success) {
          if (http)
            throw invalid(
              'Business variables do not match the selected scope schema.',
            );
          throw parsed.error;
        }
        for (const key of keys) {
          const value =
            parsed.data[key] === undefined
              ? undefined
              : jsonSafe(parsed.data[key]);
          if (
            normalized.has(key) &&
            !isDeepStrictEqual(normalized.get(key), value)
          )
            throw invalid(
              'Template schemas normalize the same business variable inconsistently.',
            );
          normalized.set(key, value);
        }
      }
      for (const [key, value] of normalized) {
        if (value === undefined) delete candidate[key];
        else candidate[key] = value;
      }
      result.variable = jsonSafe(candidate);
    }
    // Every template sees the same final variables, but its own detached copy.
    result.systemPrompt = enteringPrompt;
    for (const scope of resolved) {
      if (scope.context?.systemPrompt !== undefined)
        result.systemPrompt = scope.context.systemPrompt;
      const template = scope.systemPromptTemplate;
      if (typeof template === 'string') result.systemPrompt = template;
      else if (template)
        result.systemPrompt = template.template({
          ...context,
          variable:
            result.variable === undefined
              ? undefined
              : structuredClone(result.variable),
          systemPrompt: result.systemPrompt,
        });
    }
    if (options.scope !== undefined) result.scope = [...options.scope];
    if (!hasTools && (!result.agentId || result.agentId === 'online'))
      result.tool = ['bash', 'skill'];
    if (
      result.skill.length &&
      (!result.tool.includes('bash') || !result.tool.includes('skill'))
    )
      throw invalid('Selected skills require both bash and skill tools.');
    if (
      result.agentId &&
      result.agentId !== 'online' &&
      (result.skill.length ||
        result.tool.includes('bash') ||
        result.tool.includes('skill'))
    )
      throw invalid('Sandbox tools are only supported by the native backend.');
    if (result.webSearch && result.agentId && result.agentId !== 'online')
      throw invalid('Web search is only supported by the native backend.');
    result.toolVersions = Object.fromEntries(
      effectiveTools(result).map((name) => {
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
  ): Record<string, Tool<unknown, OnlineAgentJson, OnlineAgentToolContext>> {
    return Object.fromEntries(
      effectiveTools(config).map((name) => {
        const registered = this.tools.get(name);
        if (!registered || registered.version !== config.toolVersions[name])
          throw invalid(`Tool ${name} has changed or is unavailable.`);
        const definition = registered.resolve(resolver);
        const execute = definition.execute;
        const { public: _public, ...sdkDefinition } = definition;
        const bound = {
          ...sdkDefinition,
          ...(definition.toModelOutput
            ? {
                toModelOutput: (
                  options: Parameters<
                    NonNullable<typeof definition.toModelOutput>
                  >[0],
                ) =>
                  definition.toModelOutput!({
                    ...options,
                    input: structuredClone(options.input),
                    output: strictJson(options.output),
                  }),
              }
            : {}),
          execute: (input: unknown, options: Parameters<typeof execute>[1]) => {
            context.signal.throwIfAborted();
            const result = execute(input, options);
            if (resultMethod(result, Symbol.asyncIterator)) {
              const iterable = result as AsyncIterable<unknown>;
              let done!: () => void;
              track(
                new Promise<void>((resolve) => {
                  done = resolve;
                }),
              );
              return (async function* () {
                let yielded = false;
                try {
                  for await (const value of iterable) {
                    yield strictJson(
                      resultMethod(value, 'then') ? await value : value,
                    );
                    yielded = true;
                  }
                  if (!yielded)
                    throw invalid(
                      'A tool result stream must yield a JSON value.',
                    );
                } finally {
                  done();
                }
              })();
            }
            // Validate synchronous values before any caller can mutate them; await only SDK promises.
            const task = resultMethod(result, 'then')
              ? Promise.resolve(result).then(strictJson)
              : Promise.resolve(strictJson(result));
            track(task);
            return task;
          },
        } as Tool<unknown, OnlineAgentJson, OnlineAgentToolContext>;
        return [name, bound];
      }),
    );
  }

  toolDefinition(
    name: string,
    resolver?: ServiceResolver,
  ):
    | OnlineAgentToolDefinition<
        unknown,
        OnlineAgentJson,
        OnlineAgentToolContext
      >
    | undefined {
    return this.tools.get(name)?.resolve(resolver);
  }

  publicProjection(
    name: string,
    resolver?: ServiceResolver,
  ):
    | {
        input(value: unknown): OnlineAgentJson;
        output(value: unknown): OnlineAgentJson;
      }
    | undefined {
    return this.tools.get(name)?.resolve(resolver).public;
  }
}
