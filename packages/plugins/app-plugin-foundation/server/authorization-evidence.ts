import ts from 'typescript';
import { importedContract } from './api-contracts.js';
import { returned } from './request-evidence.js';
import type { EvidenceSource, SourceEvidence } from './source-evidence.js';

const AUTHORIZATION = '@nocobase/app-plugin-authorization';
// These official default plugin contracts do not add an opaque identity step. API Keys adds a step with a final unconditional next().
const PLUGINS = new Set(
  [
    'authentication',
    'authorization',
    'authz-default-access',
    'authz-sharing-rules',
    'authz-restriction-rules',
    'database-explorer',
    'users',
    'api-keys',
    'i18n',
    'notification',
    'notification-in-app',
    'notification-providers',
    'file',
    'scheduler',
    'mail',
    'foundation',
  ].map((name) => `@nocobase/app-plugin-${name}/server`),
);
const NAMESPACES = new Set([
  'database',
  'pages',
  'settings',
  'ui',
  'permissionSets',
  'resourceTypes',
  'compositeResources',
  'recordAccess',
  'constraints',
  'subjects',
  'routes',
]);

export function authorizationToken(
  node: ts.Node,
  analysis: SourceEvidence,
): boolean {
  return [AUTHORIZATION, `${AUTHORIZATION}/server`].some((module) =>
    importedContract(node, analysis, module, 'authorizationToken'),
  );
}

/** A closed application registration context, independent of business names, paths and service tokens. */
export function authorizationProgram(
  analysis: SourceEvidence,
  sources: readonly EvidenceSource[],
  entries: {
    runtime?: string;
    plugins?: string;
    authorization?: string;
    providers?: string;
  },
): boolean {
  if (!entries.runtime || !entries.plugins || !entries.authorization)
    return false;
  let visits = 0;
  const nodes: ts.Node[] = [];
  const scan = (node: ts.Node): void => {
    if (++visits > 100_000 || ts.isTypeNode(node)) return;
    nodes.push(node);
    ts.forEachChild(node, scan);
  };
  sources.forEach((source) => scan(source.ast));
  if (visits > 100_000) return false;
  const protectedBindings = new Set<ts.Declaration>();
  const protectedValues = new Set<ts.Node>();
  const value = (node: ts.Node): ts.Node | undefined => {
    if (ts.isIdentifier(node))
      for (const declaration of analysis.declarations(node))
        if (ts.isVariableDeclaration(declaration))
          protectedBindings.add(declaration);
    const values = analysis.values(node);
    if (values.length === 1) protectedValues.add(values[0]);
    return values.length === 1 ? values[0] : undefined;
  };
  const exported = (file: string): ts.Node | undefined => {
    const ast = sources.find((source) => source.file === file)?.ast;
    const exports = ast?.statements.filter(ts.isExportAssignment);
    return exports?.length === 1 ? value(exports[0].expression) : undefined;
  };
  const property = (
    object: ts.ObjectLiteralExpression,
    name: string,
  ): ts.Expression | undefined => {
    const matches = object.properties.filter(
      (p) => p.name && ts.isIdentifier(p.name) && p.name.text === name,
    );
    if (matches.length !== 1) return undefined;
    const p = matches[0];
    return ts.isPropertyAssignment(p)
      ? p.initializer
      : ts.isShorthandPropertyAssignment(p)
        ? p.name
        : undefined;
  };
  const object = (
    node: ts.Node | undefined,
  ): node is ts.ObjectLiteralExpression =>
    !!node &&
    ts.isObjectLiteralExpression(node) &&
    node.properties.every(
      (p) =>
        (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) &&
        !ts.isComputedPropertyName(p.name),
    );
  const runtime = exported(entries.runtime);
  if (
    !runtime ||
    !ts.isCallExpression(runtime) ||
    runtime.arguments.length !== 1 ||
    !importedContract(
      runtime.expression,
      analysis,
      '@nocobase/app-server/runtime',
      'defineAppRuntime',
    )
  )
    return false;
  const definition = value(runtime.arguments[0]);
  if (!object(definition)) return false;
  const plugins = exported(entries.plugins);
  const registered = property(definition, 'plugins');
  if (
    !plugins ||
    !registered ||
    value(registered) !== plugins ||
    !ts.isCallExpression(plugins) ||
    plugins.arguments.length !== 1 ||
    !importedContract(
      plugins.expression,
      analysis,
      '@nocobase/app-server/plugins',
      'defineServerPlugins',
    )
  )
    return false;
  const list = value(plugins.arguments[0]);
  if (!list || !ts.isArrayLiteralExpression(list) || list.elements.length > 32)
    return false;
  let official = 0;
  const registrations = new Set<string>();
  for (const plugin of list.elements) {
    const declarations = analysis.symbol(plugin)?.declarations ?? [];
    if (
      declarations.length !== 1 ||
      !ts.isImportClause(declarations[0]) ||
      declarations[0].isTypeOnly
    )
      return false;
    protectedBindings.add(declarations[0]);
    const statement = declarations[0].parent;
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier) ||
      !analysis.isExternalImport(statement) ||
      !PLUGINS.has(statement.moduleSpecifier.text) ||
      registrations.has(statement.moduleSpecifier.text)
    )
      return false;
    registrations.add(statement.moduleSpecifier.text);
    if (statement.moduleSpecifier.text === `${AUTHORIZATION}/server`)
      official++;
  }
  if (official !== 1) return false;
  // Configuration factories may install arbitrary identity middleware through plugin.setup. Only the exact official, option-free constructors are covered here.
  const config = exported(entries.authorization);
  if (
    !config ||
    !ts.isCallExpression(config) ||
    config.arguments.length !== 1 ||
    !importedContract(
      config.expression,
      analysis,
      '@nocobase/app-server/config',
      'defineAppConfig',
    )
  )
    return false;
  const factory = config.arguments[0];
  if (
    !ts.isArrowFunction(factory) ||
    ts.isBlock(factory.body) ||
    ts.getModifiers(factory)?.length
  )
    return false;
  const settings = value(factory.body);
  if (!object(settings)) return false;
  const configured = property(settings, 'plugins');
  if (configured) {
    const extensions = value(configured);
    if (
      !extensions ||
      !ts.isArrayLiteralExpression(extensions) ||
      extensions.elements.length > 32
    )
      return false;
    for (const extension of extensions.elements) {
      if (
        !ts.isCallExpression(extension) ||
        extension.arguments.length ||
        !['defaultAccess', 'sharingRules', 'restrictionRules'].some((name) =>
          importedContract(
            extension.expression,
            analysis,
            `@nocobase/app-plugin-authz-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}/server`,
            name,
          ),
        )
      )
        return false;
    }
  }
  // Require the inspected authorization defaults to be the runtime's actual defaults, not an unused sibling file.
  const defaultsRef = property(definition, 'defaultConfigs');
  const defaults = defaultsRef && value(defaultsRef);
  if (
    !defaults ||
    !ts.isCallExpression(defaults) ||
    defaults.arguments.length !== 1 ||
    !importedContract(
      defaults.expression,
      analysis,
      '@nocobase/app-server/config',
      'defaultAppConfigs',
    )
  )
    return false;
  const defaultsObject = value(defaults.arguments[0]);
  if (!object(defaultsObject)) return false;
  const authDefaults = property(defaultsObject, 'authorization');
  if (!authDefaults || value(authDefaults) !== config) return false;

  const providerRef = property(definition, 'serviceProviders');
  if (providerRef) {
    const providers = value(providerRef);
    if (
      !entries.providers ||
      providers !== exported(entries.providers) ||
      !providers ||
      !ts.isArrayLiteralExpression(providers) ||
      providers.elements.length > 32
    )
      return false;
    for (const element of providers.elements) {
      const provider = value(element);
      if (
        !provider ||
        !ts.isClassDeclaration(provider) ||
        !provider.heritageClauses?.some(
          (clause) =>
            clause.token === ts.SyntaxKind.ExtendsKeyword &&
            clause.types.some((type) =>
              importedContract(
                type.expression,
                analysis,
                '@nocobase/service-provider',
                'ServiceProvider',
              ),
            ),
        )
      )
        return false;
      protectedBindings.add(provider);
    }
  }
  // Alternate imports of a registered plugin must not provide an unobserved mutation path to the same module singleton.
  for (const node of nodes) {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteralLike(node.moduleSpecifier) ||
      node.importClause?.isTypeOnly
    )
      continue;
    const module = node.moduleSpecifier.text;
    const clause = node.importClause;
    if (clause?.name && PLUGINS.has(module)) protectedBindings.add(clause);
    const named = clause?.namedBindings;
    const sensitive = [
      AUTHORIZATION,
      `${AUTHORIZATION}/server`,
      '@nocobase/authorization/core',
      '@nocobase/app-server/application',
    ].includes(module);
    if (sensitive && named && !ts.isNamedImports(named)) return false;
    if (named && ts.isNamedImports(named))
      for (const specifier of named.elements) {
        if (specifier.isTypeOnly) continue;
        const name = specifier.propertyName?.text ?? specifier.name.text;
        if (
          sensitive &&
          ![
            'authorizationToken',
            'defineDatabasePermission',
            'defineCompositeResource',
            'defineRecordAccess',
          ].includes(name)
        )
          return false;
        if (
          module === '@nocobase/service-provider' &&
          ['ServiceProvider', 'ServiceContainer'].includes(name)
        )
          protectedBindings.add(specifier);
      }
  }
  // Declarations are a proof only while their objects and factories cannot be changed or passed to other setup code.
  for (const node of nodes) {
    if (!ts.isIdentifier(node)) continue;
    const declarations = [
      ...analysis.declarations(node),
      ...(analysis.symbol(node)?.declarations ?? []),
    ];
    if (!declarations.some((declaration) => protectedBindings.has(declaration)))
      continue;
    const parent = node.parent;
    if (
      (ts.isVariableDeclaration(parent) ||
        ts.isImportClause(parent) ||
        ts.isClassDeclaration(parent)) &&
      parent.name === node
    )
      continue;
    if (ts.isImportSpecifier(parent)) continue;
    if (ts.isExportAssignment(parent)) continue;
    if (ts.isExpressionWithTypeArguments(parent)) continue;
    if (ts.isArrayLiteralExpression(parent) && protectedValues.has(parent))
      continue;
    if (
      ts.isPropertyAssignment(parent) &&
      parent.initializer === node &&
      protectedValues.has(parent.parent)
    )
      continue;
    if (
      ts.isShorthandPropertyAssignment(parent) &&
      protectedValues.has(parent.parent)
    )
      continue;
    if (
      ts.isCallExpression(parent) &&
      [runtime, plugins, config, defaults].includes(parent)
    )
      continue;
    if (
      ts.isCallExpression(parent) &&
      importedContract(
        parent.expression,
        analysis,
        '@nocobase/app-server/runtime',
        'resolveAppRuntime',
      ) &&
      parent.arguments[0] === node
    )
      continue;
    if (
      ts.isShorthandPropertyAssignment(parent) &&
      ts.isObjectLiteralExpression(parent.parent) &&
      ts.isCallExpression(parent.parent.parent) &&
      importedContract(
        parent.parent.parent.expression,
        analysis,
        '@nocobase/app-server/node',
        'defineStandaloneServer',
      )
    )
      continue;
    return false;
  }

  type Kind = 'app' | 'container' | 'config' | 'authorization' | 'runtime';
  const memo = new Map<ts.Node, Kind | undefined>();
  const kind = (node: ts.Node, seen = new Set<ts.Node>()): Kind | undefined => {
    if (memo.has(node)) return memo.get(node);
    if (++visits > 100_000 || seen.has(node) || seen.size >= 32)
      return undefined;
    const next = new Set(seen).add(node);
    const get = (child: ts.Node): Kind | undefined => kind(child, next);
    let result: Kind | undefined;
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isAwaitExpression(node)
    )
      result = get(node.expression);
    else if (ts.isIdentifier(node)) {
      const declarations = analysis.declarations(node);
      if (declarations.length === 1) result = get(declarations[0]);
    } else if (ts.isVariableDeclaration(node) && node.initializer)
      result = get(node.initializer);
    else if (
      ts.isBindingElement(node) &&
      ts.isObjectBindingPattern(node.parent)
    ) {
      const owner = get(node.parent.parent);
      const name = node.propertyName ?? node.name;
      if (
        owner === 'app' &&
        ts.isIdentifier(name) &&
        ['container', 'config'].includes(name.text)
      )
        result = name.text as Kind;
    } else if (ts.isParameter(node)) {
      const fn = node.parent;
      if (
        ts.isArrowFunction(fn) &&
        fn.parameters[0] === node &&
        ts.isCallExpression(fn.parent) &&
        importedContract(
          fn.parent.expression,
          analysis,
          '@nocobase/app-server/router',
          'defineApiRoutes',
        )
      )
        result = 'app';
      else if (
        ts.isFunctionDeclaration(fn) ||
        ts.isArrowFunction(fn) ||
        ts.isFunctionExpression(fn)
      ) {
        const calls = nodes.filter(
          (candidate): candidate is ts.CallExpression =>
            ts.isCallExpression(candidate) &&
            analysis.functions(candidate.expression).includes(fn),
        );
        const index = fn.parameters.indexOf(node);
        const kinds = calls.map(
          (call) => call.arguments[index] && get(call.arguments[index]),
        );
        if (kinds.length && kinds.every((item) => item === kinds[0]))
          result = kinds[0];
      }
    } else if (ts.isPropertyAccessExpression(node)) {
      const owner = get(node.expression);
      if (owner === 'app' && node.name.text === 'container')
        result = 'container';
      if (owner === 'app' && node.name.text === 'config') result = 'config';
      if (owner === 'runtime' && node.name.text === 'app') result = 'app';
      if (
        node.expression.kind === ts.SyntaxKind.ThisKeyword &&
        node.name.text === 'app'
      ) {
        let parent: ts.Node | undefined = node.parent;
        while (parent && !ts.isClassDeclaration(parent)) parent = parent.parent;
        if (
          parent &&
          ts.isClassDeclaration(parent) &&
          parent.heritageClauses?.some(
            (clause) =>
              clause.token === ts.SyntaxKind.ExtendsKeyword &&
              clause.types.some((type) =>
                importedContract(
                  type.expression,
                  analysis,
                  '@nocobase/service-provider',
                  'ServiceProvider',
                ),
              ),
          )
        )
          result = 'app';
      }
    } else if (ts.isCallExpression(node)) {
      if (
        importedContract(
          node.expression,
          analysis,
          '@nocobase/app-server/runtime',
          'createAppFromRuntime',
        )
      )
        result =
          node.arguments.length === 1 && get(node.arguments[0]) === 'runtime'
            ? 'app'
            : undefined;
      if (
        importedContract(
          node.expression,
          analysis,
          '@nocobase/app-server/runtime',
          'resolveAppRuntime',
        ) &&
        node.arguments[0] &&
        analysis.values(node.arguments[0]).length === 1 &&
        analysis.values(node.arguments[0])[0] === runtime
      )
        result = 'runtime';
      if (
        importedContract(
          node.expression,
          analysis,
          '@nocobase/app-server/runtime',
          'startApplicationInScope',
        ) &&
        node.arguments.length === 2 &&
        get(node.arguments[1]) === 'app'
      )
        result = 'app';
      if (!result) {
        const functions = analysis.functions(node.expression);
        if (functions.length === 1) {
          const results = returned(functions[0]);
          if (results.length === 1) result = get(results[0]);
        }
      }
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        get(node.expression.expression) === 'container' &&
        node.expression.name.text === 'resolve' &&
        node.arguments.length === 1 &&
        authorizationToken(node.arguments[0], analysis)
      )
        result = 'authorization';
    } else if (
      ts.isNewExpression(node) &&
      importedContract(
        node.expression,
        analysis,
        '@nocobase/app-server/config',
        'AppConfig',
      )
    )
      result = 'config';
    memo.set(node, result);
    return result;
  };
  const capabilityFunctions = new Set<ts.SignatureDeclaration>();
  const localArgument = (node: ts.Node, call: ts.CallExpression): boolean => {
    const functions = analysis.functions(call.expression);
    const index = call.arguments.indexOf(node as ts.Expression);
    if (functions.length !== 1 || index < 0 || !functions[0].parameters[index])
      return false;
    capabilityFunctions.add(functions[0]);
    return kind(functions[0].parameters[index]) === kind(node);
  };
  for (const node of nodes) {
    if (
      ts.isCallExpression(node) &&
      importedContract(
        node.expression,
        analysis,
        '@nocobase/app-server/runtime',
        'createAppFromRuntime',
      ) &&
      (node.arguments.length !== 1 || kind(node.arguments[0]) !== 'runtime')
    )
      return false;
    if (ts.isIdentifier(node) && authorizationToken(node, analysis)) {
      if (ts.isImportSpecifier(node.parent)) continue;
      const parent = node.parent;
      if (
        !ts.isCallExpression(parent) ||
        parent.arguments.length !== 1 ||
        parent.arguments[0] !== node ||
        !ts.isPropertyAccessExpression(parent.expression) ||
        !['resolve', 'has'].includes(parent.expression.name.text) ||
        kind(parent.expression.expression) !== 'container'
      )
        return false;
    }
    if (!ts.isExpression(node)) continue;
    if (
      ts.isIdentifier(node) &&
      (ts.isVariableDeclaration(node.parent) ||
        ts.isParameter(node.parent) ||
        ts.isBindingElement(node.parent)) &&
      node.parent.name === node
    )
      continue;
    const authority = kind(node);
    if (!authority) continue;
    const parent = node.parent;
    if (
      ts.isVariableDeclaration(parent) &&
      parent.initializer === node &&
      ts.isVariableDeclarationList(parent.parent) &&
      parent.parent.flags & ts.NodeFlags.Const &&
      (ts.isIdentifier(parent.name) ||
        (ts.isObjectBindingPattern(parent.name) &&
          parent.name.elements.every(
            (element) =>
              !element.dotDotDotToken &&
              !element.initializer &&
              ts.isIdentifier(element.propertyName ?? element.name) &&
              ['container', 'config'].includes(
                (element.propertyName ?? element.name).getText(),
              ),
          )))
    )
      continue;
    if (
      ts.isParameter(parent) ||
      ts.isBindingElement(parent) ||
      ts.isImportSpecifier(parent)
    )
      continue;
    if (
      (ts.isParenthesizedExpression(parent) ||
        ts.isAsExpression(parent) ||
        ts.isNonNullExpression(parent) ||
        ts.isAwaitExpression(parent)) &&
      parent.expression === node
    )
      continue;
    if (ts.isCallExpression(parent) && localArgument(node, parent)) continue;
    if (ts.isCallExpression(parent) && authority === 'runtime') {
      if (
        importedContract(
          parent.expression,
          analysis,
          '@nocobase/app-server/runtime',
          'createAppFromRuntime',
        ) &&
        parent.arguments[0] === node
      )
        continue;
      if (
        ts.isPropertyAccessExpression(parent.expression) &&
        parent.expression.name.text === 'addRuntimeContributions' &&
        kind(parent.expression.expression) === 'app' &&
        parent.arguments[0] === node
      )
        continue;
    }
    if (
      ts.isCallExpression(parent) &&
      authority === 'app' &&
      importedContract(
        parent.expression,
        analysis,
        '@nocobase/app-server/runtime',
        'startApplicationInScope',
      ) &&
      parent.arguments[1] === node
    )
      continue;
    if (
      ts.isReturnStatement(parent) &&
      authority !== 'authorization' &&
      authority !== 'container'
    ) {
      let fn: ts.Node | undefined = parent.parent;
      while (fn && !ts.isFunctionLike(fn)) fn = fn.parent;
      if (fn && ts.isFunctionDeclaration(fn)) {
        capabilityFunctions.add(fn);
        const configFactory = property(definition, 'createAppConfig');
        if (
          authority === 'config' &&
          configFactory &&
          value(configFactory) === fn
        )
          continue;
        if (
          authority === 'app' &&
          [
            entries.runtime?.replace(/runtime\.[^.]+$/, 'app'),
            entries.runtime?.replace(/runtime\.[^.]+$/, 'embedded'),
          ].some((stem) => stem && fn.getSourceFile().fileName.startsWith(stem))
        )
          continue;
      }
    }
    if (
      ts.isPropertyAccessExpression(parent) &&
      parent.expression === node &&
      !parent.questionDotToken
    ) {
      const name = parent.name.text;
      if (
        authority === 'runtime' &&
        ['env', 'environment', 'paths'].includes(name)
      ) {
        let access: ts.Node = parent;
        while (
          ts.isPropertyAccessExpression(access.parent) &&
          access.parent.expression === access
        )
          access = access.parent;
        if (!(
          ts.isBinaryExpression(access.parent) && access.parent.left === access
        ))
          continue;
      }
      if (authority === 'app' && ['container', 'config'].includes(name))
        continue;
      const call = parent.parent;
      if (authority === 'authorization' && NAMESPACES.has(name)) {
        // Namespace reads expose their own API, never the identity registry itself. Replacing one remains unknown.
        if (
          ts.isPropertyAccessExpression(call) &&
          call.expression === parent &&
          !ts.isBinaryExpression(call.parent)
        )
          continue;
        return false;
      }
      if (
        !ts.isCallExpression(call) ||
        call.expression !== parent ||
        call.questionDotToken
      )
        return false;
      if (
        authority === 'authorization' &&
        ['middleware', 'for'].includes(name)
      ) {
        if (name === 'middleware' && call.arguments.length) return false;
        continue;
      }
      if (
        authority === 'container' &&
        ['resolve', 'has', 'singleton', 'instance'].includes(name)
      ) {
        const token = call.arguments[0];
        if (!token || !ts.isIdentifier(token)) return false;
        if (
          authorizationToken(token, analysis) &&
          !['resolve', 'has'].includes(name)
        )
          return false;
        const declaration = analysis.declarations(token)[0];
        const imported = analysis.symbol(token)?.declarations?.[0];
        const own =
          declaration &&
          ts.isVariableDeclaration(declaration) &&
          declaration.initializer;
        if (
          !authorizationToken(token, analysis) &&
          !(
            imported &&
            ts.isImportSpecifier(imported) &&
            analysis.isExternalImport(
              imported.parent.parent.parent as ts.ImportDeclaration,
            )
          ) &&
          !(
            own &&
            ts.isCallExpression(own) &&
            importedContract(
              own.expression,
              analysis,
              '@nocobase/service-provider',
              'createServiceToken',
            )
          )
        )
          return false;
        continue;
      }
      if (authority === 'config' && ['get', 'loadFile'].includes(name))
        continue;
      if (
        authority === 'app' &&
        [
          'addServiceProvider',
          'addHttpMiddleware',
          'addRoutes',
          'addRuntimeContributions',
          'start',
          'shutdown',
        ].includes(name)
      ) {
        if (
          name === 'addRuntimeContributions' &&
          (call.arguments.length !== 1 || kind(call.arguments[0]) !== 'runtime')
        )
          return false;
        if (
          name === 'addRoutes' &&
          (call.arguments.length !== 1 ||
            ![
              ['@nocobase/app-server/router', 'healthCheckApiRoutes'],
              ['@nocobase/app-server/spa', 'spaRootRoutes'],
            ].some(([module, exported]) =>
              importedContract(call.arguments[0], analysis, module, exported),
            ))
        )
          return false;
        // The host entry uses the framework's contribution and provider contracts only.
        if (name === 'addServiceProvider' || name === 'addHttpMiddleware') {
          const arg = call.arguments[0];
          const imported = arg && analysis.symbol(arg)?.declarations?.[0];
          if (
            !imported ||
            !ts.isImportSpecifier(imported) ||
            !analysis.isExternalImport(
              imported.parent.parent.parent as ts.ImportDeclaration,
            )
          )
            return false;
          const statement = imported.parent.parent
            .parent as ts.ImportDeclaration;
          if (
            !ts.isStringLiteralLike(statement.moduleSpecifier) ||
            !statement.moduleSpecifier.text.startsWith('@nocobase/app-server/')
          )
            return false;
        }
        continue;
      }
    }
    // An authority must not be returned, stored in an object, overwritten, or passed to an opaque extension.
    return false;
  }
  for (const node of nodes) {
    if (!ts.isIdentifier(node)) continue;
    const declarations = analysis.declarations(node);
    if (
      !declarations.some((declaration) =>
        capabilityFunctions.has(declaration as ts.SignatureDeclaration),
      )
    )
      continue;
    const parent = node.parent;
    if (ts.isFunctionDeclaration(parent) && parent.name === node) continue;
    if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) continue;
    if (
      (ts.isShorthandPropertyAssignment(parent) ||
        ts.isPropertyAssignment(parent)) &&
      parent.parent === definition &&
      parent.name.getText() === 'createAppConfig'
    )
      continue;
    if (
      ts.isExportAssignment(parent) &&
      entries.runtime &&
      node.getSourceFile().fileName.replace(/embedded\.[^.]+$/, 'runtime') ===
        entries.runtime.replace(/\.[^.]+$/, '')
    )
      continue;
    if (ts.isCallExpression(parent) && parent.expression === node) continue;
    if (
      ts.isShorthandPropertyAssignment(parent) &&
      ts.isObjectLiteralExpression(parent.parent) &&
      ts.isCallExpression(parent.parent.parent) &&
      importedContract(
        parent.parent.parent.expression,
        analysis,
        '@nocobase/app-server/node',
        'defineStandaloneServer',
      )
    )
      continue;
    return false;
  }
  return visits <= 100_000;
}
