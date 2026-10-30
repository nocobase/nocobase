import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

import type {
  FoundationModuleSource,
  FoundationModuleSources,
  FoundationApiEvidence,
} from '../shared/foundation.js';
import type { RuntimeProviderEvidence } from './provider-inventory.js';
import { authorizationProgram } from './authorization-evidence.js';
import { SourceEvidence } from './source-evidence.js';
import { readModuleManifest } from './module-manifest.js';
import { apiDependencies as analyzeApiDependencies } from './api-evidence.js';
import { endpointChain } from './endpoint-chain.js';
import { pageRequests } from './request-evidence.js';
import { StaticValues } from './static-values.js';
import { RouteEvidence } from './route-evidence.js';
import { sourceAliases, aliasMatches } from './source-aliases.js';

// A larger application reports its module evidence as incomplete rather than being read without bound.
const MAX_FILES = 2_000;
const MAX_BYTES = 512_000;
const MAX_TOTAL_BYTES = 32_000_000;
const SOURCE_SUFFIXES = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

interface Source {
  readonly file: string;
  readonly ast: ts.SourceFile;
  readonly imports: readonly string[];
}

export interface ModuleSourceObservation {
  watch(file: string): Promise<void>;
  unreadable(): void;
}

/** Reads static declarations and value imports only. Never imports an application module or invokes a loader. */
export async function collectModuleSources(
  rootDir: string,
  runtime: readonly RuntimeProviderEvidence[] = [],
  observation?: ModuleSourceObservation,
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
      const graph = await SourceGraph.create(directory, observation);
      if (!name) overridden = await graph.overrides();
      const packageName = name || graph.packageName;
      if (!packageName) {
        complete = false;
        continue;
      }
      const entry = await graph.entry();
      if (!entry) {
        if (!name)
          await observation?.watch(
            path.join(directory, 'server/foundation-modules.json'),
          );
        const built = !name
          ? await readModuleManifest(directory, packageName)
          : undefined;
        if (built) {
          routes.push(...built.routes);
          complete &&= built.complete;
        } else {
          complete = false;
          if (!name) observation?.unreadable();
        }
        continue;
      }
      const declarationFiles = await graph.walk(entry, false);
      const backendComplete = await graph.prepare(entry);
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
          const apiEvidence: FoundationApiEvidence[] = [];
          let routeComplete = declarationFiles.complete && imports.length > 0;
          for (const { from, specifier } of imports) {
            const target = await graph.local(from, specifier);
            if (!target) {
              if (!graph.isLocal(specifier)) addProvider(providers, specifier);
              else routeComplete = false;
              continue;
            }
            const page = graph.evidence(target);
            for (const provider of page.providers) providers.add(provider);
            for (const request of graph.requests(page.sources)) {
              routeComplete &&= backendComplete;
              const chain = endpointChain(request, endpoints);
              routeComplete &&= chain.complete;
              for (const endpoint of chain.endpoints) {
                for (const provider of endpoint.providers)
                  apiProviders.add(provider);
                for (const collection of endpoint.collections ?? [])
                  collections.add(collection);
                if (endpoint.providers.length) {
                  const evidence = {
                    method: request.method,
                    path: endpoint.path,
                    providers: endpoint.providers,
                    conditions: endpoint.conditions ?? [],
                  };
                  if (
                    !apiEvidence.some(
                      (item) =>
                        JSON.stringify(item) === JSON.stringify(evidence),
                    )
                  )
                    apiEvidence.push(evidence);
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
            ...(apiEvidence.length ? { apiEvidence } : {}),
            ...(collections.size
              ? { collections: [...collections].sort() }
              : {}),
            complete: routeComplete,
          });
          complete &&= routeComplete;
        }
      }
      complete &&= declarationFiles.complete && graph.declarationsComplete;
    } catch {
      observation?.unreadable();
      complete = false;
    }
  }
  return { routes, complete };
}

/** A bounded package-local graph; symlinks, aliases and relative paths cannot escape the owning package. */
class SourceGraph {
  private readonly files = new Map<string, Source | undefined>();
  private bytes = 0;
  private analysis: SourceEvidence | undefined;
  private serverEntry: string | undefined;
  private constructor(
    private readonly root: string,
    public readonly packageName: string,
    private readonly aliases: Readonly<Record<string, unknown>>,
    private readonly paths: ReadonlyMap<string, string | undefined>,
    private readonly observation?: ModuleSourceObservation,
  ) {}

  public static async create(
    root: string,
    observation?: ModuleSourceObservation,
  ): Promise<SourceGraph> {
    await observation?.watch(root);
    await observation?.watch(path.join(root, 'package.json'));
    const directory = await realpath(root);
    const manifest: unknown = JSON.parse(
      await readFile(path.join(directory, 'package.json'), 'utf8'),
    );
    const record = isRecord(manifest) ? manifest : {};
    return new SourceGraph(
      directory,
      typeof record.name === 'string' ? record.name : '',
      isRecord(record.imports) ? record.imports : {},
      await sourceAliases(directory, observation),
      observation,
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
      await this.observation?.watch(path.dirname(candidate));
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
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT' && code !== 'ENOTDIR')
          this.observation?.unreadable();
        /* Missing alternatives are expected when resolving compiled .js references to .tsx sources. */
      }
    }
    return undefined;
  }

  public async entry(): Promise<string | undefined> {
    return this.conventionalEntry('client/routes.js');
  }

  /** Prefer source entries in a checkout, then the same conventional entries in a published package. */
  private async conventionalEntry(
    ...names: string[]
  ): Promise<string | undefined> {
    for (const layout of ['', 'dist'])
      for (const name of names) {
        const file = await this.resolve(path.join(this.root, layout, name));
        if (file) return file;
      }
    return undefined;
  }

  public async prepare(entry: string): Promise<boolean> {
    this.serverEntry = await this.conventionalEntry(
      'server/routes/index.js',
      'server/routes.js',
    );
    const nativeSources = new Map<string, Source>();
    const serverGraph = this.serverEntry
      ? await this.walk(this.serverEntry, false)
      : undefined;
    serverGraph?.sources.forEach((source) =>
      nativeSources.set(source.file, source),
    );
    let backendComplete = serverGraph?.complete ?? false;
    const providerEntries: string[] = [];
    for (const name of [
      'server/providers/index.js',
      'server/providers.js',
      'server/service-provider.js',
    ]) {
      const provider = await this.conventionalEntry(name);
      if (provider) {
        providerEntries.push(provider);
        const graph = await this.walk(provider, false);
        backendComplete &&= graph.complete;
        graph.sources.forEach((source) =>
          nativeSources.set(source.file, source),
        );
      }
    }
    const identityEntries = {
      providers: providerEntries[0],
      runtime: await this.conventionalEntry('server/runtime.js'),
      plugins: await this.conventionalEntry('server/plugins.js'),
      authorization: await this.conventionalEntry(
        'server/config/authorization.js',
      ),
    };
    const identitySources = new Map<string, Source>();
    let identityComplete = true;
    for (const entry of [
      ...Object.values(identityEntries),
      await this.conventionalEntry('server/app.js'),
      await this.conventionalEntry('server/standalone.js'),
      await this.conventionalEntry('server/embedded.js'),
    ]) {
      if (!entry) continue;
      const graph = await this.walk(entry, true);
      identityComplete &&= graph.complete;
      graph.sources.forEach((source) =>
        identitySources.set(source.file, source),
      );
    }
    let nativeComplete = true;
    for (const root of [this.serverEntry, ...providerEntries]) {
      if (!root || identitySources.has(root)) continue;
      const graph = await this.walk(root, true);
      nativeComplete &&= graph.complete;
      graph.sources.forEach((source) => nativeSources.set(source.file, source));
    }
    // Read backend declarations before lazy page graphs can exhaust the shared source budget.
    await this.walk(entry, true);
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
      (specifier) => this.isLocal(specifier),
      {
        // These are executable backend roots already traversed for API and identity evidence.
        // Browser-only pages are not executed in the process owning Node's crypto intrinsics.
        sources: [...new Map([...nativeSources, ...identitySources]).values()],
        complete: backendComplete && identityComplete && nativeComplete,
      },
    );
    this.analysis.registerServices(providerEntries);
    this.analysis.authorizationIdentityResolved =
      identityComplete &&
      authorizationProgram(
        this.analysis,
        [...identitySources.values()],
        identityEntries,
      );
    return backendComplete;
  }

  public evidence(
    file: string,
    roots?: readonly ts.Node[],
    contextualCalls = false,
  ): {
    sources: (Source & { nodes: ReadonlySet<ts.Node> })[];
    providers: Set<string>;
    collections: Set<string>;
    complete: boolean;
    unsafeCapability: boolean;
    unsafeValue: boolean;
  } {
    const slice = this.analysis?.collect(file, roots, contextualCalls);
    const providers = new Set<string>();
    for (const reference of slice?.references ?? [])
      addProvider(providers, reference);
    return {
      providers,
      collections: slice?.collections ?? new Set(),
      complete: slice?.complete ?? false,
      unsafeCapability: slice?.unsafeCapability ?? true,
      unsafeValue: slice?.unsafeValue ?? true,
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

  public declarationsComplete = true;
  public routeDeclarations(
    ast: ts.SourceFile,
  ): ReturnType<RouteEvidence['collect']> {
    if (!this.analysis) return [];
    const evidence = new RouteEvidence(this.analysis);
    const declarations = evidence.collect(ast);
    this.declarationsComplete &&= evidence.complete;
    return declarations;
  }

  public loaderImports(
    node: ts.Node,
    bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
  ): { from: string; specifier: string }[] {
    const literals = this.analysis && new StaticValues(this.analysis, bindings);
    return (literals?.values(node) ?? [node]).flatMap((value) => {
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
    const entry = await this.conventionalEntry('client/route-overrides.js');
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
    const entry = this.serverEntry;
    const source = entry && this.files.get(entry);
    if (!source || !this.analysis) return [];
    return analyzeApiDependencies(
      source.ast,
      (await this.walk(source.file, false)).sources,
      this.analysis,
      (file, nodes) => {
        const evidence = this.evidence(file, nodes, true);
        return evidence.unsafeCapability || evidence.unsafeValue
          ? { providers: [], collections: [] }
          : {
              providers: [...evidence.providers].sort(),
              collections: [...evidence.collections].sort(),
            };
      },
    );
  }

  public isLocal(specifier: string): boolean {
    return (
      isLocal(specifier) ||
      specifier.startsWith('@/') ||
      [...this.paths.keys()].some(
        (alias) => aliasMatches(alias, specifier) !== undefined,
      )
    );
  }

  public async local(
    from: string,
    specifier: string,
  ): Promise<string | undefined> {
    if (specifier.startsWith('.'))
      return this.resolve(path.resolve(path.dirname(from), specifier));
    if (!specifier.startsWith('#')) {
      const matches = [...this.paths].filter(
        ([alias]) => aliasMatches(alias, specifier) !== undefined,
      );
      // Equal-specificity declarations must not pick an arbitrary target.
      const specificity = (alias: string): number =>
        alias.includes('*') ? alias.indexOf('*') : Number.MAX_SAFE_INTEGER;
      matches.sort(([a], [b]) => specificity(b) - specificity(a));
      const selected = matches[0];
      if (
        !selected ||
        !selected[1] ||
        (matches[1] && specificity(matches[1][0]) === specificity(selected[0]))
      )
        return undefined;
      return this.resolve(
        selected[1].replace('*', aliasMatches(selected[0], specifier)!),
      );
    }
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
        if (!this.isLocal(specifier)) {
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
          else if (this.isLocal(specifier)) complete = false;
          else addProvider(providers, specifier);
        }
      }
    }
    return { sources, providers, complete };
  }

  private async read(file: string): Promise<Source | undefined> {
    if (this.files.has(file)) return this.files.get(file);
    if (this.files.size >= MAX_FILES) {
      this.observation?.unreadable();
      return undefined;
    }
    this.files.set(file, undefined);
    await this.observation?.watch(file);
    try {
      const size = (await stat(file)).size;
      if (size > MAX_BYTES || this.bytes + size > MAX_TOTAL_BYTES)
        return undefined;
      this.bytes += size;
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
      this.observation?.unreadable();
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
