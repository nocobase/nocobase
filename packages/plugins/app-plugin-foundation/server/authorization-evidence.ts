import ts from 'typescript';
import { importedContract } from './api-contracts.js';
import { returned } from './request-evidence.js';
import type { EvidenceSource, SourceEvidence } from './source-evidence.js';

const AUTHORIZATION = '@nocobase/app-plugin-authorization';
// Syntax nodes and dependent queries one identity proof may visit; a larger application is reported incomplete.
const LIMIT = 1_000_000;
// Official exports returning route contributions whose `createRouter` takes the application, exactly as the host
// calls it. A wrapper may call them with the application it received.
const ROUTE_FACTORIES = [
  ['@nocobase/app-plugin-file/server', 'defineFileRepositoryApiRoutes'],
] as const;
const QUERY_LIMIT = 4_000_000;
// These official default plugin contracts do not add an opaque identity step. API Keys adds a step with a final
// unconditional next(); Agents adds authentication credential resolvers only, and Knowledge registers resources only.
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
    'agents',
    'knowledge',
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

function staticKey(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteralLike(name)
    ? name.text
    : undefined;
}

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
    if (++visits > LIMIT || ts.isTypeNode(node)) return;
    nodes.push(node);
    ts.forEachChild(node, scan);
  };
  sources.forEach((source) => scan(source.ast));
  if (visits > LIMIT) return false;
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
      (p) =>
        p.name &&
        (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name)) &&
        p.name.text === name,
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
  ): node is ts.ObjectLiteralExpression => {
    if (!node || !ts.isObjectLiteralExpression(node)) return false;
    const names = new Set<string>();
    // A missing optional property is safe only after the whole object is proven unambiguous.
    // Quoted and identifier keys share one namespace; computed keys, spreads and duplicates are unknown.
    return node.properties.every((p) => {
      if (
        !(ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) ||
        !(ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name)) ||
        names.has(p.name.text)
      )
        return false;
      names.add(p.name.text);
      return true;
    });
  };
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
  // `{ ...plugin, routes: [...] }` replaces only the plugin's route contributions; their code is part of this graph.
  const overrides = new Set<ts.Node>();
  for (const element of list.elements) {
    let plugin: ts.Node = element;
    if (ts.isObjectLiteralExpression(element)) {
      const [base, ...rest] = element.properties;
      if (
        !base ||
        !ts.isSpreadAssignment(base) ||
        !ts.isIdentifier(base.expression) ||
        rest.length > 1 ||
        !rest.every(
          (p) =>
            ts.isPropertyAssignment(p) &&
            staticKey(p.name) === 'routes' &&
            ts.isArrayLiteralExpression(p.initializer) &&
            p.initializer.elements.every(
              (route) =>
                ts.isIdentifier(route) &&
                analysis
                  .values(route)
                  .every(
                    (value) =>
                      ts.isCallExpression(value) &&
                      importedContract(
                        value.expression,
                        analysis,
                        '@nocobase/app-server/router',
                        'defineApiRoutes',
                      ),
                  ),
            ),
        )
      )
        return false;
      plugin = base.expression;
      overrides.add(base);
    }
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
            // Pure filter builders, title codecs and the denial error class.
            'condition',
            'anyScope',
            'encodeAuthorizationTitle',
            'decodeAuthorizationTitle',
            'AuthorizationDeniedError',
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
    if (ts.isSpreadAssignment(parent) && overrides.has(parent)) continue;
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

  type Authority = 'app' | 'container' | 'config' | 'authorization' | 'runtime';
  // A holder is a local object literal, array literal or class instance with an authority (or another holder) in a
  // field. Its fields are known only from the allocation, so every later use of a holder is checked like an authority.
  // Conflict marks a value whose sources disagree; no use of it is accepted.
  type Kind = Authority | 'holder' | 'conflict';
  type Site =
    | ts.ObjectLiteralExpression
    | ts.ArrayLiteralExpression
    | ts.ClassLikeDeclaration;
  type Call = ts.CallExpression | ts.NewExpression;
  const join = (a: Kind | undefined, b: Kind | undefined): Kind | undefined =>
    !a ? b : !b || a === b ? a : 'conflict';
  let exhausted = false;
  let queries = 0;
  // Monotone fixpoint queries over passes. Within a pass each node is computed once; a query still in progress reads
  // its previous approximation. Passes repeat until nothing changes, and the proof is decided only on a stable pass.
  let pass = 0;
  let changed: boolean;
  const solver = <T>(
    compute: (node: ts.Node, get: (child: ts.Node) => T) => T,
    empty: T,
    same: (a: T, b: T) => boolean,
  ): ((node: ts.Node) => T) => {
    const cache = new Map<ts.Node, T>();
    const stamp = new Map<ts.Node, number>();
    let depth = 0;
    const get = (node: ts.Node): T => {
      if (
        ts.isLiteralExpression(node) ||
        ts.isTemplateExpression(node) ||
        ts.isFunctionLike(node) ||
        ts.isTypeNode(node) ||
        node.kind === ts.SyntaxKind.TrueKeyword ||
        node.kind === ts.SyntaxKind.FalseKeyword ||
        node.kind === ts.SyntaxKind.NullKeyword
      )
        return empty;
      if (stamp.get(node) === pass)
        return cache.has(node) ? (cache.get(node) as T) : empty;
      if (++queries > QUERY_LIMIT || depth >= 512) {
        exhausted = true;
        return cache.has(node) ? (cache.get(node) as T) : empty;
      }
      stamp.set(node, pass);
      depth++;
      const result = compute(node, get);
      depth--;
      const previous = cache.has(node) ? (cache.get(node) as T) : empty;
      if (!same(previous, result)) changed = true;
      cache.set(node, result);
      return result;
    };
    return get;
  };
  const sameSites = (a: readonly ts.Node[], b: readonly ts.Node[]): boolean =>
    a.length === b.length && a.every((site) => b.includes(site));
  const unique = <T>(items: T[]): T[] => [...new Set(items)];
  const transparent = (
    node: ts.Node,
  ): node is
    | ts.ParenthesizedExpression
    | ts.AsExpression
    | ts.SatisfiesExpression
    | ts.TypeAssertion
    | ts.NonNullExpression
    | ts.AwaitExpression =>
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isAwaitExpression(node);
  const alternatives = (node: ts.Node): ts.Node[] | undefined => {
    if (ts.isConditionalExpression(node))
      return [node.whenTrue, node.whenFalse];
    if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.QuestionQuestionToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.AmpersandAmpersandToken,
      ].includes(node.operatorToken.kind)
    )
      return [node.left, node.right];
    return undefined;
  };
  const staticName = (name: ts.PropertyName | undefined): string | undefined =>
    name &&
    (ts.isIdentifier(name) ||
      ts.isPrivateIdentifier(name) ||
      ts.isStringLiteralLike(name) ||
      ts.isNumericLiteral(name))
      ? name.text
      : undefined;
  const accessName = (
    access: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  ): string | undefined => {
    if (ts.isPropertyAccessExpression(access)) return access.name.text;
    let key = access.argumentExpression;
    while (key && transparent(key)) key = key.expression;
    return key && (ts.isStringLiteralLike(key) || ts.isNumericLiteral(key))
      ? key.text
      : undefined;
  };
  // The receiver a `this` denotes: the instance for class members and the literal for its own methods.
  const thisSite = (node: ts.Node): Site | undefined => {
    let fn: ts.Node | undefined = node.parent;
    while (
      fn &&
      !ts.isClassLike(fn) &&
      !(ts.isFunctionLike(fn) && !ts.isArrowFunction(fn))
    )
      fn = fn.parent;
    if (!fn) return undefined;
    if (ts.isClassLike(fn)) return fn;
    const modifiers = ts.canHaveModifiers(fn) ? ts.getModifiers(fn) : undefined;
    if (modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword))
      return undefined;
    if (
      (ts.isConstructorDeclaration(fn) ||
        ts.isMethodDeclaration(fn) ||
        ts.isGetAccessorDeclaration(fn) ||
        ts.isSetAccessorDeclaration(fn)) &&
      (ts.isClassLike(fn.parent) || ts.isObjectLiteralExpression(fn.parent))
    )
      return fn.parent;
    if (
      ts.isFunctionExpression(fn) &&
      ts.isPropertyAssignment(fn.parent) &&
      ts.isObjectLiteralExpression(fn.parent.parent)
    )
      return fn.parent.parent;
    return undefined;
  };
  const localClass = (node: ts.Node): ts.ClassLikeDeclaration | undefined => {
    // A class destructured from a local module's `import()`.
    const binding = importedBinding(node);
    if (binding) {
      const exported = analysis
        .namespaceExport(binding.source, binding.name)
        .filter((declaration) => ts.isClassLike(declaration));
      return exported.length === 1 ? exported[0] : undefined;
    }
    const classes = analysis.values(node).filter(ts.isClassLike);
    return classes.length === 1 ? classes[0] : undefined;
  };
  // Assignments to `this.<name>` belong to the field model of the class whose instance `this` denotes.
  let classWrites: Map<ts.Node, Map<string, ts.Expression[]>> | undefined;
  const writesOf = (site: Site, name: string): ts.Expression[] => {
    if (!classWrites) {
      classWrites = new Map();
      for (const candidate of nodes) {
        if (
          !ts.isBinaryExpression(candidate) ||
          candidate.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
          !ts.isPropertyAccessExpression(candidate.left) ||
          candidate.left.expression.kind !== ts.SyntaxKind.ThisKeyword
        )
          continue;
        const owner = thisSite(candidate.left.expression);
        if (!owner || !ts.isClassLike(owner)) continue;
        const fields =
          classWrites.get(owner) ?? new Map<string, ts.Expression[]>();
        classWrites.set(owner, fields);
        const field = candidate.left.name.text;
        fields.set(field, [...(fields.get(field) ?? []), candidate.right]);
      }
    }
    return classWrites.get(site)?.get(name) ?? [];
  };
  const members = new Map<ts.Node, Map<string | undefined, ts.Node[]>>();
  // Spreads and views may refer back to the literal being read; such a cycle adds nothing, and too deep a chain
  // exhausts the proof.
  const reading = new Set<string>();
  const readingIds = new Map<ts.Node, number>();
  const memberValues = (site: Site, name: string | undefined): ts.Node[] => {
    const id = readingIds.get(site) ?? readingIds.size;
    readingIds.set(site, id);
    const key = `${id}\0${name ?? ''}\0${name === undefined ? 1 : 0}`;
    if (reading.has(key)) return [];
    if (reading.size >= 256) {
      exhausted = true;
      return [];
    }
    reading.add(key);
    try {
      return readMembers(site, name);
    } finally {
      reading.delete(key);
    }
  };
  const readMembers = (site: Site, name: string | undefined): ts.Node[] => {
    const viewed = viewMembers(site, name);
    if (viewed) return viewed;
    const known = members.get(site)?.get(name);
    if (known) return known;
    const values = computeMembers(site, name);
    // Spread members depend on other allocations, which may still be in progress; only closed literals are cached.
    if (
      !ts.isClassLike(site) &&
      (ts.isArrayLiteralExpression(site)
        ? site.elements.some(ts.isSpreadElement)
        : site.properties.some(ts.isSpreadAssignment))
    )
      return values;
    const fields =
      members.get(site) ?? new Map<string | undefined, ts.Node[]>();
    members.set(site, fields);
    fields.set(name, values);
    return values;
  };
  const computeMembers = (site: Site, name: string | undefined): ts.Node[] => {
    // A position of an array literal without spreads is exactly that element.
    if (
      ts.isArrayLiteralExpression(site) &&
      name !== undefined &&
      /^\d+$/.test(name) &&
      !site.elements.some(ts.isSpreadElement)
    ) {
      const element = site.elements[Number(name)];
      return element && !ts.isOmittedExpression(element) ? [element] : [];
    }
    if (ts.isArrayLiteralExpression(site) && name !== undefined) return [];
    if (ts.isArrayLiteralExpression(site))
      return site.elements.flatMap((element) =>
        ts.isSpreadElement(element)
          ? allocations(element.expression).flatMap((inner) =>
              memberValues(inner, undefined),
            )
          : [element],
      );
    if (ts.isObjectLiteralExpression(site))
      return site.properties.flatMap((property): ts.Node[] => {
        if (ts.isSpreadAssignment(property))
          return allocations(property.expression).flatMap((inner) =>
            memberValues(inner, name),
          );
        const key = staticName(property.name);
        if (name !== undefined && key !== undefined && key !== name) return [];
        if (ts.isPropertyAssignment(property)) return [property.initializer];
        if (ts.isShorthandPropertyAssignment(property)) return [property.name];
        return [property];
      });
    const values: ts.Node[] = [];
    for (const member of site.members) {
      const modifiers = ts.canHaveModifiers(member)
        ? ts.getModifiers(member)
        : undefined;
      if (modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword))
        continue;
      if (ts.isConstructorDeclaration(member)) {
        for (const parameter of member.parameters)
          if (
            ts.getModifiers(parameter)?.length &&
            ts.isIdentifier(parameter.name) &&
            (name === undefined || parameter.name.text === name)
          )
            values.push(parameter);
        continue;
      }
      const key = staticName(member.name);
      if (name !== undefined && key !== undefined && key !== name) continue;
      if (ts.isPropertyDeclaration(member)) {
        if (member.initializer) values.push(member.initializer);
      } else values.push(member);
    }
    if (name !== undefined) values.push(...writesOf(site, name));
    else {
      writesOf(site, '');
      for (const fields of classWrites?.get(site)?.values() ?? [])
        values.push(...fields);
    }
    return values;
  };
  const methodCalls = new Map<string, Call[]>();
  const directCalls = new Map<ts.Node, Call[]>();
  let indexed = false;
  const index = (): void => {
    if (indexed) return;
    indexed = true;
    for (const candidate of nodes) {
      if (!ts.isCallExpression(candidate) && !ts.isNewExpression(candidate))
        continue;
      const callee = candidate.expression;
      if (
        ts.isCallExpression(candidate) &&
        ((ts.isPropertyAccessExpression(callee) &&
          namespaceImport(callee.expression)) ||
          importedBinding(callee))
      )
        for (const target of callTargets(candidate) ?? [])
          directCalls.set(target, [
            ...(directCalls.get(target) ?? []),
            candidate,
          ]);
      if (ts.isPropertyAccessExpression(callee))
        methodCalls.set(callee.name.text, [
          ...(methodCalls.get(callee.name.text) ?? []),
          candidate,
        ]);
      const targets = ts.isNewExpression(candidate)
        ? [localClass(callee)].flatMap((c) =>
            c ? c.members.filter(ts.isConstructorDeclaration) : [],
          )
        : analysis.functions(callee);
      for (const target of targets)
        directCalls.set(target, [
          ...(directCalls.get(target) ?? []),
          candidate,
        ]);
    }
  };
  // The strings a computed key can hold: literals, const bindings, and parameters every caller passes such a key.
  const keyStrings = (node: ts.Node, depth = 0): string[] | undefined => {
    node = strip(node);
    if (depth > 8) return undefined;
    if (ts.isStringLiteralLike(node)) return [node.text];
    if (!ts.isIdentifier(node)) return undefined;
    const declarations = analysis.declarations(node);
    if (declarations.length !== 1) return undefined;
    const declaration = declarations[0];
    if (
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      constList(declaration.parent)
    )
      return keyStrings(declaration.initializer, depth + 1);
    // An element destructured from local tuples, such as `for (const [path, kind] of [['a', 'b']] as const)`.
    if (
      ts.isBindingElement(declaration) &&
      ts.isArrayBindingPattern(declaration.parent) &&
      !declaration.dotDotDotToken
    ) {
      const position = String(declaration.parent.elements.indexOf(declaration));
      const values = allocations(declaration.parent.parent).flatMap((site) =>
        memberValues(site, position),
      );
      if (!values.length) return undefined;
      const keys: string[] = [];
      for (const value of values) {
        const found = keyStrings(value, depth + 1);
        if (!found) return undefined;
        keys.push(...found);
      }
      return unique(keys);
    }
    if (ts.isParameter(declaration) && !declaration.dotDotDotToken) {
      const position = declaration.parent.parameters.indexOf(declaration);
      const calls = callers(declaration.parent);
      if (!calls.length) return undefined;
      const keys: string[] = [];
      for (const call of calls) {
        const argument = call.arguments?.[position];
        const values = argument && keyStrings(argument, depth + 1);
        if (!values) return undefined;
        keys.push(...values);
      }
      return unique(keys);
    }
    return undefined;
  };
  // Local functions a call reaches: resolved functions, methods of the receiver's allocations, or a class constructor.
  const callTargets = (call: Call): ts.SignatureDeclaration[] | undefined => {
    if (ts.isNewExpression(call)) {
      const target = localClass(call.expression);
      if (!target) return undefined;
      return target.members.filter(ts.isConstructorDeclaration);
    }
    const direct = analysis.functions(call.expression);
    if (direct.length) return [...direct];
    const callee = call.expression;
    const binding = importedBinding(callee);
    if (binding) {
      const exported = analysis
        .namespaceExport(binding.source, binding.name)
        .filter(
          (declaration): declaration is ts.FunctionDeclaration =>
            ts.isFunctionDeclaration(declaration) && !!declaration.body,
        );
      return exported.length === 1 ? exported : undefined;
    }
    // `receiver[key](...)` with every possible key known reaches exactly those members.
    if (ts.isElementAccessExpression(callee)) {
      const keys = keyStrings(callee.argumentExpression);
      if (!keys?.length) return undefined;
      const functions = unique(
        allocations(callee.expression)
          .flatMap((site) => keys.flatMap((key) => memberValues(site, key)))
          .flatMap((value) => functionValues(value, 0)),
      );
      return functions.length ? functions : undefined;
    }
    if (!ts.isPropertyAccessExpression(callee)) return undefined;
    // A module namespace from `import()` exposes exactly the module's exports.
    const namespace = namespaceImport(callee.expression);
    if (namespace) {
      const exported = analysis
        .namespaceExport(namespace, callee.name.text)
        .filter(
          (declaration): declaration is ts.FunctionDeclaration =>
            ts.isFunctionDeclaration(declaration) && !!declaration.body,
        );
      return exported.length === 1 ? exported : undefined;
    }
    const functions = unique(
      allocations(callee.expression)
        .flatMap((site) => memberValues(site, callee.name.text))
        .flatMap((value) => functionValues(value, 0)),
    );
    return functions.length ? functions : undefined;
  };
  // Functions a member value denotes: a literal function, a resolved local function, or another member holding one.
  const functionValues = (
    value: ts.Node,
    depth: number,
  ): ts.SignatureDeclaration[] => {
    if (depth > 8) return [];
    if (ts.isFunctionLike(value)) return [value];
    const direct = analysis.functions(value);
    if (direct.length) return [...direct];
    if (transparent(value)) return functionValues(value.expression, depth + 1);
    if (ts.isIdentifier(value)) {
      const declarations = analysis.declarations(value);
      if (declarations.length !== 1) return [];
      const declaration = declarations[0];
      if (ts.isVariableDeclaration(declaration) && declaration.initializer)
        return functionValues(declaration.initializer, depth + 1);
      if (ts.isBindingElement(declaration)) {
        const name = ts.isObjectBindingPattern(declaration.parent)
          ? staticName(
              declaration.propertyName ?? (declaration.name as ts.Identifier),
            )
          : undefined;
        return allocations(declaration.parent.parent)
          .flatMap((site) => memberValues(site, name))
          .flatMap((member) => functionValues(member, depth + 1));
      }
      if (ts.isParameter(declaration)) {
        const position = declaration.parent.parameters.indexOf(declaration);
        return callers(declaration.parent).flatMap((call) => {
          const argument = call.arguments?.[position];
          return argument ? functionValues(argument, depth + 1) : [];
        });
      }
      return [];
    }
    if (ts.isCallExpression(value))
      return (callTargets(value) ?? []).flatMap((fn) =>
        returned(fn).flatMap((result) => functionValues(result, depth + 1)),
      );
    if (ts.isPropertyAccessExpression(value))
      return allocations(value.expression)
        .flatMap((site) => memberValues(site, value.name.text))
        .flatMap((member) => functionValues(member, depth + 1));
    return [];
  };
  const namespaceImport = (node: ts.Node): ts.CallExpression | undefined => {
    while (transparent(node)) node = node.expression;
    return ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
      ? node
      : undefined;
  };
  // The `import()` call and export name a const binding destructures, if it does.
  const importedBinding = (
    node: ts.Node,
  ): { source: ts.CallExpression; name: string } | undefined => {
    const declarations = ts.isIdentifier(node)
      ? analysis.declarations(node)
      : [];
    const declaration = declarations.length === 1 ? declarations[0] : undefined;
    if (
      !declaration ||
      !ts.isBindingElement(declaration) ||
      !ts.isObjectBindingPattern(declaration.parent) ||
      !ts.isVariableDeclaration(declaration.parent.parent) ||
      !declaration.parent.parent.initializer
    )
      return undefined;
    const source = namespaceImport(declaration.parent.parent.initializer);
    const name = staticName(
      declaration.propertyName ?? (declaration.name as ts.Identifier),
    );
    return source && name ? { source, name } : undefined;
  };
  // The declaration a token identifier denotes, also when destructured from a local module's `import()`.
  const tokenDeclaration = (token: ts.Node): ts.Declaration | undefined => {
    const declarations = analysis.declarations(token);
    const declaration = declarations.length === 1 ? declarations[0] : undefined;
    if (
      declaration &&
      ts.isBindingElement(declaration) &&
      ts.isObjectBindingPattern(declaration.parent) &&
      ts.isVariableDeclaration(declaration.parent.parent) &&
      declaration.parent.parent.initializer
    ) {
      const source = namespaceImport(declaration.parent.parent.initializer);
      const name = staticName(
        declaration.propertyName ?? (declaration.name as ts.Identifier),
      );
      const exported =
        source && name ? analysis.namespaceExport(source, name) : [];
      return exported.length === 1 ? exported[0] : undefined;
    }
    return declaration;
  };
  // An element of an official route factory's result, read as the parameter of a `.map` callback over it.
  const officialContribution = (node: ts.Node): boolean => {
    const declarations = ts.isIdentifier(node)
      ? analysis.declarations(node)
      : [];
    const parameter = declarations.length === 1 ? declarations[0] : undefined;
    if (!parameter || !ts.isParameter(parameter)) return false;
    const fn = parameter.parent;
    const call = fn.parent;
    return (
      fn.parameters[0] === parameter &&
      ts.isCallExpression(call) &&
      call.arguments.length === 1 &&
      call.arguments[0] === fn &&
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === 'map' &&
      analysis.values(call.expression.expression).length === 1 &&
      analysis
        .values(call.expression.expression)
        .every(
          (source) =>
            ts.isCallExpression(source) &&
            ROUTE_FACTORIES.some(([module, name]) =>
              importedContract(source.expression, analysis, module, name),
            ),
        )
    );
  };
  const callerCache = new Map<ts.Node, Call[]>();
  const callers = (fn: ts.SignatureDeclaration): Call[] => {
    const known = callerCache.get(fn);
    if (known) return known;
    const found = findCallers(fn);
    callerCache.set(fn, found);
    return found;
  };
  const findCallers = (fn: ts.SignatureDeclaration): Call[] => {
    index();
    const name =
      ts.isMethodDeclaration(fn) ||
      ts.isGetAccessorDeclaration(fn) ||
      ts.isSetAccessorDeclaration(fn)
        ? staticName(fn.name)
        : (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) &&
            ts.isPropertyAssignment(fn.parent)
          ? staticName(fn.parent.name)
          : undefined;
    const byName = name
      ? (methodCalls.get(name) ?? []).filter((call) =>
          callTargets(call)?.includes(fn),
        )
      : [];
    return [...new Set([...(directCalls.get(fn) ?? []), ...byName])];
  };
  // Container registrations by token declaration: what a later `resolve(token)` returns.
  let tokenRegistrations: Map<ts.Declaration, ts.Node[]> | undefined;
  const registeredValues = (token: ts.Node): ts.Node[] => {
    if (!tokenRegistrations) {
      tokenRegistrations = new Map();
      for (const candidate of nodes) {
        if (
          !ts.isCallExpression(candidate) ||
          !ts.isPropertyAccessExpression(candidate.expression) ||
          !['singleton', 'instance'].includes(candidate.expression.name.text) ||
          candidate.arguments.length < 2 ||
          !ts.isIdentifier(candidate.arguments[0])
        )
          continue;
        const declaration = tokenDeclaration(candidate.arguments[0]);
        if (!declaration) continue;
        const value = candidate.arguments[1];
        const produced =
          candidate.expression.name.text === 'singleton'
            ? analysis.functions(value).flatMap((fn) => [...returned(fn)])
            : [value];
        tokenRegistrations.set(declaration, [
          ...(tokenRegistrations.get(declaration) ?? []),
          ...produced,
        ]);
      }
    }
    const declaration = ts.isIdentifier(token)
      ? tokenDeclaration(token)
      : undefined;
    return (declaration && tokenRegistrations.get(declaration)) || [];
  };
  // Built-in contracts with exact semantics, used only for local values the graph fully sees. A `new Map()` is a
  // view whose values are every `set` it receives; `values()`, iteration and `[key, value]` entries are views of it;
  // `.map` on a local collection is a view of its callback's results. A static token map resolved entry by entry is
  // a view whose field `k` is what `resolve` returns for the token under `k` in every map that can reach it.
  type ViewKind =
    'map' | 'values' | 'entries' | 'entry' | 'mapped' | 'tokens' | 'resolved';
  const views = new Map<ts.Node, { kind: ViewKind; of: ts.Node }>();
  const viewNodes = new Map<
    ts.Node,
    Map<ViewKind, ts.ObjectLiteralExpression>
  >();
  const view = (kind: ViewKind, of: ts.Node): ts.ObjectLiteralExpression => {
    const known = viewNodes.get(of)?.get(kind);
    if (known) return known;
    const node = ts.factory.createObjectLiteralExpression();
    views.set(node, { kind, of });
    const byKind =
      viewNodes.get(of) ?? new Map<ViewKind, ts.ObjectLiteralExpression>();
    viewNodes.set(of, byKind);
    byKind.set(kind, node);
    return node;
  };
  const changedBuiltins = new Set<string>();
  for (const node of nodes) {
    if (
      !ts.isIdentifier(node) ||
      !['Object', 'Map'].includes(node.text) ||
      analysis.declarations(node).length
    )
      continue;
    let access: ts.Node = node;
    while (
      (ts.isPropertyAccessExpression(access.parent) ||
        ts.isElementAccessExpression(access.parent)) &&
      access.parent.expression === access
    )
      access = access.parent;
    const parent = access.parent;
    if (
      (ts.isBinaryExpression(parent) &&
        parent.left === access &&
        parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
      ts.isDeleteExpression(parent) ||
      (ts.isCallExpression(parent) &&
        parent.arguments.includes(access as ts.Expression))
    )
      changedBuiltins.add(node.text);
  }
  const builtin = (node: ts.Node, name: string): boolean =>
    ts.isIdentifier(node) &&
    node.text === name &&
    !changedBuiltins.has(name) &&
    analysis.declarations(node).length === 0;
  const mapWrites = (map: ts.Node): { keys: ts.Node[]; values: ts.Node[] } => {
    index();
    const keys: ts.Node[] = [];
    const values: ts.Node[] = [];
    for (const call of methodCalls.get('set') ?? []) {
      if (!ts.isCallExpression(call) || call.arguments.length !== 2) continue;
      const receiver = (call.expression as ts.PropertyAccessExpression)
        .expression;
      if (!allocations(receiver).includes(view('map', map))) continue;
      keys.push(call.arguments[0]);
      values.push(call.arguments[1]);
    }
    return { keys, values };
  };
  const isMap = (site: ts.Node): boolean => views.get(site)?.kind === 'map';
  // Sites a built-in collection operation may read: a local Map, array literal or one of their views.
  const collection = (receiver: ts.Node, maps: boolean): Site[] | undefined => {
    const sites = allocations(receiver);
    if (!sites.length) return undefined;
    return sites.every((site) =>
      maps
        ? isMap(site)
        : ts.isArrayLiteralExpression(site) ||
          ['values', 'entries', 'mapped'].includes(views.get(site)?.kind ?? ''),
    )
      ? sites
      : undefined;
  };
  const MAP_METHODS = new Set([
    'set',
    'get',
    'has',
    'delete',
    'values',
    'entries',
    'keys',
  ]);
  const ARRAY_METHODS = new Set(['map', 'filter', 'find', 'some', 'every']);
  // A supported operation on a local collection: its receiver, name and whether it is a Map operation.
  const collectionCall = (
    call: ts.Node,
  ): { receiver: ts.Expression; name: string; sites: Site[] } | undefined => {
    if (
      !ts.isCallExpression(call) ||
      !ts.isPropertyAccessExpression(call.expression)
    )
      return undefined;
    const name = call.expression.name.text;
    const receiver = call.expression.expression;
    if (MAP_METHODS.has(name)) {
      const arity =
        name === 'set' ? 2 : ['get', 'has', 'delete'].includes(name) ? 1 : 0;
      if (
        call.arguments.length !== arity ||
        call.arguments.some(ts.isSpreadElement)
      )
        return undefined;
      const sites = collection(receiver, true);
      return sites ? { receiver, name, sites } : undefined;
    }
    if (
      ARRAY_METHODS.has(name) &&
      call.arguments.length === 1 &&
      (ts.isArrowFunction(call.arguments[0]) ||
        ts.isFunctionExpression(call.arguments[0]))
    ) {
      const sites = collection(receiver, false);
      return sites ? { receiver, name, sites } : undefined;
    }
    return undefined;
  };
  // The elements a local collection callback receives as its first parameter.
  const callbackElements = (parameter: ts.Node): ts.Node[] | undefined => {
    if (!ts.isParameter(parameter)) return undefined;
    const fn = parameter.parent;
    if (fn.parameters[0] !== parameter) return undefined;
    const call = fn.parent;
    const operation = collectionCall(call);
    if (
      !operation ||
      ARRAY_METHODS.has(operation.name) === false ||
      (call as ts.CallExpression).arguments[0] !== fn
    )
      return undefined;
    return operation.sites.flatMap((site) => memberValues(site, undefined));
  };
  const viewMembers = (
    site: ts.Node,
    name: string | undefined,
  ): ts.Node[] | undefined => {
    const described = views.get(site);
    if (!described) return undefined;
    switch (described.kind) {
      case 'map':
        return name === undefined ? [view('entry', described.of)] : [];
      case 'values':
        return mapWrites(described.of).values;
      case 'entries':
        return [view('entry', described.of)];
      case 'entry': {
        const writes = mapWrites(described.of);
        return name === '0'
          ? writes.keys
          : name === '1'
            ? writes.values
            : [...writes.keys, ...writes.values];
      }
      case 'mapped': {
        const call = described.of as ts.CallExpression;
        return analysis
          .functions(call.arguments[0])
          .flatMap((fn) => [...returned(fn)]);
      }
      case 'tokens': {
        const map = tokenMap(described.of);
        return (map?.sites ?? []).flatMap((source) =>
          source.properties.flatMap((property) => {
            const key = staticName(property.name);
            if (name !== undefined && key !== name) return [];
            const token = ts.isPropertyAssignment(property)
              ? property.initializer
              : (property as ts.ShorthandPropertyAssignment).name;
            return [view('resolved', token)];
          }),
        );
      }
      default:
        return [];
    }
  };
  // A token identifier the static analysis can name: the authorization token, an own service token, or an export of
  // another package.
  const staticToken = (token: ts.Node): boolean => {
    if (!ts.isIdentifier(token)) return false;
    if (authorizationToken(token, analysis) || ownToken(token)) return true;
    const imported = analysis.symbol(token)?.declarations?.[0];
    return (
      !!imported &&
      ts.isImportSpecifier(imported) &&
      !imported.isTypeOnly &&
      !imported.parent.parent.isTypeOnly &&
      analysis.isExternalImport(
        imported.parent.parent.parent as ts.ImportDeclaration,
      )
    );
  };
  type TokenMap = {
    sites: ts.ObjectLiteralExpression[];
    entries: ts.CallExpression;
    resolve: ts.CallExpression;
  };
  const tokenMaps = new Map<ts.Node, TokenMap | null>();
  const tokenMapSites = new Set<ts.Node>();
  const tokenMapValues = new Set<ts.Node>();
  const tokenEntries = new Set<ts.Node>();
  const tokenResolves = new Set<ts.Node>();
  const strip = (node: ts.Node): ts.Node => {
    while (transparent(node)) node = node.expression;
    return node;
  };
  // `Object.fromEntries(Object.entries(map).map(([key, token]) => [key, container.resolve(token)]))` over closed
  // literals of static tokens. Anything else in this shape stays unknown.
  const tokenMap = (call: ts.Node): TokenMap | undefined => {
    if (tokenMaps.has(call)) return tokenMaps.get(call) ?? undefined;
    tokenMaps.set(call, null);
    if (
      !ts.isCallExpression(call) ||
      call.arguments.length !== 1 ||
      !ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== 'fromEntries' ||
      !builtin(call.expression.expression, 'Object')
    )
      return undefined;
    const mapped = strip(call.arguments[0]);
    if (
      !ts.isCallExpression(mapped) ||
      mapped.arguments.length !== 1 ||
      !ts.isPropertyAccessExpression(mapped.expression) ||
      mapped.expression.name.text !== 'map'
    )
      return undefined;
    const entries = strip(mapped.expression.expression);
    const callback = mapped.arguments[0];
    if (
      !ts.isCallExpression(entries) ||
      entries.arguments.length !== 1 ||
      !ts.isPropertyAccessExpression(entries.expression) ||
      entries.expression.name.text !== 'entries' ||
      !builtin(entries.expression.expression, 'Object') ||
      !(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) ||
      callback.parameters.length !== 1 ||
      callback.parameters[0].initializer ||
      callback.parameters[0].dotDotDotToken ||
      ts.isBlock(callback.body) ||
      ts
        .getModifiers(callback)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ||
      !ts.isArrayBindingPattern(callback.parameters[0].name)
    )
      return undefined;
    const pattern = callback.parameters[0].name;
    const [keyElement, tokenElement] = pattern.elements;
    if (
      pattern.elements.length !== 2 ||
      !keyElement ||
      !tokenElement ||
      !ts.isBindingElement(keyElement) ||
      !ts.isBindingElement(tokenElement) ||
      keyElement.dotDotDotToken ||
      tokenElement.dotDotDotToken ||
      keyElement.initializer ||
      tokenElement.initializer ||
      !ts.isIdentifier(keyElement.name) ||
      !ts.isIdentifier(tokenElement.name)
    )
      return undefined;
    const body = returned(callback);
    const pair = body.length === 1 ? strip(body[0]) : undefined;
    if (
      !pair ||
      !ts.isArrayLiteralExpression(pair) ||
      pair.elements.length !== 2
    )
      return undefined;
    const [key, resolved] = pair.elements.map(strip);
    if (
      !ts.isIdentifier(key) ||
      analysis.symbol(key) !== analysis.symbol(keyElement.name) ||
      !ts.isCallExpression(resolved) ||
      resolved.arguments.length !== 1 ||
      !ts.isPropertyAccessExpression(resolved.expression) ||
      resolved.expression.name.text !== 'resolve' ||
      !ts.isIdentifier(resolved.arguments[0]) ||
      analysis.symbol(resolved.arguments[0]) !==
        analysis.symbol(tokenElement.name) ||
      kind(resolved.expression.expression) !== 'container'
    )
      return undefined;
    const sites = allocations(entries.arguments[0]);
    if (
      !sites.length ||
      !sites.every(
        (site) =>
          ts.isObjectLiteralExpression(site) &&
          !views.has(site) &&
          site.properties.every(
            (property) =>
              (ts.isPropertyAssignment(property) ||
                ts.isShorthandPropertyAssignment(property)) &&
              staticName(property.name) !== undefined &&
              staticName(property.name) !== '__proto__' &&
              staticToken(
                ts.isPropertyAssignment(property)
                  ? property.initializer
                  : property.name,
              ),
          ),
      )
    )
      return undefined;
    const tokensByKey = new Map<string, ts.Declaration | string>();
    for (const site of sites as ts.ObjectLiteralExpression[])
      for (const property of site.properties) {
        if (
          !ts.isPropertyAssignment(property) &&
          !ts.isShorthandPropertyAssignment(property)
        )
          return undefined;
        const key = staticName(property.name)!;
        const token = ts.isPropertyAssignment(property)
          ? property.initializer
          : property.name;
        const imported = analysis
          .symbol(token)
          ?.declarations?.find(ts.isImportSpecifier);
        const statement = imported?.parent.parent.parent;
        const identity =
          imported &&
          statement &&
          ts.isImportDeclaration(statement) &&
          analysis.isExternalImport(statement) &&
          ts.isStringLiteralLike(statement.moduleSpecifier)
            ? `${statement.moduleSpecifier.text}#${imported.propertyName?.text ?? imported.name.text}`
            : tokenDeclaration(token);
        if (
          !identity ||
          (tokensByKey.has(key) && tokensByKey.get(key) !== identity)
        )
          return undefined;
        tokensByKey.set(key, identity);
      }
    const result: TokenMap = {
      sites: sites as ts.ObjectLiteralExpression[],
      entries,
      resolve: resolved,
    };
    for (const site of result.sites) {
      if (!tokenMapSites.has(site)) changed = true;
      tokenMapSites.add(site);
      for (const property of site.properties)
        tokenMapValues.add(
          ts.isPropertyAssignment(property)
            ? property.initializer
            : (property as ts.ShorthandPropertyAssignment).name,
        );
    }
    tokenEntries.add(entries);
    tokenResolves.add(resolved);
    tokenMaps.set(call, result);
    return result;
  };
  // Sites whose members decide which local function receives a tracked value: they become tracked themselves, so a
  // later write, push or hand-out of the collection or element is checked like any other.
  const dispatch = new Set<ts.Node>();
  const markDispatch = (call: Call): void => {
    if (
      !ts.isCallExpression(call) ||
      !ts.isPropertyAccessExpression(call.expression)
    )
      return;
    for (const site of allocations(call.expression.expression))
      if (!dispatch.has(site) && !views.has(site)) {
        dispatch.add(site);
        changed = true;
      }
  };
  const results = (call: Call): ts.Node[] => {
    if (ts.isNewExpression(call)) {
      if (builtin(call.expression, 'Map') && !call.arguments?.length)
        return [view('map', call)];
      const target = localClass(call.expression);
      return target ? [target] : [];
    }
    if (tokenMap(call)) return [view('tokens', call)];
    const operation = collectionCall(call);
    if (operation) {
      const [map] = operation.sites;
      switch (operation.name) {
        case 'get':
          return operation.sites.flatMap(
            (site) => mapWrites(views.get(site)!.of).values,
          );
        case 'values':
          return operation.sites.map((site) =>
            view('values', views.get(site)!.of),
          );
        case 'entries':
          return operation.sites.map((site) =>
            view('entries', views.get(site)!.of),
          );
        case 'filter':
          return [operation.receiver];
        case 'find':
          return operation.sites.flatMap((site) =>
            memberValues(site, undefined),
          );
        case 'map':
          return [view('mapped', call)];
        default:
          return map ? [] : [];
      }
    }
    if (
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === 'resolve' &&
      call.arguments.length === 1
    ) {
      const values = registeredValues(call.arguments[0]);
      if (values.length) return values;
    }
    return (callTargets(call) ?? []).flatMap((fn) => [...returned(fn)]);
  };
  const allocations: (node: ts.Node) => Site[] = solver<Site[]>(
    (node, get) => unique(locate(node, get)),
    [],
    sameSites,
  );
  const locate = (node: ts.Node, get: (child: ts.Node) => Site[]): Site[] => {
    {
      const described = views.get(node);
      if (described?.kind === 'resolved')
        return registeredValues(described.of).flatMap(get);
      if (described) return [node as Site];
      if (transparent(node)) return get(node.expression);
      const options = alternatives(node);
      if (options) return options.flatMap(get);
      if (
        ts.isObjectLiteralExpression(node) ||
        ts.isArrayLiteralExpression(node) ||
        ts.isClassLike(node)
      )
        return [node];
      // Every declaration counts: a JavaScript property assignment such as `value.field = x` adds one to `value`.
      if (ts.isIdentifier(node))
        return analysis.declarations(node).flatMap(get);
      if (node.kind === ts.SyntaxKind.ThisKeyword) {
        const site = thisSite(node);
        return site ? [site] : [];
      }
      if (ts.isVariableDeclaration(node)) {
        if (ts.isForOfStatement(node.parent.parent))
          return get(node.parent.parent.expression).flatMap((site) =>
            memberValues(site, undefined).flatMap(get),
          );
        return node.initializer ? get(node.initializer) : [];
      }
      if (ts.isBindingElement(node)) {
        const owner = node.parent.parent;
        const name = ts.isObjectBindingPattern(node.parent)
          ? staticName(node.propertyName ?? (node.name as ts.Identifier))
          : String(node.parent.elements.indexOf(node));
        return get(owner).flatMap((site) =>
          memberValues(site, name).flatMap(get),
        );
      }
      if (ts.isParameter(node)) {
        const elements = callbackElements(node);
        if (elements) return elements.flatMap(get);
        const fn = node.parent;
        const position = fn.parameters.indexOf(node);
        return callers(fn).flatMap((call) => {
          const argument = call.arguments?.[position];
          return argument ? get(argument) : [];
        });
      }
      if (ts.isNewExpression(node) || ts.isCallExpression(node))
        return results(node).flatMap(get);
      if (ts.isPropertyAccessExpression(node))
        return get(node.expression).flatMap((site) =>
          memberValues(site, node.name.text).flatMap(get),
        );
      if (ts.isElementAccessExpression(node))
        return get(node.expression).flatMap((site) =>
          memberValues(site, undefined).flatMap(get),
        );
      return [];
    }
  };
  // Functions the host calls with the application: route contributions' `createRouter` in the runtime's route list
  // (directly, spread or produced by `.map`) and local HTTP middleware's `register`.
  const hostCalled = new Set<ts.Node>();
  const contributions = (node: ts.Node, depth: number): void => {
    if (depth > 8) return;
    for (const item of analysis.values(node)) {
      if (ts.isArrayLiteralExpression(item))
        for (const element of item.elements)
          contributions(
            ts.isSpreadElement(element) ? element.expression : element,
            depth + 1,
          );
      else if (
        ts.isCallExpression(item) &&
        ts.isPropertyAccessExpression(item.expression) &&
        item.expression.name.text === 'map' &&
        item.arguments.length === 1
      )
        for (const fn of analysis.functions(item.arguments[0]))
          for (const result of returned(fn)) contributions(result, depth + 1);
      else if (ts.isObjectLiteralExpression(item)) {
        const factory = property(item, 'createRouter');
        for (const fn of factory ? analysis.functions(factory) : [])
          hostCalled.add(fn);
      }
    }
  };
  const routeList = property(definition, 'routes');
  if (routeList) contributions(routeList, 0);
  const httpRegisters = new Set<ts.Node>();
  const isRegister = (fn: ts.Node): boolean => httpRegisters.has(fn);
  const mentions = (node: ts.Node, test: (child: ts.Node) => boolean) => {
    let found = false;
    const visit = (child: ts.Node): void => {
      if (found) return;
      if (test(child)) found = true;
      else ts.forEachChild(child, visit);
    };
    visit(node);
    return found;
  };
  // A pass-through handler: optional `if (...) return next();` guards, then an unconditional `await next()`, never
  // touching `next` again and never setting request variables other steps read, such as the session.
  const passThrough = (handler: ts.Node): boolean => {
    const fn = ts.isFunctionLike(handler)
      ? handler
      : analysis.functions(handler)[0];
    if (
      !fn ||
      !('body' in fn) ||
      !fn.body ||
      !ts.isBlock(fn.body) ||
      fn.parameters.length !== 2
    )
      return false;
    const [context, next] = fn.parameters;
    if (!ts.isIdentifier(context.name) || !ts.isIdentifier(next.name))
      return false;
    const nextSymbol = analysis.symbol(next.name);
    const contextSymbol = analysis.symbol(context.name);
    const isNext = (child: ts.Node): boolean =>
      ts.isIdentifier(child) && analysis.symbol(child) === nextSymbol;
    const direct = (child: ts.Node): boolean => {
      while (ts.isAwaitExpression(child) || ts.isParenthesizedExpression(child))
        child = child.expression;
      return (
        ts.isCallExpression(child) &&
        isNext(child.expression) &&
        child.arguments.length === 0
      );
    };
    let reached = false;
    for (const statement of fn.body.statements) {
      if (reached) {
        if (mentions(statement, isNext)) return false;
        continue;
      }
      if (
        ts.isIfStatement(statement) &&
        !statement.elseStatement &&
        ts.isReturnStatement(statement.thenStatement) &&
        statement.thenStatement.expression &&
        direct(statement.thenStatement.expression) &&
        !mentions(statement.expression, isNext)
      )
        continue;
      if (ts.isExpressionStatement(statement) && direct(statement.expression)) {
        reached = true;
        continue;
      }
      if (
        (ts.isVariableStatement(statement) ||
          ts.isExpressionStatement(statement)) &&
        !mentions(statement, isNext)
      )
        continue;
      return false;
    }
    return (
      reached &&
      !mentions(
        fn.body,
        (child) =>
          ts.isPropertyAccessExpression(child) &&
          ts.isIdentifier(child.expression) &&
          analysis.symbol(child.expression) === contextSymbol &&
          ['set', 'var', 'env'].includes(child.name.text),
      )
    );
  };
  // A local HTTP middleware is accepted when its router only receives pass-through handlers.
  const localMiddleware = (argument: ts.Node): boolean => {
    const values = analysis.values(argument);
    const call = values.length === 1 ? values[0] : undefined;
    if (
      !call ||
      !ts.isCallExpression(call) ||
      call.arguments.length !== 1 ||
      !importedContract(
        call.expression,
        analysis,
        '@nocobase/app-server/router',
        'defineHttpMiddleware',
      )
    )
      return false;
    const options = analysis.values(call.arguments[0]);
    if (options.length !== 1 || !ts.isObjectLiteralExpression(options[0]))
      return false;
    const member = options[0].properties.find(
      (item) => staticName(item.name) === 'register',
    );
    const register =
      member && ts.isMethodDeclaration(member)
        ? member
        : member && ts.isPropertyAssignment(member)
          ? analysis.functions(member.initializer)[0]
          : undefined;
    if (
      !register ||
      !('body' in register) ||
      !register.body ||
      !ts.isBlock(register.body)
    )
      return false;
    const router = register.parameters[0];
    if (!router || !ts.isIdentifier(router.name)) return false;
    const symbol = analysis.symbol(router.name);
    const misuse = mentions(register.body, (child) => {
      if (!ts.isIdentifier(child) || analysis.symbol(child) !== symbol)
        return false;
      const access = child.parent;
      const use = access.parent;
      return !(
        ts.isPropertyAccessExpression(access) &&
        access.expression === child &&
        access.name.text === 'use' &&
        ts.isCallExpression(use) &&
        use.expression === access &&
        use.arguments.length === 2 &&
        ts.isStringLiteralLike(use.arguments[0]) &&
        passThrough(use.arguments[1])
      );
    });
    if (misuse) return false;
    httpRegisters.add(register);
    hostCalled.add(register);
    return true;
  };
  const middlewares = new Set<ts.Node>();
  for (const candidate of nodes)
    if (
      ts.isCallExpression(candidate) &&
      ts.isPropertyAccessExpression(candidate.expression) &&
      candidate.expression.name.text === 'addHttpMiddleware' &&
      candidate.arguments.length === 1 &&
      localMiddleware(candidate.arguments[0])
    )
      middlewares.add(candidate.arguments[0]);
  // A function that hands out a tracked value makes the object holding it a holder: reading the method is a capability.
  const returnsTracked = (
    fn: ts.Node,
    get: (node: ts.Node) => Kind | undefined,
  ) => ts.isFunctionLike(fn) && returned(fn).some((value) => get(value));
  const fieldKind = (
    owner: ts.Node,
    name: string | undefined,
    get: (node: ts.Node) => Kind | undefined,
  ): Kind | undefined =>
    allocations(owner)
      .flatMap((site) => memberValues(site, name))
      .reduce<Kind | undefined>(
        (kind, value) =>
          join(
            kind,
            get(value) ?? (returnsTracked(value, get) ? 'holder' : undefined),
          ),
        undefined,
      );
  const kind: (node: ts.Node) => Kind | undefined = solver<Kind | undefined>(
    (node, get) => {
      let result: Kind | undefined;
      const options = alternatives(node);
      const described = views.get(node);
      if (described?.kind === 'resolved')
        // What `resolve` returns for one token of a static token map.
        result = authorizationToken(described.of, analysis)
          ? 'authorization'
          : registeredValues(described.of).map(get).reduce(join, undefined);
      else if (transparent(node)) result = get(node.expression);
      else if (options) result = options.map(get).reduce(join, undefined);
      else if (ts.isIdentifier(node)) {
        const declarations = analysis.declarations(node);
        // A class value is its constructor, not an instance; its references are checked separately. Every other
        // declaration counts, as a JavaScript property assignment `value.field = x` adds one to `value`.
        if (!declarations.some((declaration) => ts.isClassLike(declaration)))
          result = declarations.map(get).reduce(join, undefined);
      } else if (node.kind === ts.SyntaxKind.ThisKeyword) {
        const site = thisSite(node);
        if (site) result = get(site);
      } else if (
        ts.isObjectLiteralExpression(node) ||
        ts.isArrayLiteralExpression(node) ||
        ts.isClassLike(node)
      ) {
        if (
          dispatch.has(node) ||
          tokenMapSites.has(node) ||
          memberValues(node, undefined).some(
            (value) => get(value) || returnsTracked(value, get),
          )
        )
          result = 'holder';
      } else if (ts.isVariableDeclaration(node)) {
        if (ts.isForOfStatement(node.parent.parent))
          result = fieldKind(node.parent.parent.expression, undefined, get);
        else if (node.initializer) result = get(node.initializer);
      } else if (ts.isBindingElement(node)) {
        const owner = node.parent.parent;
        const ownerKind = get(owner);
        const name = node.propertyName ?? node.name;
        if (
          ts.isObjectBindingPattern(node.parent) &&
          ownerKind === 'app' &&
          ts.isIdentifier(name) &&
          ['container', 'config'].includes(name.text)
        )
          result = name.text as Kind;
        else if (ownerKind === 'holder')
          result = fieldKind(
            owner,
            ts.isObjectBindingPattern(node.parent)
              ? staticName(name as ts.PropertyName)
              : String(node.parent.elements.indexOf(node)),
            get,
          );
        else if (ownerKind) result = 'conflict';
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
          hostCalled.has(fn) &&
          fn.parameters.indexOf(node) === (isRegister(fn) ? 1 : 0)
        )
          result = 'app';
        else if (callbackElements(node))
          result = callbackElements(node)!.map(get).reduce(join, undefined);
        else {
          const position = fn.parameters.indexOf(node);
          for (const call of callers(fn)) {
            const argument = call.arguments?.[position];
            if (argument) result = join(result, get(argument));
          }
        }
      } else if (ts.isPropertyAccessExpression(node)) {
        const owner = get(node.expression);
        if (owner === 'app' && node.name.text === 'container')
          result = 'container';
        else if (owner === 'app' && node.name.text === 'config')
          result = 'config';
        else if (owner === 'runtime' && node.name.text === 'app')
          result = 'app';
        else if (owner === 'holder')
          result = fieldKind(node.expression, node.name.text, get);
        if (
          node.expression.kind === ts.SyntaxKind.ThisKeyword &&
          node.name.text === 'app'
        ) {
          let parent: ts.Node | undefined = node.parent;
          while (parent && !ts.isClassDeclaration(parent))
            parent = parent.parent;
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
      } else if (ts.isElementAccessExpression(node)) {
        if (get(node.expression) === 'holder')
          result = fieldKind(node.expression, undefined, get);
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
        if (
          ts.isPropertyAccessExpression(node.expression) &&
          get(node.expression.expression) === 'container' &&
          node.expression.name.text === 'resolve' &&
          node.arguments.length === 1 &&
          authorizationToken(node.arguments[0], analysis)
        )
          result = 'authorization';
        else if (!result)
          result = results(node).map(get).reduce(join, undefined);
      } else if (ts.isNewExpression(node)) {
        if (
          importedContract(
            node.expression,
            analysis,
            '@nocobase/app-server/config',
            'AppConfig',
          )
        )
          result = 'config';
        else result = results(node).map(get).reduce(join, undefined);
      }
      return result;
    },
    undefined,
    (a, b) => a === b,
  );
  const capabilityFunctions = new Set<ts.Node>();
  // Every local function a call reaches must take the value in a parameter of the same kind.
  const localArgument = (node: ts.Node, call: Call): boolean => {
    const position = call.arguments?.indexOf(node as ts.Expression) ?? -1;
    const functions = callTargets(call);
    if (!functions?.length || position < 0) return false;
    markDispatch(call);
    const expected = kind(node);
    return functions.every((fn) => {
      const parameter = fn.parameters[position];
      // An argument past a function's parameters reaches nothing, unless a non-arrow function reads `arguments`.
      if (!parameter)
        return (
          !fn.parameters.some((item) => item.dotDotDotToken) &&
          (ts.isArrowFunction(fn) ||
            !('body' in fn) ||
            !fn.body ||
            !mentions(
              fn.body,
              (child) => ts.isIdentifier(child) && child.text === 'arguments',
            ))
        );
      if (parameter.dotDotDotToken) return false;
      capabilityFunctions.add(fn);
      return kind(parameter) === expected;
    });
  };
  const usesThis = (fn: ts.Node): boolean => {
    let found = false;
    const visit = (child: ts.Node): void => {
      if (found) return;
      if (child.kind === ts.SyntaxKind.ThisKeyword) found = true;
      else if (!(ts.isFunctionLike(child) && !ts.isArrowFunction(child)))
        ts.forEachChild(child, visit);
    };
    // An arrow function keeps the lexical `this` of its definition, whatever receiver later calls it.
    if (ts.isArrowFunction(fn)) return false;
    if ('body' in fn && fn.body) visit(fn.body as ts.Node);
    return found;
  };
  const condition = (node: ts.Node): boolean => {
    const parent = node.parent;
    if (
      (ts.isIfStatement(parent) ||
        ts.isWhileStatement(parent) ||
        ts.isDoStatement(parent)) &&
      parent.expression === node
    )
      return true;
    if (ts.isConditionalExpression(parent) && parent.condition === node)
      return true;
    if (
      ts.isPrefixUnaryExpression(parent) &&
      parent.operator === ts.SyntaxKind.ExclamationToken
    )
      return true;
    if (ts.isTypeOfExpression(parent)) return true;
    return (
      ts.isBinaryExpression(parent) &&
      [
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
        ts.SyntaxKind.EqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsToken,
      ].includes(parent.operatorToken.kind)
    );
  };
  const written = (target: ts.Node): boolean => {
    const parent = target.parent;
    return (
      (ts.isBinaryExpression(parent) &&
        parent.left === target &&
        parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
      ((ts.isPrefixUnaryExpression(parent) ||
        ts.isPostfixUnaryExpression(parent)) &&
        [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
          parent.operator,
        )) ||
      ts.isDeleteExpression(parent)
    );
  };
  const enclosing = (node: ts.Node): ts.SignatureDeclaration | undefined => {
    let fn: ts.Node | undefined = node.parent;
    while (fn && !ts.isFunctionLike(fn)) fn = fn.parent;
    return fn && ts.isFunctionLike(fn) ? fn : undefined;
  };
  // A token the application declares itself, so no other package can resolve what is registered under it.
  const ownToken = (token: ts.Node | undefined): boolean => {
    if (
      !token ||
      !ts.isIdentifier(token) ||
      authorizationToken(token, analysis)
    )
      return false;
    const declaration = tokenDeclaration(token);
    const initializer =
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer;
    return (
      !!initializer &&
      ts.isCallExpression(initializer) &&
      importedContract(
        initializer.expression,
        analysis,
        '@nocobase/service-provider',
        'createServiceToken',
      )
    );
  };
  // Functions handing out a tracked value: every reference must be a direct call or a registration of an own token.
  const strictFunctions = new Set<ts.Node>();
  const registration = (fn: ts.Node): boolean => {
    const call = fn.parent;
    return (
      ts.isCallExpression(call) &&
      call.arguments[1] === fn &&
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === 'singleton' &&
      kind(call.expression.expression) === 'container' &&
      ownToken(call.arguments[0])
    );
  };
  const returnable = (fn: ts.SignatureDeclaration): boolean => {
    if (registration(fn)) return true;
    if (ts.isFunctionDeclaration(fn) && fn.name) {
      strictFunctions.add(fn);
      return true;
    }
    if (
      (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) &&
      ts.isVariableDeclaration(fn.parent) &&
      fn.parent.initializer === fn &&
      ts.isIdentifier(fn.parent.name) &&
      constList(fn.parent.parent)
    ) {
      strictFunctions.add(fn.parent);
      return true;
    }
    // Methods and property functions make their object a holder; reading them uncalled is rejected above.
    const owner =
      ts.isMethodDeclaration(fn) ||
      ts.isGetAccessorDeclaration(fn) ||
      ts.isConstructorDeclaration(fn)
        ? fn.parent
        : (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) &&
            ts.isPropertyAssignment(fn.parent)
          ? fn.parent.parent
          : undefined;
    return (
      !!owner &&
      !ts.isConstructorDeclaration(fn) &&
      (ts.isObjectLiteralExpression(owner) || ts.isClassLike(owner)) &&
      kind(owner) === 'holder'
    );
  };
  const constList = (list: ts.Node | undefined): boolean =>
    !!list &&
    ts.isVariableDeclarationList(list) &&
    (list.flags & ts.NodeFlags.Const) !== 0;
  const verify = (): boolean => {
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
        // A value of a recognized static token map, which only the entry-wise resolution reads.
        if (tokenMapValues.has(node)) continue;
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
      // Names are not values: a declaration's own name, and the member name of `receiver.name`, whose access is
      // checked as one expression. A shorthand property's name is a reference and stays checked.
      if (
        ts.isIdentifier(node) &&
        (ts.isVariableDeclaration(node.parent) ||
          ts.isParameter(node.parent) ||
          ts.isBindingElement(node.parent) ||
          ts.isPropertyAccessExpression(node.parent) ||
          ts.isPropertyAssignment(node.parent) ||
          ts.isPropertyDeclaration(node.parent) ||
          ts.isMethodDeclaration(node.parent) ||
          ts.isFunctionDeclaration(node.parent) ||
          ts.isClassLike(node.parent)) &&
        node.parent.name === node
      )
        continue;
      const authority = kind(node);
      if (!authority) continue;
      const parent = node.parent;
      // The target of a class's own `this.field = ...` is part of the field model, not a read of it.
      if (
        ts.isPropertyAccessExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ThisKeyword &&
        written(node) &&
        ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        const site = thisSite(node.expression);
        if (site && ts.isClassLike(site)) continue;
      }
      if (authority === 'conflict') return false;
      const holder = authority === 'holder';
      // A discarded value goes nowhere.
      if (ts.isExpressionStatement(parent) || ts.isVoidExpression(parent))
        continue;
      // A class field initializer defines the instance's field, like `this.field = value` in the class.
      if (
        ts.isPropertyDeclaration(parent) &&
        parent.initializer === node &&
        ts.isClassLike(parent.parent) &&
        !ts
          .getModifiers(parent)
          ?.some((item) => item.kind === ts.SyntaxKind.StaticKeyword) &&
        kind(parent.parent) === 'holder'
      )
        continue;
      // A tracked function value called directly: what it returns is tracked and checked like any other value.
      if (
        ts.isCallExpression(parent) &&
        parent.expression === node &&
        callTargets(parent)?.length
      )
        continue;
      // A static token map read by its recognized entry-wise resolution.
      if (
        ts.isCallExpression(parent) &&
        parent.arguments[0] === node &&
        tokenEntries.has(parent)
      )
        continue;
      // A value written into a local Map: later reads of the Map return it, and the Map is checked as a holder.
      if (
        ts.isCallExpression(parent) &&
        parent.arguments.includes(node) &&
        collectionCall(parent)?.name === 'set'
      )
        continue;
      // A supported read of a local Map or array: the result and any callback parameter are modelled, so they are
      // checked themselves; writes such as `push`, and every other operation, remain unknown.
      if (
        holder &&
        ts.isPropertyAccessExpression(parent) &&
        parent.expression === node &&
        !written(parent) &&
        (collectionCall(parent.parent)?.receiver === node ||
          (parent.name.text === 'length' && collection(node, false)) ||
          (parent.name.text === 'size' && collection(node, true)))
      )
        continue;
      const noRest = (name: ts.BindingName): boolean =>
        ts.isIdentifier(name) ||
        name.elements.every(
          (element) =>
            !ts.isOmittedExpression(element) &&
            !element.dotDotDotToken &&
            noRest(element.name),
        );
      // A holder bound by const, including destructured fields: every binding is checked through the field model.
      if (
        holder &&
        ts.isVariableDeclaration(parent) &&
        parent.initializer === node &&
        constList(parent.parent) &&
        noRest(parent.name)
      )
        continue;
      if (
        holder &&
        ts.isForOfStatement(parent) &&
        parent.expression === node &&
        constList(parent.initializer)
      )
        continue;
      // A field or element of a local literal that is itself tracked as a holder.
      if (
        ((ts.isPropertyAssignment(parent) &&
          parent.initializer === node &&
          staticName(parent.name) !== undefined) ||
          ts.isShorthandPropertyAssignment(parent)) &&
        kind(parent.parent) === 'holder'
      )
        continue;
      if (
        holder &&
        ts.isSpreadAssignment(parent) &&
        kind(parent.parent) === 'holder' &&
        // A copied method keeps `this` bound to the copy, which the field model does not follow.
        !allocations(node).some((site) =>
          memberValues(site, undefined).some(
            (value) => ts.isFunctionLike(value) && usesThis(value),
          ),
        )
      )
        continue;
      if (ts.isArrayLiteralExpression(parent) && kind(parent) === 'holder')
        continue;
      if (
        holder &&
        ts.isSpreadElement(parent) &&
        ts.isArrayLiteralExpression(parent.parent) &&
        kind(parent.parent) === 'holder'
      )
        continue;
      // `this.field = value` inside a class defines the instance's field.
      if (
        ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        parent.right === node &&
        ts.isPropertyAccessExpression(parent.left) &&
        parent.left.expression.kind === ts.SyntaxKind.ThisKeyword
      ) {
        const site = thisSite(parent.left.expression);
        if (site && ts.isClassLike(site) && kind(site) === 'holder') continue;
      }
      if (ts.isNewExpression(parent) && localArgument(node, parent)) continue;
      // Tests and comparisons read no member; alternatives pass the value to an expression checked itself.
      if (condition(node) || alternatives(parent)?.includes(node)) continue;
      if (
        holder &&
        (ts.isPropertyAccessExpression(parent) ||
          ts.isElementAccessExpression(parent)) &&
        parent.expression === node
      ) {
        if (written(parent)) {
          // Only a class's own `this.field` writes belong to its field model.
          const site =
            node.kind === ts.SyntaxKind.ThisKeyword && thisSite(node);
          if (
            site &&
            ts.isClassLike(site) &&
            ts.isPropertyAccessExpression(parent)
          )
            continue;
          return false;
        }
        const call =
          ts.isCallExpression(parent.parent) &&
          parent.parent.expression === parent
            ? parent.parent
            : undefined;
        if (call) {
          // The receiver becomes `this` of the method, which must be a local function of the holder.
          if (!callTargets(call)?.length) return false;
          markDispatch(call);
          continue;
        }
        // Property and bracket reads inspect the same method candidates; an unknown bracket key checks them all.
        if (
          allocations(node)
            .flatMap((site) => memberValues(site, accessName(parent)))
            .some((value) => returnsTracked(value, kind))
        )
          return false;
        continue;
      }
      // A registered instance: later resolutions of the token read the registration.
      if (
        ts.isCallExpression(parent) &&
        parent.arguments[1] === node &&
        ts.isPropertyAccessExpression(parent.expression) &&
        parent.expression.name.text === 'instance' &&
        kind(parent.expression.expression) === 'container' &&
        ownToken(parent.arguments[0])
      )
        continue;
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
        authority === 'app' &&
        ts.isCallExpression(parent) &&
        parent.arguments.length === 1 &&
        parent.arguments[0] === node &&
        ts.isPropertyAccessExpression(parent.expression) &&
        parent.expression.name.text === 'createRouter' &&
        officialContribution(parent.expression.expression)
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
            ].some(
              (stem) => stem && fn.getSourceFile().fileName.startsWith(stem),
            )
          )
            continue;
        }
      }
      const origin =
        ts.isReturnStatement(parent) && parent.expression === node
          ? enclosing(parent)
          : ts.isArrowFunction(parent) && parent.body === node
            ? parent
            : undefined;
      if (origin && returnable(origin)) continue;
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
            ts.isBinaryExpression(access.parent) &&
            access.parent.left === access
          ))
            continue;
        }
        if (authority === 'app' && ['container', 'config'].includes(name))
          continue;
        const call = parent.parent;
        // Configuration-derived strings; reading one cannot change the application or its identity chain.
        if (
          authority === 'app' &&
          ['appName', 'publicBasePath'].includes(name) &&
          !written(parent) &&
          !(ts.isCallExpression(call) && call.expression === parent)
        )
          continue;
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
          ['middleware', 'for', 'onGrantsChanged'].includes(name)
        ) {
          if (name === 'middleware' && call.arguments.length) return false;
          // A grant listener only receives change notices; its body is checked like any other local code.
          if (name === 'onGrantsChanged' && call.arguments.length !== 1)
            return false;
          continue;
        }
        if (
          authority === 'container' &&
          ['resolve', 'has', 'singleton', 'instance'].includes(name)
        ) {
          const token = call.arguments[0];
          // The entry-wise resolution of a recognized static token map; each token was checked as static.
          if (name === 'resolve' && tokenResolves.has(call)) continue;
          // A token read from an external module's `import()` namespace: an exported token of another package.
          if (
            token &&
            ['resolve', 'has'].includes(name) &&
            ts.isPropertyAccessExpression(token) &&
            token.name.text !== 'authorizationToken'
          ) {
            const source = namespaceImport(token.expression);
            const specifier =
              source && (source.arguments[0] as ts.StringLiteralLike).text;
            if (
              specifier &&
              !/^[.#/]/.test(specifier) &&
              !specifier.startsWith(AUTHORIZATION)
            )
              continue;
          }
          const loaded = token && importedBinding(token);
          if (
            loaded &&
            ['resolve', 'has'].includes(name) &&
            loaded.name !== 'authorizationToken'
          ) {
            const specifier = (
              loaded.source.arguments[0] as ts.StringLiteralLike
            ).text;
            if (
              !/^[.#/]/.test(specifier) &&
              !specifier.startsWith(AUTHORIZATION)
            )
              continue;
          }
          if (!token || !ts.isIdentifier(token)) return false;
          if (
            authorizationToken(token, analysis) &&
            !['resolve', 'has'].includes(name)
          )
            return false;
          const declaration = tokenDeclaration(token);
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
            (call.arguments.length !== 1 ||
              kind(call.arguments[0]) !== 'runtime')
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
          if (
            name === 'addHttpMiddleware' &&
            call.arguments.length === 1 &&
            middlewares.has(call.arguments[0])
          )
            continue;
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
              !statement.moduleSpecifier.text.startsWith(
                '@nocobase/app-server/',
              )
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
          capabilityFunctions.has(declaration),
        )
      )
        continue;
      const parent = node.parent;
      if (
        (ts.isFunctionDeclaration(parent) || ts.isMethodDeclaration(parent)) &&
        parent.name === node
      )
        continue;
      if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent))
        continue;
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
      // The name of a method called through its receiver, `receiver.method(...)`.
      if (
        ts.isPropertyAccessExpression(parent) &&
        parent.name === node &&
        ts.isCallExpression(parent.parent) &&
        parent.parent.expression === parent
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
    for (const node of nodes) {
      if (!ts.isIdentifier(node)) continue;
      const declarations = analysis.declarations(node);
      if (!declarations.some((declaration) => strictFunctions.has(declaration)))
        continue;
      const parent = node.parent;
      if (
        (ts.isFunctionDeclaration(parent) ||
          ts.isVariableDeclaration(parent)) &&
        parent.name === node
      )
        continue;
      if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent))
        continue;
      if (ts.isCallExpression(parent) && parent.expression === node) continue;
      if (
        ts.isCallExpression(parent) &&
        parent.arguments[1] === node &&
        ts.isPropertyAccessExpression(parent.expression) &&
        parent.expression.name.text === 'singleton' &&
        kind(parent.expression.expression) === 'container' &&
        ownToken(parent.arguments[0])
      )
        continue;
      return false;
    }
    // A class whose instances carry a tracked field is only instantiated here; handing out the class would let
    // other code construct such an instance.
    for (const node of nodes) {
      if (!ts.isIdentifier(node)) continue;
      const declarations = analysis.declarations(node);
      if (
        declarations.length !== 1 ||
        !ts.isClassLike(declarations[0]) ||
        kind(declarations[0]) !== 'holder'
      )
        continue;
      const parent = node.parent;
      if (ts.isClassLike(parent) && parent.name === node) continue;
      if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent))
        continue;
      // The runtime's own provider list: the host constructs each checked service provider itself.
      if (
        ts.isArrayLiteralExpression(parent) &&
        !!entries.providers &&
        parent === exported(entries.providers)
      )
        continue;
      if (ts.isImportClause(parent)) continue;
      if (ts.isNewExpression(parent) && parent.expression === node) continue;
      // A static member belongs to the class value, which never carries an instance's fields.
      if (
        ts.isPropertyAccessExpression(parent) &&
        parent.expression === node &&
        !written(parent) &&
        declarations[0].members.some(
          (member) =>
            staticName(member.name) === parent.name.text &&
            (ts.canHaveModifiers(member)
              ? ts.getModifiers(member)
              : undefined
            )?.some((item) => item.kind === ts.SyntaxKind.StaticKeyword),
        )
      )
        continue;
      if (
        ts.isBinaryExpression(parent) &&
        parent.right === node &&
        parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword
      )
        continue;
      return false;
    }
    return true;
  };
  for (let round = 0; round < 16; round++) {
    pass++;
    changed = false;
    callerCache.clear();
    tokenMaps.clear();
    tokenMapValues.clear();
    tokenEntries.clear();
    tokenResolves.clear();
    for (const node of nodes) {
      if (!ts.isExpression(node)) continue;
      if (
        ts.isIdentifier(node) &&
        node.parent &&
        'name' in node.parent &&
        node.parent.name === node &&
        !ts.isShorthandPropertyAssignment(node.parent)
      )
        continue;
      kind(node);
    }
    if (changed) continue;
    const proven = verify();
    if (!changed) return proven && visits <= LIMIT && !exhausted;
  }
  return false;
}
