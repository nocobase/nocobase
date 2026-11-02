import ts from 'typescript';
import type { FoundationApiCondition } from '../shared/foundation.js';
import {
  databaseSuccessGuard,
  databaseAvailable,
  middlewareContract,
  importedContract,
} from './api-contracts.js';
import type { SourceEvidence } from './source-evidence.js';
import {
  handlerContinuation,
  type Continuation,
} from './handler-continuation.js';
import { StaticValues } from './static-values.js';
import {
  objectProperty,
  returned,
  REPOSITORY_ACTIONS,
  type ApiReference,
} from './request-evidence.js';

export interface EndpointEvidence extends ApiReference {
  readonly providers: readonly string[];
  readonly collections?: readonly string[];
  readonly continuation?: Continuation;
  readonly uncertain?: boolean;
  readonly conditions?: readonly FoundationApiCondition[];
}

/** Compose only routers reachable from the selected API exports, retaining method and handler boundaries. */
export function apiDependencies(
  entry: ts.SourceFile,
  sources: readonly {
    readonly ast: ts.SourceFile;
  }[],
  analysis: SourceEvidence,
  providers: (
    file: string,
    nodes: readonly ts.Node[],
    bindings?: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
  ) => { providers: readonly string[]; collections: readonly string[] },
): EndpointEvidence[] {
  type Bindings = ReadonlyMap<ts.Declaration, readonly ts.Node[]>;
  const values = new StaticValues(analysis);
  const containsBodyLimiter = (
    node: ts.Node,
    resolver: StaticValues,
  ): boolean => {
    if (ts.isCallExpression(node) && resolver.bodyLimitInvocation(node))
      return true;
    let found = false;
    ts.forEachChild(node, (child) => {
      if (!found) found = containsBodyLimiter(child, resolver);
    });
    return found;
  };
  const factoryBindings = new Map<ts.SignatureDeclaration, Bindings>();
  let currentFactory: ts.SignatureDeclaration | undefined;
  const instances = new Map<
    ts.SignatureDeclaration | undefined,
    Map<ts.Node, ts.Node>
  >();
  const instance = (node: ts.NewExpression): ts.Node => {
    let parent: ts.Node | undefined = node.parent;
    while (parent && !ts.isFunctionLike(parent)) parent = parent.parent;
    const owner = parent ? currentFactory : undefined;
    let scope = instances.get(owner);
    if (!scope) instances.set(owner, (scope = new Map<ts.Node, ts.Node>()));
    let value = scope.get(node);
    if (!value) {
      value = ts.factory.createNewExpression(
        node.expression,
        node.typeArguments,
        node.arguments,
      );
      ts.setOriginalNode(value, node);
      (value as ts.Node & { parent: ts.Node }).parent = node.parent;
      scope.set(node, value);
    }
    return value;
  };
  const evaluate = Symbol('evaluate handler in mounted order');
  type PendingEndpoint = EndpointEvidence & {
    [evaluate]?: (authorized: boolean) => EndpointEvidence;
  };
  const endpoints: PendingEndpoint[] = [];
  const contributions: ((
    { router: ts.Node } | { endpoint: EndpointEvidence }
  ) & {
    factory?: ts.SignatureDeclaration;
    uncertain?: boolean;
  })[] = [];
  const guards = new Map<ts.SignatureDeclaration, ts.IfStatement | undefined>();
  const guardFor = (
    factory: ts.SignatureDeclaration,
  ): ts.IfStatement | undefined => {
    if (!guards.has(factory))
      guards.set(factory, databaseSuccessGuard(factory, analysis));
    return guards.get(factory);
  };
  const addRoot = (
    router: ts.Node,
    factory?: ts.SignatureDeclaration,
  ): void => {
    if (
      contributions.some(
        (item) =>
          'router' in item &&
          item.router === router &&
          item.factory === factory,
      )
    )
      return;
    contributions.push({
      router,
      factory,
      uncertain: factory
        ? returned(factory).length !== 1 && !guardFor(factory)
        : false,
    });
  };
  const invokedFactories = new Set<ts.SignatureDeclaration>();
  const visited = new Map<ts.Node, Set<ts.SignatureDeclaration | undefined>>();
  const imported = (node: ts.Node, module: string, name: string): boolean =>
    importedContract(node, analysis, module, name);
  let writtenDeclarations: Set<ts.Declaration> | undefined;
  const written = (node: ts.Node): boolean => {
    if (!writtenDeclarations) {
      writtenDeclarations = new Set();
      const inspect = (value: ts.Node): void => {
        let target: ts.Node | undefined =
          ts.isBinaryExpression(value) &&
          value.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          value.operatorToken.kind <= ts.SyntaxKind.LastAssignment
            ? value.left
            : ts.isDeleteExpression(value)
              ? value.expression
              : undefined;
        while (
          target &&
          (ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target))
        )
          target = target.expression;
        if (target && ts.isIdentifier(target))
          for (const declaration of analysis.declarations(target))
            writtenDeclarations!.add(declaration);
        ts.forEachChild(value, inspect);
      };
      for (const source of sources) inspect(source.ast);
    }
    return analysis
      .declarations(node)
      .some((declaration) => writtenDeclarations!.has(declaration));
  };
  const forwardedRouter = (node: ts.Node): ts.Node | false | undefined => {
    while (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node)
    )
      node = node.expression;
    if (ts.isIdentifier(node)) {
      const declarations = analysis.declarations(node);
      const declaration =
        declarations.length === 1 ? declarations[0] : undefined;
      if (
        !declaration ||
        !ts.isVariableDeclaration(declaration) ||
        !declaration.initializer ||
        !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const)
      )
        return undefined;
      node = declaration.initializer;
    }
    if (!ts.isCallExpression(node)) return undefined;
    const functions = analysis.functions(node.expression);
    const fn = functions.length === 1 ? functions[0] : undefined;
    if (!fn) return undefined;
    if (
      written(node.expression) ||
      ts
        .getModifiers(fn as ts.FunctionLikeDeclaration)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ||
      ('asteriskToken' in fn && fn.asteriskToken)
    )
      return false;
    const declaration = analysis.declarations(node.expression)[0];
    if (
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const)
    )
      return false;
    const results = returned(fn);
    if (results.some(written)) return false;
    const positions = results.map((result) => {
      const declarations = ts.isIdentifier(result)
        ? analysis.declarations(result)
        : [];
      return declarations.length === 1 &&
        ts.isParameter(declarations[0]) &&
        !written(result)
        ? fn.parameters.indexOf(declarations[0])
        : -1;
    });
    return positions.length > 0 &&
      positions.every((position) => position >= 0 && position === positions[0])
      ? node.arguments[positions[0]]
      : undefined;
  };
  const identity = (
    node: ts.Node,
    seen = new Set<ts.Node>(),
    bindings: Bindings = new Map(),
  ): ts.Node | undefined => {
    if (seen.has(node)) return undefined;
    seen.add(node);
    if (values.fork(bindings).nativeRepositoryRouter(node)) return node;
    if (
      ts.isCallExpression(node) &&
      values.fork(bindings).contributionKind(node)
    )
      return undefined;
    // A local helper that registers on a router and returns that same parameter, such as `guard(new Hono())`. Its
    // registrations are visited where the call is evaluated, with the parameter bound to the argument.
    const forwarded = forwardedRouter(node);
    if (forwarded === false) return undefined;
    if (forwarded) {
      const result = identity(forwarded, seen, bindings);
      if (result) return result;
    }
    for (const value of values.fork(bindings).values(node)) {
      if (
        ts.isNewExpression(value) &&
        imported(value.expression, 'hono', 'Hono')
      )
        return instance(value);
      if (
        ts.isCallExpression(value) &&
        ts.isPropertyAccessExpression(value.expression)
      ) {
        const parent = identity(value.expression.expression, seen, bindings);
        return parent && value.expression.name.text === 'basePath'
          ? value
          : parent;
      }
      if (value !== node) {
        const result = identity(value, seen, bindings);
        if (result) return result;
      }
    }
    return undefined;
  };
  const repository = (
    call: ts.CallExpression,
    factory?: ts.SignatureDeclaration,
  ): void => {
    const option = call.arguments[0];
    for (const config of option ? analysis.values(option) : []) {
      if (!ts.isObjectLiteralExpression(config)) continue;
      const declared = objectProperty(config, 'repositories');
      for (const array of declared ? analysis.values(declared) : []) {
        if (!ts.isArrayLiteralExpression(array)) continue;
        for (const element of array.elements)
          for (const exposure of analysis.values(element)) {
            if (!ts.isObjectLiteralExpression(exposure)) continue;
            const name = objectProperty(exposure, 'name');
            const actions = objectProperty(exposure, 'actions');
            const collection = objectProperty(exposure, 'collection');
            const names = name
              ? analysis.values(name).filter(ts.isStringLiteralLike)
              : [];
            const collectionName = collection
              ? analysis.values(collection).find(ts.isStringLiteralLike)?.text
              : names[0]?.text;
            for (const actionObject of actions
              ? analysis.values(actions)
              : []) {
              if (!ts.isObjectLiteralExpression(actionObject)) continue;
              for (const action of actionObject.properties) {
                const key =
                  action.name &&
                  (ts.isIdentifier(action.name) ||
                    ts.isStringLiteralLike(action.name))
                    ? action.name.text
                    : '';
                if (!REPOSITORY_ACTIONS.has(key)) continue;
                for (const exposureName of names)
                  contributions.push({
                    factory,
                    endpoint: {
                      path: `${exposureName.text}/${key}`,
                      method: 'POST',
                      continuation: 'stop',
                      providers: ['@nocobase/db'],
                      ...(collectionName
                        ? { collections: [collectionName] }
                        : {}),
                    },
                  });
              }
            }
          }
      }
    }
  };
  const root = (
    node: ts.Node,
    factory?: ts.SignatureDeclaration,
    bindings: Bindings = new Map(),
  ): void => {
    let contexts = visited.get(node);
    if (!contexts) visited.set(node, (contexts = new Set()));
    if (contexts.has(factory)) return;
    contexts.add(factory);
    const literals = values.fork(bindings);
    for (const value of literals.values(node)) {
      if (ts.isArrayLiteralExpression(value))
        value.elements.forEach((child) =>
          root(
            ts.isSpreadElement(child) ? child.expression : child,
            factory,
            bindings,
          ),
        );
      else if (ts.isFunctionLike(value)) {
        const scope = literals.capturedBindings(value);
        factoryBindings.set(value, scope);
        const previous = currentFactory;
        currentFactory = value;
        try {
          returned(value).forEach((child) => root(child, value, scope));
        } finally {
          currentFactory = previous;
        }
      } else if (ts.isObjectLiteralExpression(value)) {
        const scope = objectProperty(value, 'scope'),
          factoryValue = objectProperty(value, 'createRouter');
        const names = scope ? literals.strings(scope) : [];
        if (names.length === 1 && names[0] === 'root') continue;
        const functions = factoryValue
          ? literals.values(factoryValue).filter(ts.isFunctionLike)
          : [];
        if (
          names.length === 1 &&
          names[0] === 'api' &&
          functions.length === 1
        ) {
          if (functions[0].parameters[0])
            analysis.routeApplications.add(functions[0].parameters[0]);
          root(functions[0], factory, literals.capturedBindings(functions[0]));
        } else
          contributions.push({
            factory,
            endpoint: {
              path: '/*',
              method: 'ALL',
              providers: [],
              uncertain: true,
            },
          });
      } else if (ts.isCallExpression(value)) {
        if (
          imported(
            value.expression,
            '@nocobase/app-server/router',
            'defineRootRoutes',
          )
        ) {
          // Root routes are mounted outside /api and cannot intercept this request chain.
        } else if (
          imported(
            value.expression,
            '@nocobase/app-server/router',
            'defineRepositoryApiRoutes',
          )
        )
          repository(value, factory);
        else if (
          imported(
            value.expression,
            '@nocobase/app-server/router',
            'defineApiRoutes',
          )
        )
          value.arguments.forEach((child) =>
            root(child, factory, literals.capturedBindings(value)),
          );
        else {
          const router = identity(value, new Set(), bindings);
          if (router) addRoot(router, factory);
          else
            contributions.push({
              factory,
              endpoint: {
                path: '/*',
                method: 'ALL',
                providers: [],
                uncertain: true,
              },
            });
        }
      } else {
        const router = identity(value, new Set(), bindings);
        if (router) addRoot(router, factory);
        else
          contributions.push({
            factory,
            endpoint: {
              path: '/*',
              method: 'ALL',
              providers: [],
              uncertain: true,
            },
          });
      }
    }
  };
  for (const statement of entry.statements) {
    if (ts.isExportAssignment(statement)) root(statement.expression);
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.modifiers?.some(
        (item) => item.kind === ts.SyntaxKind.DefaultKeyword,
      )
    )
      root(statement);
  }
  const join = (a: string, b: string): string =>
    '/' + [a, b].join('/').split('/').filter(Boolean).join('/');
  interface Router {
    base: string;
    uncertain?: boolean;
    entries: PendingEndpoint[];
  }
  const routers = new Map<ts.Node, Router>();
  // Repeated construction inside one factory needs activation identity. Until that identity is available, refuse
  // the shared syntax node rather than combine two runtime routers and attribute an unselected handler.
  let invocationSite: ts.CallExpression | undefined;
  let iteration = 0;
  let currentIteration = 0;
  const constructorSites = new Map<ts.Node, Set<string>>();
  const syntaxIds = new WeakMap<ts.Node, number>();
  let nextSyntaxId = 0;
  const syntaxId = (node: ts.Node): number => {
    let value = syntaxIds.get(node);
    if (!value) {
      value = ++nextSyntaxId;
      syntaxIds.set(node, value);
    }
    return value;
  };
  const state = (node: ts.Node, bindings: Bindings): Router => {
    const known = routers.get(node);
    if (known) return known;
    let router: Router = { base: '', entries: [] };
    const native = values.fork(bindings).nativeRepositoryRouter(node);
    if (native) {
      const start = contributions.length;
      repository(native);
      router.entries.push(
        ...contributions
          .splice(start)
          .flatMap((item) => ('endpoint' in item ? [item.endpoint] : [])),
      );
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const parent = identity(node.expression.expression, new Set(), bindings);
      const base =
        node.arguments[0] &&
        new StaticValues(analysis, bindings).strings(node.arguments[0]);
      if (parent) {
        const original = state(parent, bindings);
        router = {
          base:
            base?.length === 1 ? join(original.base, base[0]) : original.base,
          entries: original.entries,
          uncertain: original.uncertain || base?.length !== 1,
        };
      }
    }
    routers.set(node, router);
    return router;
  };
  const modules = new Map(
    sources.map((source) => [source.ast.fileName, source.ast]),
  );
  const initialized = new Set<string>();
  let visits = 0;
  let exhausted = false;
  let successGuard: ts.IfStatement | undefined;
  let conditions: readonly FoundationApiCondition[] = [];
  const barrier = (router: Router, method = 'ALL'): void => {
    router.entries.push({
      path: join(router.base, '*'),
      method,
      providers: [],
      uncertain: true,
    });
  };
  type Exit = 'return' | 'throw' | 'break' | 'continue' | 'unknown';
  const visit = (
    node: ts.Node,
    bindings: Bindings = new Map(),
    active = new Set<ts.Node>(),
    uncertain = false,
  ): Exit | undefined => {
    if (++visits > 100_000 || active.size >= 32) {
      exhausted = true;
      return;
    }
    if (ts.isFunctionLike(node)) return;
    // This branch is excluded only under the recorded database-available condition.
    if (node === successGuard) return;
    if (ts.isTypeNode(node)) return;
    if (ts.isSourceFile(node) || ts.isBlock(node)) {
      let pendingExit = false;
      for (const statement of node.statements) {
        const exit = visit(
          statement,
          bindings,
          active,
          uncertain || pendingExit,
        );
        if (exit === 'unknown') pendingExit = true;
        else if (exit) return pendingExit ? 'unknown' : exit;
        if (
          (ts.isExpressionStatement(statement) ||
            ts.isVariableStatement(statement)) &&
          values.fork(bindings).definitelyTerminates(statement)
        )
          return pendingExit ? 'unknown' : 'throw';
      }
      return pendingExit ? 'unknown' : undefined;
    }
    if (ts.isReturnStatement(node) || ts.isThrowStatement(node)) {
      if (node.expression) visit(node.expression, bindings, active, uncertain);
      return ts.isReturnStatement(node) ? 'return' : 'throw';
    }
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node))
      return node.label
        ? 'unknown'
        : ts.isBreakStatement(node)
          ? 'break'
          : 'continue';
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      // Defining a class does not run instance fields, constructors or methods.
      for (const clause of node.heritageClauses ?? [])
        if (clause.token === ts.SyntaxKind.ExtendsKeyword)
          for (const type of clause.types)
            visit(type.expression, bindings, active, true);
      let exit: Exit | undefined;
      for (const member of node.members) {
        if (member.name && ts.isComputedPropertyName(member.name))
          visit(member.name.expression, bindings, active, true);
        if (ts.isClassStaticBlockDeclaration(member))
          exit = visit(member.body, bindings, active, uncertain) ?? exit;
        else if (
          ts.isPropertyDeclaration(member) &&
          member.initializer &&
          member.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
          )
        )
          visit(
            member.initializer,
            bindings,
            active,
            uncertain || Boolean(node.heritageClauses?.length),
          );
      }
      return exit;
    }
    if (ts.isNewExpression(node)) {
      const router = identity(node, new Set(), bindings);
      if (router) {
        const value = state(router, bindings),
          sites = constructorSites.get(router) ?? new Set<string>();
        sites.add(`${syntaxId(invocationSite ?? node)}:${currentIteration}`);
        constructorSites.set(router, sites);
        if (sites.size > 1) {
          value.uncertain = true;
          value.entries = value.entries.map((endpoint) => ({
            ...endpoint,
            uncertain: true,
          }));
        }
      }
      visit(node.expression, bindings, active, uncertain);
      node.arguments?.forEach((argument) =>
        visit(argument, bindings, active, uncertain),
      );
      const classes = analysis
        .values(node.expression)
        .filter(
          (value) =>
            ts.isClassDeclaration(value) || ts.isClassExpression(value),
        );
      for (const argument of node.arguments ?? []) {
        const router = identity(argument, new Set(), bindings);
        if (router) barrier(state(router, bindings));
      }
      for (const value of classes) {
        if (active.has(value)) {
          exhausted = true;
          continue;
        }
        const instanceActive = new Set(active).add(value);
        if (value.heritageClauses?.length) {
          // Inherited initialization is outside the supported construction subset.
          for (const router of routers.values()) barrier(router);
        }
        // Instance initialization is recognized only as uncertain registration, without interpreting class construction.
        for (const member of value.members) {
          if (
            ts.isPropertyDeclaration(member) &&
            member.initializer &&
            !member.modifiers?.some(
              (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
            )
          )
            visit(member.initializer, bindings, instanceActive, true);
          if (ts.isConstructorDeclaration(member) && member.body)
            visit(member.body, bindings, instanceActive, true);
        }
      }
      return;
    }
    const literals = values.fork(bindings);
    if (
      ts.isIfStatement(node) &&
      literals.expressionBarrier(node.expression) === 'continues'
    ) {
      const truth = literals.booleans(node.expression);
      if (truth.length === 1)
        return truth[0]
          ? visit(node.thenStatement, bindings, active, uncertain)
          : node.elseStatement
            ? visit(node.elseStatement, bindings, active, uncertain)
            : undefined;
    }
    if (ts.isForOfStatement(node)) {
      const arrays = literals
        .values(node.expression)
        .filter(ts.isArrayLiteralExpression);
      const declaration =
        ts.isVariableDeclarationList(node.initializer) &&
        node.initializer.declarations[0];
      if (
        arrays.length === 1 &&
        arrays[0].elements.length <= 32 &&
        declaration &&
        !arrays[0].elements.some(ts.isSpreadElement)
      ) {
        let pendingExit = false;
        for (const element of arrays[0].elements) {
          const context = new Map(bindings).set(
            declaration,
            literals.values(element),
          );
          const previousIteration = currentIteration;
          currentIteration = ++iteration;
          const exit = visit(
            node.statement,
            context,
            active,
            uncertain || pendingExit,
          );
          currentIteration = previousIteration;
          if (exit === 'break') return pendingExit ? 'unknown' : undefined;
          if (exit === 'return' || exit === 'throw')
            return pendingExit ? 'unknown' : exit;
          if (exit === 'unknown') pendingExit = true;
        }
        return pendingExit ? 'unknown' : undefined;
      }
      return visit(node.statement, bindings, active, true)
        ? 'unknown'
        : undefined;
    }
    if (ts.isCallExpression(node)) {
      // Evaluate fluent receivers before their outer registration. Handler functions are not registration code.
      visit(node.expression, bindings, active, uncertain);
      node.arguments.forEach((argument) =>
        visit(argument, bindings, active, uncertain),
      );
      if (ts.isPropertyAccessExpression(node.expression)) {
        const owner = identity(node.expression.expression, new Set(), bindings);
        if (owner) {
          const router = state(owner, bindings);
          const method = node.expression.name.text;
          const first = node.arguments[0];
          const paths = first
            ? literals.strings(first)
            : method === 'use'
              ? ['*']
              : [];
          if (method !== 'basePath' && router.uncertain) {
            barrier(router);
            return;
          }
          if (method === 'basePath') state(node, bindings);
          else if (method === 'route' && node.arguments[1]) {
            const child = identity(node.arguments[1], new Set(), bindings);
            if (child) {
              // Hono copies the child's currently registered routes at the mount call.
              for (const prefix of paths)
                for (const endpoint of [...state(child, bindings).entries])
                  router.entries.push({
                    ...endpoint,
                    conditions: [...(endpoint.conditions ?? []), ...conditions],
                    path: join(join(router.base, prefix), endpoint.path),
                    uncertain: uncertain || endpoint.uncertain,
                  });
            } else barrier(router);
            if (!paths.length) barrier(router);
          } else if (
            [
              'get',
              'post',
              'put',
              'patch',
              'delete',
              'options',
              'head',
              'all',
              'use',
            ].includes(method)
          ) {
            const handlers =
              method === 'use' && !paths.length
                ? node.arguments
                : node.arguments.slice(1);
            const expanded = handlers.flatMap((handler) => {
              if (!ts.isSpreadElement(handler)) return [handler];
              const values = literals.values(handler.expression);
              return values.length === 1 &&
                ts.isArrayLiteralExpression(values[0]) &&
                values[0].elements.length <= 32 &&
                !values[0].elements.some(ts.isSpreadElement)
                ? [...values[0].elements]
                : [handler];
            });
            const registeredPaths =
              method === 'use' && !paths.length ? ['*'] : paths;
            if (!registeredPaths.length) barrier(router, method.toUpperCase());
            for (const path of registeredPaths)
              for (const handler of expanded) {
                const contract = middlewareContract(
                  handler,
                  analysis,
                  literals.fork(literals.capturedBindings(handler)),
                );
                const functions = [handler, ...literals.values(handler)]
                  .flatMap((node) => [node, ts.getOriginalNode(node)])
                  .filter(ts.isFunctionLike);
                if (!contract)
                  for (const fn of functions) analysis.routeHandlers.add(fn);
                const captured = new Map([
                  ...bindings,
                  ...literals.capturedBindings(handler),
                ]);
                const evaluateHandler = (
                  authorized: boolean,
                ): EndpointEvidence => {
                  const previous = functions.map((fn) =>
                    analysis.authorizedHandlers.has(fn),
                  );
                  for (const fn of functions) {
                    if (authorized) analysis.authorizedHandlers.add(fn);
                    else analysis.authorizedHandlers.delete(fn);
                  }
                  analysis.authorizationScope++;
                  try {
                    const resolver = literals.fork(captured),
                      resolved = resolver.values(handler);
                    const root =
                      resolved.length === 1 && ts.isFunctionLike(resolved[0])
                        ? resolved[0]
                        : handler;
                    const evidence = providers(
                      node.getSourceFile().fileName,
                      [root],
                      new Map([
                        ...captured,
                        ...resolver.capturedBindings(root),
                      ]),
                    );
                    const continuation = handlerContinuation(
                      handler,
                      analysis,
                      resolver,
                    );
                    return {
                      path: '',
                      method: '',
                      providers: evidence.providers,
                      ...(evidence.collections.length
                        ? { collections: evidence.collections }
                        : {}),
                      continuation,
                      conditions:
                        continuation === 'next' &&
                        functions.some(
                          (fn) =>
                            'body' in fn &&
                            fn.body &&
                            containsBodyLimiter(fn.body, resolver),
                        )
                          ? [
                              {
                                kind: 'bodyWithinLimit',
                                source: 'hono/body-limit#bodyLimit',
                              },
                            ]
                          : [],
                    };
                  } finally {
                    functions.forEach((fn, index) => {
                      if (previous[index]) analysis.authorizedHandlers.add(fn);
                      else analysis.authorizedHandlers.delete(fn);
                    });
                    analysis.authorizationScope++;
                  }
                };
                router.entries.push({
                  path: join(router.base, path),
                  method:
                    method === 'use' || method === 'all'
                      ? 'ALL'
                      : method.toUpperCase(),
                  providers: contract ? (contract.providers ?? []) : [],
                  ...(!contract ? { [evaluate]: evaluateHandler } : {}),
                  continuation: contract ? 'next' : 'unknown',
                  conditions: [...conditions, ...(contract?.conditions ?? [])],
                  uncertain:
                    uncertain ||
                    registeredPaths.length !== 1 ||
                    ts.isSpreadElement(handler),
                });
              }
          } else if (method === 'on' || method === 'mount') barrier(router);
          return;
        }
      }
      if (
        imported(
          node.expression,
          '@nocobase/app-server/router',
          'defineApiRoutes',
        )
      ) {
        // The host calls exported router factories later, in contribution order.
      } else {
        const invocations = literals.invocations(node);
        const routerArguments = node.arguments.flatMap((argument) => {
          const router = identity(argument, new Set(), bindings);
          return router ? [router] : [];
        });
        if (!invocations.length)
          routerArguments.forEach((router) => barrier(state(router, bindings)));
        for (const invocation of invocations) {
          const fn = invocation.fn;
          if (!('body' in fn) || !fn.body) continue;
          if (active.has(fn)) {
            exhausted = true;
            continue;
          }
          const context = invocation.bindings,
            previousInvocation = invocationSite;
          invocationSite = node;
          visit(fn.body, context, new Set(active).add(fn), uncertain);
          invocationSite = previousInvocation;
        }
      }
      return;
    }
    const conditional =
      ts.isIfStatement(node) ||
      ts.isSwitchStatement(node) ||
      ts.isIterationStatement(node, false) ||
      ts.isTryStatement(node) ||
      ts.isConditionalExpression(node) ||
      (ts.isBinaryExpression(node) &&
        [
          ts.SyntaxKind.AmpersandAmpersandToken,
          ts.SyntaxKind.BarBarToken,
          ts.SyntaxKind.QuestionQuestionToken,
        ].includes(node.operatorToken.kind));
    let exit: Exit | undefined;
    ts.forEachChild(node, (child) => {
      const childExit = visit(
        child,
        bindings,
        active,
        uncertain || conditional,
      );
      if (childExit) exit = conditional ? 'unknown' : childExit;
    });
    return exit;
  };
  const initialize = (ast: ts.SourceFile): void => {
    if (initialized.has(ast.fileName)) return;
    initialized.add(ast.fileName);
    // Package-local imported modules initialize before the importing module; local helpers run at their call site.
    for (const statement of ast.statements) {
      if (
        !ts.isImportDeclaration(statement) &&
        !ts.isExportDeclaration(statement)
      )
        continue;
      const dependency = analysis.importedSource(statement);
      if (dependency && modules.has(dependency.fileName))
        initialize(dependency);
    }
    visit(ast);
  };
  initialize(entry);
  for (const source of sources) initialize(source.ast);
  for (const contribution of contributions) {
    const fn = contribution.factory;
    if (fn && !invokedFactories.has(fn) && 'body' in fn && fn.body) {
      invokedFactories.add(fn);
      currentFactory = fn;
      successGuard = guardFor(fn);
      conditions = successGuard ? [databaseAvailable] : [];
      visit(fn.body, factoryBindings.get(fn));
      successGuard = undefined;
      conditions = [];
      currentFactory = undefined;
    }
    if ('router' in contribution)
      endpoints.push(
        ...state(contribution.router, new Map()).entries.map((endpoint) => ({
          ...endpoint,
          uncertain: contribution.uncertain || endpoint.uncertain,
        })),
      );
    else endpoints.push(contribution.endpoint);
  }
  if (exhausted)
    return [{ path: '/*', method: 'ALL', providers: [], uncertain: true }];
  const result: EndpointEvidence[] = [];
  for (const pending of endpoints) {
    const { [evaluate]: run, ...endpoint } = pending;
    if (!run) {
      result.push(endpoint);
      continue;
    }
    const authorized = result.some(
      (prefix) =>
        !prefix.uncertain &&
        prefix.method === 'ALL' &&
        (prefix.path === '/*' ||
          prefix.path === endpoint.path ||
          (prefix.path.endsWith('/*') &&
            endpoint.path.startsWith(prefix.path.slice(0, -1)))) &&
        prefix.conditions?.some(
          (condition) => condition.kind === 'authorizationIdentityResolved',
        ),
    );
    const evaluated = run(authorized);
    result.push({
      ...endpoint,
      providers: evaluated.providers,
      ...(evaluated.collections ? { collections: evaluated.collections } : {}),
      continuation: evaluated.continuation,
      conditions: [
        ...(endpoint.conditions ?? []),
        ...(evaluated.conditions ?? []),
      ],
    });
  }
  return result;
}
