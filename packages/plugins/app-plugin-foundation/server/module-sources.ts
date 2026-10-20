import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

import type {
  FoundationModuleSource,
  FoundationModuleSources,
} from '../shared/foundation.js';
import type { RuntimeProviderEvidence } from './provider-inventory.js';
import { SourceEvidence } from './source-evidence.js';

const MAX_FILES = 400;
const MAX_BYTES = 512_000;
const SOURCE_SUFFIXES = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

interface Source {
  readonly file: string;
  readonly ast: ts.SourceFile;
  readonly imports: readonly string[];
}

interface ApiReference {
  readonly path: string;
  readonly method: string;
}

/** Reads static declarations and value imports only. Never imports an application module or invokes a loader. */
export async function collectModuleSources(
  rootDir: string,
  runtime: readonly RuntimeProviderEvidence[] = [],
): Promise<FoundationModuleSources> {
  const routes: FoundationModuleSource[] = [];
  let complete = true;
  const roots = new Map<string, string | undefined>([['', rootDir]]);
  let overridden = new Set<string>();
  for (const entry of runtime)
    if (entry.rootDir) roots.set(entry.name, entry.rootDir);
  for (const [name, directory] of roots) {
    if (!directory || name === '@nocobase/app-plugin-foundation') continue;
    try {
      const graph = await SourceGraph.create(directory);
      if (!name) overridden = await graph.overrides();
      const packageName = name || graph.packageName;
      if (!packageName) {
        complete = false;
        continue;
      }
      const entry = await graph.entry();
      if (!entry) {
        complete = false;
        continue;
      }
      const declarationFiles = await graph.walk(entry, false);
      await graph.prepare(entry);
      const endpoints = await graph.apiDependencies();
      for (const source of declarationFiles.sources) {
        const declarations: { name: string; loader: ts.Node }[] = [];
        const visit = (node: ts.Node): void => {
          if (ts.isObjectLiteralExpression(node)) {
            const routeName = property(node, 'name');
            const loader = property(node, 'componentLoader');
            if (routeName && ts.isStringLiteralLike(routeName) && loader)
              declarations.push({ name: routeName.text, loader });
          }
          ts.forEachChild(node, visit);
        };
        visit(source.ast);
        for (const declaration of declarations) {
          if (overridden.has(`${packageName}:${declaration.name}`)) {
            routes.push({
              packageName,
              routeName: declaration.name,
              providers: [],
              complete: false,
            });
            continue;
          }
          const imports = importsIn(declaration.loader);
          const providers = new Set<string>();
          const apiProviders = new Set<string>();
          let routeComplete = declarationFiles.complete && imports.length > 0;
          for (const specifier of imports) {
            const target = await graph.local(source.file, specifier);
            if (!target) {
              if (!isLocal(specifier)) addProvider(providers, specifier);
              else routeComplete = false;
              continue;
            }
            const page = graph.evidence(target);
            for (const provider of page.providers) providers.add(provider);
            for (const file of page.sources) {
              for (const request of graph.requests(file)) {
                for (const endpoint of endpoints)
                  if (
                    request.method === endpoint.method &&
                    sameApiPath(request.path, endpoint.path)
                  )
                    for (const provider of endpoint.providers)
                      apiProviders.add(provider);
              }
            }
            routeComplete &&= page.complete;
          }
          routes.push({
            packageName,
            routeName: declaration.name,
            providers: [...providers].sort(),
            ...(apiProviders.size
              ? { apiProviders: [...apiProviders].sort() }
              : {}),
            complete: routeComplete,
          });
        }
      }
      complete &&= declarationFiles.complete;
    } catch {
      complete = false;
    }
  }
  return { routes, complete };
}

/** A bounded package-local graph; symlinks, aliases and relative paths cannot escape the owning package. */
class SourceGraph {
  private readonly files = new Map<string, Source | undefined>();
  private analysis: SourceEvidence | undefined;
  private constructor(
    private readonly root: string,
    public readonly packageName: string,
    private readonly aliases: Readonly<Record<string, unknown>>,
  ) {}

  public static async create(root: string): Promise<SourceGraph> {
    const directory = await realpath(root);
    const manifest: unknown = JSON.parse(
      await readFile(path.join(directory, 'package.json'), 'utf8'),
    );
    const record = isRecord(manifest) ? manifest : {};
    return new SourceGraph(
      directory,
      typeof record.name === 'string' ? record.name : '',
      isRecord(record.imports) ? record.imports : {},
    );
  }

  public async resolve(base: string): Promise<string | undefined> {
    if (!inside(this.root, path.resolve(base))) return undefined;
    const extension = path.extname(base);
    const stem = SOURCE_SUFFIXES.includes(extension)
      ? base.slice(0, -extension.length)
      : base;
    for (const candidate of [
      ...SOURCE_SUFFIXES.map((suffix) => stem + suffix),
      base,
      ...SOURCE_SUFFIXES.map((suffix) => path.join(base, 'index' + suffix)),
    ]) {
      try {
        const file = await realpath(candidate);
        if (
          !SOURCE_SUFFIXES.includes(path.extname(file)) ||
          !inside(this.root, file) ||
          path
            .relative(this.root, file)
            .split(path.sep)
            .includes('node_modules')
        )
          continue;
        if ((await stat(file)).isFile()) return file;
      } catch {
        /* Missing alternatives are expected when resolving compiled .js references to .tsx sources. */
      }
    }
    return undefined;
  }

  public async entry(): Promise<string | undefined> {
    return (
      (await this.resolve(path.join(this.root, 'client/routes.js'))) ??
      (await this.resolve(path.join(this.root, 'dist/client/routes.js')))
    );
  }

  public async prepare(entry: string): Promise<void> {
    await this.walk(entry, true);
    const server =
      (await this.resolve(path.join(this.root, 'server/routes/index.js'))) ??
      (await this.resolve(path.join(this.root, 'server/routes.js')));
    if (server) await this.walk(server, false);
    const resolutions = new Map<string, string>();
    for (const source of this.files.values()) {
      if (!source) continue;
      for (const specifier of [
        ...source.imports,
        ...dynamicImports(source.ast),
      ]) {
        const target = await this.local(source.file, specifier);
        if (target) resolutions.set(`${source.file}\0${specifier}`, target);
      }
    }
    this.analysis = new SourceEvidence(
      [...this.files.values()].filter((source): source is Source =>
        Boolean(source),
      ),
      resolutions,
    );
  }

  public evidence(
    file: string,
    roots?: readonly ts.Node[],
  ): {
    sources: (Source & { nodes: ReadonlySet<ts.Node> })[];
    providers: Set<string>;
    complete: boolean;
  } {
    const slice = this.analysis?.collect(file, roots);
    const providers = new Set<string>();
    for (const reference of slice?.references ?? [])
      addProvider(providers, reference);
    return {
      providers,
      complete: slice?.complete ?? false,
      sources: [...(slice?.nodes ?? [])].flatMap(([name, nodes]) => {
        const source = this.files.get(name);
        return source ? [{ ...source, nodes }] : [];
      }),
    };
  }

  public requests(
    source: Source & { nodes: ReadonlySet<ts.Node> },
  ): ApiReference[] {
    return requestPaths(source.ast, source.nodes, (node) =>
      this.analysis?.symbol(node),
    );
  }

  public async overrides(): Promise<Set<string>> {
    const ids = new Set<string>();
    const entry = await this.resolve(
      path.join(this.root, 'client/route-overrides.js'),
    );
    if (!entry) return ids;
    const graph = await this.walk(entry, false);
    for (const source of graph.sources) {
      const visit = (node: ts.Node): void => {
        if (ts.isObjectLiteralExpression(node)) {
          const id = property(node, 'routeId');
          if (id && ts.isStringLiteralLike(id)) ids.add(id.text);
        }
        ts.forEachChild(node, visit);
      };
      visit(source.ast);
    }
    return ids;
  }

  /** Only explicit, root-mounted Hono endpoints and literal API-client requests can establish this bridge. */
  public async apiDependencies(): Promise<
    readonly (ApiReference & { providers: readonly string[] })[]
  > {
    const entry =
      (await this.resolve(path.join(this.root, 'server/routes/index.js'))) ??
      (await this.resolve(path.join(this.root, 'server/routes.js')));
    if (!entry) return [];
    const graph = this.evidence(entry);
    const endpoints: (ApiReference & { providers: readonly string[] })[] = [];
    for (const source of graph.sources) {
      if (!source.imports.includes('hono')) continue;
      const mounts = new Map<string, string[]>();
      const routes: (ApiReference & {
        router: string;
        handlers: readonly ts.Node[];
      })[] = [];
      const reachableScope = (node: ts.Node): boolean => {
        for (let parent = node.parent; parent; parent = parent.parent)
          if (ts.isFunctionLike(parent)) return source.nodes.has(parent);
        return true;
      };
      const visit = (node: ts.Node): void => {
        if (
          ts.isCallExpression(node) &&
          reachableScope(node) &&
          ts.isPropertyAccessExpression(node.expression)
        ) {
          const first = node.arguments[0];
          if (first && ts.isStringLiteralLike(first)) {
            const method = node.expression.name.text;
            const child = node.arguments[1];
            if (method === 'route' && child && ts.isIdentifier(child))
              mounts.set(child.text, [
                ...(mounts.get(child.text) ?? []),
                first.text,
              ]);
            if (
              ['get', 'post', 'put', 'patch', 'delete'].includes(method) &&
              first.text.startsWith('/') &&
              ts.isIdentifier(node.expression.expression)
            )
              routes.push({
                router: node.expression.expression.text,
                path: first.text,
                method: method.toUpperCase(),
                handlers: node.arguments.slice(1),
              });
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source.ast);
      if (!routes.length) continue;
      for (const route of routes) {
        // Prefixes composed elsewhere, factories and dynamic routing remain unknown rather than guessed.
        if (!(mounts.get(route.router) ?? []).includes('/')) continue;
        endpoints.push({
          path: route.path,
          method: route.method,
          providers: [
            ...this.evidence(source.file, route.handlers).providers,
          ].sort(),
        });
      }
    }
    return endpoints;
  }

  public async local(
    from: string,
    specifier: string,
  ): Promise<string | undefined> {
    if (specifier.startsWith('.'))
      return this.resolve(path.resolve(path.dirname(from), specifier));
    if (!specifier.startsWith('#')) return undefined;
    for (const [alias, value] of Object.entries(this.aliases).sort(
      ([a], [b]) => b.length - a.length,
    )) {
      const star = alias.indexOf('*');
      const matches =
        star < 0
          ? alias === specifier
          : specifier.startsWith(alias.slice(0, star)) &&
            specifier.endsWith(alias.slice(star + 1));
      if (!matches) continue;
      const replacement =
        star < 0
          ? ''
          : specifier.slice(star, specifier.length - (alias.length - star - 1));
      for (const target of targets(value)) {
        if (!target.startsWith('./')) continue;
        const resolved = await this.resolve(
          path.resolve(this.root, target.replace('*', replacement)),
        );
        if (resolved) return resolved;
      }
    }
    return undefined;
  }

  public async walk(
    entry: string,
    includePages: boolean,
  ): Promise<{ sources: Source[]; providers: Set<string>; complete: boolean }> {
    const pending = [entry];
    const visited = new Set<string>();
    const sources: Source[] = [];
    const providers = new Set<string>();
    let complete = true;
    while (pending.length) {
      const file = pending.shift();
      if (!file || visited.has(file)) continue;
      visited.add(file);
      const source = await this.read(file);
      if (!source) {
        complete = false;
        continue;
      }
      sources.push(source);
      for (const specifier of source.imports) {
        if (!isLocal(specifier)) {
          addProvider(providers, specifier);
          continue;
        }
        const target = await this.local(file, specifier);
        if (!target) {
          complete = false;
          continue;
        }
        pending.push(target);
      }
      if (includePages) {
        for (const specifier of dynamicImports(source.ast)) {
          const target = await this.local(file, specifier);
          if (target) pending.push(target);
          else if (isLocal(specifier)) complete = false;
          else addProvider(providers, specifier);
        }
      }
    }
    return { sources, providers, complete };
  }

  private async read(file: string): Promise<Source | undefined> {
    if (this.files.has(file)) return this.files.get(file);
    if (this.files.size >= MAX_FILES) return undefined;
    this.files.set(file, undefined);
    try {
      if ((await stat(file)).size > MAX_BYTES) return undefined;
      const ast = ts.createSourceFile(
        file,
        await readFile(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const source = { file, ast, imports: staticImports(ast) };
      this.files.set(file, source);
      return source;
    } catch {
      return undefined;
    }
  }
}

function property(
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression | undefined {
  const entry = object.properties.find(
    (item) =>
      item.name &&
      (ts.isIdentifier(item.name) || ts.isStringLiteralLike(item.name)) &&
      item.name.text === name,
  );
  return entry && ts.isPropertyAssignment(entry)
    ? entry.initializer
    : undefined;
}

function staticImports(node: ts.SourceFile): string[] {
  return node.statements.flatMap((statement) => {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      const clause = statement.importClause;
      if (clause?.isTypeOnly) return [];
      if (
        clause?.namedBindings &&
        ts.isNamedImports(clause.namedBindings) &&
        !clause.name &&
        clause.namedBindings.elements.length > 0 &&
        clause.namedBindings.elements.every((element) => element.isTypeOnly)
      )
        return [];
      return [statement.moduleSpecifier.text];
    }
    if (
      ts.isExportDeclaration(statement) &&
      !statement.isTypeOnly &&
      statement.moduleSpecifier &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      if (
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause) &&
        statement.exportClause.elements.length > 0 &&
        statement.exportClause.elements.every((element) => element.isTypeOnly)
      )
        return [];
      return [statement.moduleSpecifier.text];
    }
    return [];
  });
}

function dynamicImports(node: ts.Node): string[] {
  return importsIn(node);
}

function requestPaths(
  source: ts.SourceFile,
  selected: ReadonlySet<ts.Node>,
  symbol: (node: ts.Node) => ts.Symbol | undefined,
): ApiReference[] {
  const paths: ApiReference[] = [];
  const clients = new Set<ts.Symbol | undefined>();
  const hooks = new Set<ts.Symbol | undefined>();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@nocobase/app-client'
    )
      continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings))
      for (const binding of bindings.elements)
        if (
          (binding.propertyName?.text ?? binding.name.text) === 'useApiClient'
        )
          hooks.add(symbol(binding.name));
  }
  const findClients = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      selected.has(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      symbol(node.initializer.expression) &&
      hooks.has(symbol(node.initializer.expression))
    )
      clients.add(symbol(node.name));
    ts.forEachChild(node, findClients);
  };
  findClients(source);
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      selected.has(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'request' &&
      ts.isIdentifier(node.expression.expression) &&
      symbol(node.expression.expression) &&
      clients.has(symbol(node.expression.expression))
    ) {
      const argument = node.arguments[0];
      const value =
        argument && ts.isObjectLiteralExpression(argument)
          ? property(argument, 'path')
          : undefined;
      const declaredMethod =
        argument && ts.isObjectLiteralExpression(argument)
          ? property(argument, 'method')
          : undefined;
      const method =
        declaredMethod === undefined
          ? 'GET'
          : ts.isStringLiteralLike(declaredMethod)
            ? declaredMethod.text
            : undefined;
      if (!method) return;
      if (value && ts.isStringLiteralLike(value))
        paths.push({ path: value.text, method });
      if (value && ts.isTemplateExpression(value))
        paths.push({
          method,
          path:
            value.head.text +
            value.templateSpans
              .map((span) => ':dynamic' + span.literal.text)
              .join(''),
        });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return paths;
}

function sameApiPath(request: string, endpoint: string): boolean {
  const segments = (value: string): string[] =>
    value.split('?')[0].split('/').filter(Boolean);
  const left = segments(request),
    right = segments(endpoint);
  return (
    left.length === right.length &&
    left.every((part, index) =>
      right[index]?.startsWith(':') ? part.length > 0 : part === right[index],
    )
  );
}
function importsIn(node: ts.Node): string[] {
  const found: string[] = [];
  const visit = (child: ts.Node): void => {
    if (
      ts.isCallExpression(child) &&
      child.expression.kind === ts.SyntaxKind.ImportKeyword &&
      child.arguments[0] &&
      ts.isStringLiteralLike(child.arguments[0])
    )
      found.push(child.arguments[0].text);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}
function packageOf(specifier: string): string {
  return specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');
}

function addProvider(providers: Set<string>, specifier: string): void {
  const name = packageOf(specifier);
  // The server SDK also provides routing and configuration. Those generic imports do not establish use of jobs,
  // queues, secrets or caching merely because the SDK as a whole provides operational facilities.
  if (
    name === '@nocobase/app-server' &&
    !/^@nocobase\/app-server\/(?:jobs|queue|secrets|caching)(?:\/|$)/.test(
      specifier,
    )
  )
    return;
  providers.add(name);
}
function isLocal(specifier: string): boolean {
  return (
    specifier.startsWith('.') ||
    specifier.startsWith('#') ||
    specifier.startsWith('/')
  );
}
function inside(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function targets(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!isRecord(value)) return [];
  return [value.development, value.import, value.default].flatMap((item) =>
    targets(item),
  );
}
