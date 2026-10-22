import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

import type {
  FoundationModuleSource,
  FoundationModuleSources,
} from '../shared/foundation.js';
import type { RuntimeProviderEvidence } from './provider-inventory.js';
import { SourceEvidence } from './source-evidence.js';
import { readModuleManifest } from './module-manifest.js';
import { apiDependencies as analyzeApiDependencies } from './api-evidence.js';
import { pageRequests } from './request-evidence.js';
import { StaticValues } from './static-values.js';

const MAX_FILES = 400;
const MAX_BYTES = 512_000;
const SOURCE_SUFFIXES = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

interface Source {
  readonly file: string;
  readonly ast: ts.SourceFile;
  readonly imports: readonly string[];
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
        const built = !name
          ? await readModuleManifest(directory, packageName)
          : undefined;
        if (built) {
          routes.push(...built.routes);
          complete &&= built.complete;
        } else complete = false;
        continue;
      }
      const declarationFiles = await graph.walk(entry, false);
      await graph.prepare(entry);
      const endpoints = await graph.apiDependencies();
      for (const source of declarationFiles.sources) {
        const declarations = graph.routeDeclarations(source.ast);
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
          const imports = graph.loaderImports(
            declaration.loader,
            declaration.bindings,
          );
          const providers = new Set<string>();
          const apiProviders = new Set<string>();
          const collections = new Set<string>();
          let routeComplete = declarationFiles.complete && imports.length > 0;
          for (const { from, specifier } of imports) {
            const target = await graph.local(from, specifier);
            if (!target) {
              if (!isLocal(specifier)) addProvider(providers, specifier);
              else routeComplete = false;
              continue;
            }
            const page = graph.evidence(target);
            for (const provider of page.providers) providers.add(provider);
            for (const request of graph.requests(page.sources)) {
              for (const endpoint of endpoints) {
                if (
                  request.method === endpoint.method &&
                  sameApiPath(request.path, endpoint.path)
                ) {
                  for (const provider of endpoint.providers)
                    apiProviders.add(provider);
                  for (const collection of endpoint.collections ?? [])
                    collections.add(collection);
                }
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
            ...(collections.size
              ? { collections: [...collections].sort() }
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
    const providerEntries: string[] = [];
    for (const name of [
      'server/providers/index.js',
      'server/providers.js',
      'server/service-provider.js',
    ]) {
      const provider = await this.resolve(path.join(this.root, name));
      if (provider) {
        providerEntries.push(provider);
        await this.walk(provider, false);
      }
    }
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
    this.analysis.registerServices(providerEntries);
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
    sources: readonly { readonly nodes: ReadonlySet<ts.Node> }[],
  ): ReturnType<typeof pageRequests> {
    return this.analysis ? pageRequests(sources, this.analysis) : [];
  }

  public routeDeclarations(ast: ts.SourceFile): {
    name: string;
    loader: ts.Node;
    bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>;
  }[] {
    if (!this.analysis) return [];
    const analysis = this.analysis;
    const declarations: ReturnType<SourceGraph['routeDeclarations']> = [];
    let visits = 0;
    const visit = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
    ): void => {
      if (++visits > 100_000) return;
      const literals = new StaticValues(analysis, bindings);
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'map'
      ) {
        const arrays = literals
          .values(node.expression.expression)
          .filter(ts.isArrayLiteralExpression);
        const callback = node.arguments[0];
        if (
          arrays.length === 1 &&
          arrays[0].elements.length <= 32 &&
          !arrays[0].elements.some(ts.isSpreadElement) &&
          callback &&
          (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
          callback.parameters[0]
        ) {
          for (const element of arrays[0].elements) {
            const context = new Map(bindings);
            context.set(callback.parameters[0], [element]);
            visit(callback.body, context);
          }
          return;
        }
      }
      if (ts.isObjectLiteralExpression(node)) {
        const name = property(node, 'name');
        const loader = property(node, 'componentLoader');
        if (name && loader)
          for (const routeName of literals.strings(name))
            declarations.push({ name: routeName, loader, bindings });
      }
      ts.forEachChild(node, (child) => visit(child, bindings));
    };
    visit(ast, new Map());
    return declarations;
  }

  public loaderImports(
    node: ts.Node,
    bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
  ): { from: string; specifier: string }[] {
    const literals = this.analysis && new StaticValues(this.analysis, bindings);
    return (this.analysis?.values(node) ?? [node]).flatMap((value) => {
      const body =
        ts.isArrowFunction(value) && !ts.isBlock(value.body)
          ? value.body
          : value;
      return (literals?.values(body) ?? [body]).flatMap((selected) =>
        importsIn(selected).map((specifier) => ({
          from: selected.getSourceFile().fileName,
          specifier,
        })),
      );
    });
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

  public async apiDependencies(): Promise<
    ReturnType<typeof analyzeApiDependencies>
  > {
    const entry =
      (await this.resolve(path.join(this.root, 'server/routes/index.js'))) ??
      (await this.resolve(path.join(this.root, 'server/routes.js')));
    const source = entry && this.files.get(entry);
    if (!source || !this.analysis) return [];
    const graph = this.evidence(source.file);
    return analyzeApiDependencies(
      source.ast,
      graph.sources,
      this.analysis,
      (file, nodes) => [...this.evidence(file, nodes).providers].sort(),
    );
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
