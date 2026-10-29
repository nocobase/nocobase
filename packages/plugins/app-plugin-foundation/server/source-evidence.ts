import ts from 'typescript';
import { StaticValues } from './static-values.js';

export interface EvidenceSource {
  readonly file: string;
  readonly ast: ts.SourceFile;
}

/** Package-local value reachability. The host never loads dependencies, libraries or application code. */
export class SourceEvidence {
  public authorizationIdentityResolved = false;
  private readonly checker: ts.TypeChecker;
  private readonly sources: Map<string, EvidenceSource>;
  private readonly services = new Map<ts.Declaration, ts.Expression[]>();
  private readonly serviceReceivers = new Map<ts.Expression, ts.Expression>();
  private readonly serviceSummaries = new Map<
    ts.Expression,
    {
      readonly values: readonly ts.Node[];
      readonly scopes: ReadonlyMap<
        ts.Node,
        ReadonlyMap<ts.Declaration, readonly ts.Node[]>
      >;
    }
  >();

  /** Reuse one static registration's value summary, without sharing endpoint evidence or mutable scopes. */
  public serviceSummary(
    factory: ts.Expression,
    build: (receiver: ts.Expression | undefined) => {
      readonly values: readonly ts.Node[];
      readonly scopes: ReadonlyMap<
        ts.Node,
        ReadonlyMap<ts.Declaration, readonly ts.Node[]>
      >;
    },
  ): {
    readonly values: readonly ts.Node[];
    readonly scopes: ReadonlyMap<
      ts.Node,
      ReadonlyMap<ts.Declaration, readonly ts.Node[]>
    >;
  } {
    const known = this.serviceSummaries.get(factory);
    if (known) return known;
    this.serviceSummaries.set(factory, { values: [], scopes: new Map() });
    const summary = build(this.serviceReceivers.get(factory));
    this.serviceSummaries.set(factory, summary);
    return summary;
  }

  public constructor(
    sources: readonly EvidenceSource[],
    private readonly resolutions: ReadonlyMap<string, string>,
    private readonly isLocal: (specifier: string) => boolean = (specifier) =>
      /^[.#/]/.test(specifier),
  ) {
    this.sources = new Map(sources.map((source) => [source.file, source]));
    const options: ts.CompilerOptions = {
      noLib: true,
      noResolve: false,
      allowJs: true,
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
    };
    const host = ts.createCompilerHost(options);
    host.getSourceFile = (file) => this.sources.get(file)?.ast;
    host.readFile = () => undefined;
    host.fileExists = (file) => this.sources.has(file);
    host.resolveModuleNames = (names, from) =>
      names.map((name) => {
        const file = resolutions.get(`${from}\0${name}`);
        return file ? { resolvedFileName: file } : undefined;
      });
    this.checker = ts
      .createProgram([...this.sources.keys()], options, host)
      .getTypeChecker();
  }

  /** Only declarations reachable from the provider entry establish service registrations. */
  public registerServices(entries: readonly string[]): void {
    const calls = new Set<ts.Node>();
    const visit = (node: ts.Node): void => {
      if (calls.has(node)) return;
      calls.add(node);
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ['singleton', 'instance'].includes(node.expression.name.text)
      ) {
        const [token, factory] = node.arguments;
        const declaration = token && this.declarations(token)[0];
        if (declaration && factory) {
          this.serviceReceivers.set(factory, node.expression.expression);
          this.services.set(declaration, [
            ...(this.services.get(declaration) ?? []),
            factory,
          ]);
        }
      }
      if (ts.isBlock(node)) {
        for (const statement of node.statements) {
          visit(statement);
          if (new StaticValues(this).definitelyTerminates(statement)) break;
        }
        return;
      }
      // Providers often split registration into private methods on the same instance. Only an
      // explicit local call reaches those methods; merely declaring another method does not.
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.kind === ts.SyntaxKind.ThisKeyword
      )
        for (const declaration of this.declarations(node.expression))
          if (ts.isMethodDeclaration(declaration) && declaration.body)
            visit(declaration.body);
      ts.forEachChild(node, visit);
    };
    for (const entry of entries)
      for (const nodes of this.collect(entry).nodes.values()) {
        for (const node of nodes) {
          if (ts.isCallExpression(node)) visit(node);
          if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
            for (const member of node.members)
              if (
                ts.isMethodDeclaration(member) &&
                ['register', 'boot'].includes(member.name.getText())
              )
                visit(member);
          }
        }
      }
  }

  public collect(
    file: string,
    roots?: readonly ts.Node[],
    contextualCalls = false,
  ): {
    references: Set<string>;
    collections: Set<string>;
    nodes: Map<string, Set<ts.Node>>;
    complete: boolean;
    unsafeCapability: boolean;
    unsafeValue: boolean;
  } {
    const references = new Set<string>();
    const collections = new Set<string>();
    const nodes = new Map<string, Set<ts.Node>>();
    const visited = new Map<ts.Node, Set<string>>();
    const rootFunctions = new Set<ts.SignatureDeclaration>(
      (roots ?? []).flatMap((root) => [
        ...(ts.isFunctionLike(root) ? [root] : []),
        ...this.functions(root),
      ]),
    );
    const symbols = new Set<ts.Symbol>();
    const captures = new Map<
      ts.Node,
      ReadonlyMap<ts.Declaration, readonly ts.Node[]>
    >();
    let complete = true;
    let unsafeCapabilityEscaped = false;
    let unsafeValueEscaped = false;
    let visits = 0;
    const nodeKey = (node: ts.Node): string =>
      `${node.getSourceFile().fileName}:${node.getStart()}`;
    const contextKey = (
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      active: ReadonlySet<ts.Node>,
    ): string =>
      [
        ...[...bindings]
          .map(
            ([declaration, values]) =>
              `${nodeKey(declaration)}=${values.map(nodeKey).join(',')}`,
          )
          .sort(),
        ...[...active].map(nodeKey).sort(),
      ].join('|');
    const definitelyTerminates = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
    ): boolean =>
      new StaticValues(this, bindings, captures).definitelyTerminates(node);
    const capability = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      seen = new Set<ts.Node>(),
    ): boolean => {
      if (seen.has(node) || seen.size >= 32) return true;
      seen = new Set(seen).add(node);
      if (ts.isIdentifier(node)) {
        if (node.text === 'container') return true;
        const bound = this.declarations(node).flatMap(
          (declaration) => bindings.get(declaration) ?? [],
        );
        if (bound.length)
          return bound.some((item) => capability(item, bindings, seen));
      }
      const literals = new StaticValues(this, bindings, captures);
      return literals.values(node).some((value) => {
        if (
          ts.isPropertyAccessExpression(value) &&
          value.name.text === 'container'
        )
          return true;
        if (
          ts.isCallExpression(value) &&
          ts.isPropertyAccessExpression(value.expression) &&
          value.expression.name.text === 'resolve'
        )
          return true;
        if (
          ts.isIdentifier(value) &&
          value.text === 'container' &&
          !this.declarations(value).length
        )
          return true;
        if (ts.isObjectLiteralExpression(value))
          return value.properties.some((property) =>
            ts.isPropertyAssignment(property)
              ? capability(property.initializer, bindings, seen)
              : ts.isShorthandPropertyAssignment(property)
                ? capability(property.name, bindings, seen)
                : ts.isSpreadAssignment(property)
                  ? literals.values(property.expression).length === 0 ||
                    literals
                      .values(property.expression)
                      .some(
                        (spread) => !ts.isObjectLiteralExpression(spread),
                      ) ||
                    capability(property.expression, bindings, seen)
                  : true,
          );
        if (ts.isArrayLiteralExpression(value))
          return value.elements.some(
            (element) =>
              !ts.isSpreadElement(element) &&
              capability(element, bindings, seen),
          );
        if (ts.isFunctionLike(value)) {
          const captured = captures.get(value);
          return (
            captured !== undefined &&
            [...captured.values()].some((items) =>
              items.some((item) => capability(item, captured, seen)),
            )
          );
        }
        return false;
      });
    };
    const candidateValue = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      seen = new Set<ts.Node>(),
      budget = { visits: 0 },
    ): boolean => {
      if (seen.has(node) || seen.size >= 32 || ++budget.visits > 2048)
        return true;
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'resolve' &&
        node.arguments.length === 1 &&
        (this.serviceFactories(node.arguments[0]) !== undefined ||
          this.externalService(node.arguments[0]) === '@nocobase/db')
      )
        return true;
      const next = new Set(seen).add(node);
      const values = new StaticValues(this, bindings, captures).values(node);
      return values.some((value) => {
        if (ts.isArrayLiteralExpression(value))
          return value.elements.some(
            (item) =>
              !ts.isSpreadElement(item) &&
              candidateValue(item, bindings, next, budget),
          );
        if (ts.isObjectLiteralExpression(value))
          return value.properties.some((property) =>
            ts.isPropertyAssignment(property)
              ? candidateValue(property.initializer, bindings, next, budget)
              : ts.isShorthandPropertyAssignment(property)
                ? candidateValue(property.name, bindings, next, budget)
                : ts.isMethodDeclaration(property) ||
                  ts.isGetAccessorDeclaration(property) ||
                  ts.isSetAccessorDeclaration(property),
          );
        if (ts.isFunctionLike(value)) {
          const captured = captures.get(value);
          return Boolean(
            captured &&
            [...captured.values()].some((items) =>
              items.some((item) =>
                candidateValue(item, captured, next, budget),
              ),
            ),
          );
        }
        return (
          ts.isCallExpression(value) &&
          ts.isPropertyAccessExpression(value.expression) &&
          value.expression.name.text === 'resolve' &&
          value.arguments.length === 1 &&
          (this.serviceFactories(value.arguments[0]) !== undefined ||
            this.externalService(value.arguments[0]) === '@nocobase/db')
        );
      });
    };
    const exported = (
      target: string,
      name: string,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]> = new Map(),
      active: ReadonlySet<ts.Node> = new Set(),
    ): void => {
      const ast = this.sources.get(target)?.ast;
      const symbol = ast && this.checker.getSymbolAtLocation(ast);
      const value =
        symbol &&
        this.checker
          .getExportsOfModule(symbol)
          .find((item) => item.name === name);
      if (!value) {
        complete = false;
        return;
      }
      follow(value, bindings, active);
    };
    const imported = (
      declaration: ts.Node,
      name?: string,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]> = new Map(),
      active: ReadonlySet<ts.Node> = new Set(),
    ): boolean => {
      let statement: ts.Node | undefined = declaration;
      while (
        statement &&
        !ts.isImportDeclaration(statement) &&
        !ts.isExportDeclaration(statement)
      )
        statement = statement.parent;
      if (
        !statement ||
        !statement.moduleSpecifier ||
        !ts.isStringLiteralLike(statement.moduleSpecifier)
      )
        return false;
      const specifier = statement.moduleSpecifier.text;
      const target = this.resolutions.get(
        `${statement.getSourceFile().fileName}\0${specifier}`,
      );
      if (!target) {
        if (this.isLocal(specifier)) complete = false;
        else references.add(specifier);
      } else if (name) exported(target, name, bindings, active);
      else complete = false;
      return true;
    };
    const follow = (
      symbol: ts.Symbol,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
      active: ReadonlySet<ts.Node>,
    ): void => {
      if (symbols.has(symbol)) return;
      symbols.add(symbol);
      for (const declaration of symbol.declarations ?? []) {
        if (
          ts.isImportSpecifier(declaration) ||
          ts.isExportSpecifier(declaration)
        ) {
          if (
            declaration.isTypeOnly ||
            (ts.isExportSpecifier(declaration) &&
              declaration.parent.parent.isTypeOnly)
          )
            continue;
          if (
            imported(
              declaration,
              declaration.propertyName?.text ?? declaration.name.text,
              bindings,
              active,
            )
          )
            continue;
          if (ts.isExportSpecifier(declaration)) {
            const local =
              this.checker.getExportSpecifierLocalTargetSymbol(declaration);
            if (local) follow(local, bindings, active);
            else complete = false;
            continue;
          }
          if (symbol.flags & ts.SymbolFlags.Alias)
            follow(this.checker.getAliasedSymbol(symbol), bindings, active);
        } else if (ts.isImportClause(declaration)) {
          if (!declaration.isTypeOnly) imported(declaration, 'default');
        } else if (ts.isNamespaceImport(declaration)) {
          imported(declaration);
        } else if (this.sources.has(declaration.getSourceFile().fileName)) {
          visit(declaration, bindings, active);
        }
      }
    };
    const visit = (
      node: ts.Node,
      bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]> = new Map(),
      active: ReadonlySet<ts.Node> = new Set(),
    ): void => {
      if (ts.isTypeNode(node)) return;
      if (
        contextualCalls &&
        ts.isFunctionLike(node) &&
        !rootFunctions.has(node)
      )
        return;
      if (++visits > 100_000 || active.size >= 32) {
        complete = false;
        return;
      }
      const key = contextualCalls ? contextKey(bindings, active) : '';
      const contexts = visited.get(node) ?? new Set<string>();
      if (contexts.has(key)) return;
      if (contexts.size >= 32) {
        complete = false;
        return;
      }
      contexts.add(key);
      visited.set(node, contexts);
      const sourceFile = node.getSourceFile();
      const selected = nodes.get(sourceFile.fileName) ?? new Set<ts.Node>();
      selected.add(node);
      nodes.set(sourceFile.fileName, selected);
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
      if (contextualCalls && (ts.isBlock(node) || ts.isSourceFile(node))) {
        for (const statement of node.statements) {
          visit(statement, bindings, active);
          if (definitelyTerminates(statement, bindings)) break;
        }
        return;
      }
      if (
        contextualCalls &&
        (ts.isReturnStatement(node) || ts.isThrowStatement(node))
      ) {
        if (node.expression) visit(node.expression, bindings, active);
        return;
      }
      if (contextualCalls && ts.isIfStatement(node)) {
        visit(node.expression, bindings, active);
        const branches = new StaticValues(this, bindings, captures).booleans(
          node.expression,
        );
        if (branches.length === 1) {
          if (branches[0]) visit(node.thenStatement, bindings, active);
          else if (node.elseStatement)
            visit(node.elseStatement, bindings, active);
        } else {
          visit(node.thenStatement, bindings, active);
          if (node.elseStatement) visit(node.elseStatement, bindings, active);
        }
        return;
      }
      if (
        ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isPropertyDeclaration(node)
      ) {
        if (node.initializer) visit(node.initializer, bindings, active);
        return;
      }
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
        // Referring to a class does not mean all its methods are used.
        for (const member of node.members)
          if (
            ts.isConstructorDeclaration(member) ||
            ts.isPropertyDeclaration(member)
          )
            visit(member, bindings, active);
        return;
      }
      if (ts.isPropertyAccessExpression(node)) {
        for (const root of contextualCalls
          ? []
          : this.serviceMethod(node.expression, node.name.text, bindings)) {
          if (contextualCalls && ts.isFunctionLike(root))
            rootFunctions.add(root);
          visit(root, bindings, active);
        }
        const receiver = this.checker.getSymbolAtLocation(node.expression);
        const namespace = receiver?.declarations?.find(ts.isNamespaceImport);
        if (namespace) {
          imported(namespace, node.name.text, bindings, active);
          return;
        }
      }
      if (ts.isIdentifier(node)) {
        const symbol = this.symbol(node);
        const callTarget =
          ts.isCallExpression(node.parent) && node.parent.expression === node;
        if (symbol && (!callTarget || !contextualCalls))
          follow(symbol, bindings, active);
        if (symbol && callTarget)
          for (const declaration of symbol.declarations ?? []) {
            if (ts.isImportSpecifier(declaration) && !declaration.isTypeOnly) {
              let statement: ts.Node = declaration;
              while (!ts.isImportDeclaration(statement) && statement.parent)
                statement = statement.parent;
              if (
                ts.isImportDeclaration(statement) &&
                ts.isStringLiteralLike(statement.moduleSpecifier) &&
                !this.resolutions.has(
                  `${statement.getSourceFile().fileName}\0${statement.moduleSpecifier.text}`,
                ) &&
                !this.isLocal(statement.moduleSpecifier.text)
              )
                references.add(statement.moduleSpecifier.text);
            }
          }
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          const target = this.resolutions.get(
            `${sourceFile.fileName}\0${argument.text}`,
          );
          if (target) exported(target, 'default', bindings, active);
          else if (this.isLocal(argument.text)) complete = false;
          else references.add(argument.text);
        } else complete = false;
      }
      if (contextualCalls && ts.isCallExpression(node)) {
        const evaluator = new StaticValues(this, bindings, captures);
        // An operation on a service another package provides, reached through local values: the call's receiver
        // is what `resolve(token)` returned for that package's token. Resolving the token alone is no evidence.
        if (ts.isPropertyAccessExpression(node.expression))
          for (const value of evaluator.values(node.expression.expression)) {
            const provided =
              ts.isCallExpression(value) &&
              ts.isPropertyAccessExpression(value.expression) &&
              value.expression.name.text === 'resolve' &&
              value.arguments.length === 1
                ? this.externalService(value.arguments[0])
                : undefined;
            if (provided) references.add(provided);
          }
        const database = (
          value: ts.Node,
          seen = new Set<ts.Node>(),
        ): boolean => {
          if (seen.has(value) || seen.size >= 32) return false;
          const next = new Set(seen).add(value);
          if (
            ts.isCallExpression(value) &&
            ts.isPropertyAccessExpression(value.expression)
          ) {
            if (
              value.expression.name.text === 'resolve' &&
              value.arguments.length === 1
            )
              return (
                this.externalService(value.arguments[0]) === '@nocobase/db'
              );
            if (
              ['connection', 'query', 'repository'].includes(
                value.expression.name.text,
              )
            )
              return database(value.expression.expression, next);
          }
          if (
            ts.isPropertyAccessExpression(value) &&
            value.name.text === 'query'
          )
            return database(value.expression, next);
          return evaluator
            .values(value)
            .some(
              (candidate) => candidate !== value && database(candidate, next),
            );
        };
        if (
          ts.isPropertyAccessExpression(node.expression) &&
          [
            'repository',
            'selectFrom',
            'insertInto',
            'updateTable',
            'deleteFrom',
          ].includes(node.expression.name.text) &&
          database(node.expression.expression)
        ) {
          references.add('@nocobase/db');
          const names = node.arguments[0]
            ? evaluator.strings(node.arguments[0])
            : [];
          if (names.length === 1) collections.add(names[0]);
        }
        const invocations = evaluator.invocations(node);
        const serviceCall =
          invocations.length > 0 ||
          (ts.isPropertyAccessExpression(node.expression) &&
            ['connection', 'query', 'repository', 'transaction'].includes(
              node.expression.name.text,
            ) &&
            database(node.expression.expression));
        const safeParser =
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'safeParse';
        const passesCapability =
          invocations.length === 0 &&
          !serviceCall &&
          node.arguments.some((argument) => capability(argument, bindings));
        if (passesCapability) {
          complete = false;
          unsafeCapabilityEscaped = true;
        }
        const escapesCandidate =
          invocations.length === 0 &&
          !serviceCall &&
          !safeParser &&
          (node.arguments.some((argument) =>
            candidateValue(argument, bindings),
          ) ||
            (ts.isPropertyAccessExpression(node.expression) &&
              candidateValue(node.expression.expression, bindings)));
        if (escapesCandidate) {
          complete = false;
          unsafeValueEscaped = true;
        }
        for (const invocation of invocations) {
          if (active.has(invocation.fn)) {
            complete = false;
            continue;
          }
          if ('body' in invocation.fn && invocation.fn.body)
            visit(
              invocation.fn.body,
              invocation.bindings,
              new Set(active).add(invocation.fn),
            );
        }
      }
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ) {
        let target = node.left;
        while (
          (ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target)) &&
          target.expression
        )
          target = target.expression;
        if (candidateValue(target, bindings)) {
          complete = false;
          unsafeValueEscaped = true;
        }
      }
      if (
        (ts.isPrefixUnaryExpression(node) ||
          ts.isPostfixUnaryExpression(node)) &&
        [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
          node.operator,
        )
      ) {
        let target = node.operand;
        while (
          (ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target)) &&
          target.expression
        )
          target = target.expression;
        if (candidateValue(target, bindings)) {
          complete = false;
          unsafeValueEscaped = true;
        }
      }
      if (ts.isDeleteExpression(node)) {
        let target = node.expression;
        while (
          (ts.isPropertyAccessExpression(target) ||
            ts.isElementAccessExpression(target)) &&
          target.expression
        )
          target = target.expression;
        if (candidateValue(target, bindings)) {
          complete = false;
          unsafeValueEscaped = true;
        }
      }
      ts.forEachChild(node, (child) => {
        // A nested helper declaration is not a call. Follow it only when a value reference reaches it.
        if (!ts.isFunctionDeclaration(child)) visit(child, bindings, active);
      });
    };
    if (roots) roots.forEach((root) => visit(root));
    else {
      const ast = this.sources.get(file)?.ast;
      const symbol = ast && this.checker.getSymbolAtLocation(ast);
      const value =
        symbol &&
        this.checker
          .getExportsOfModule(symbol)
          .find((item) => item.name === 'default');
      if (value) follow(value, new Map(), new Set());
      else complete = false;
    }
    return {
      references,
      collections,
      nodes,
      complete,
      unsafeCapability: unsafeCapabilityEscaped,
      unsafeValue: unsafeValueEscaped,
    };
  }

  /** External contracts cannot describe resolved local overrides or unresolved local declarations. */
  public isExternalImport(node: ts.ImportDeclaration): boolean {
    if (!ts.isStringLiteralLike(node.moduleSpecifier)) return false;
    const specifier = node.moduleSpecifier.text;
    return (
      !this.isLocal(specifier) &&
      !this.resolutions.has(`${node.getSourceFile().fileName}\0${specifier}`)
    );
  }

  public importedSource(
    node: ts.ImportDeclaration | ts.ExportDeclaration,
  ): ts.SourceFile | undefined {
    if (ts.isExportDeclaration(node) && node.isTypeOnly) return undefined;
    const clause = ts.isImportDeclaration(node) ? node.importClause : undefined;
    if (clause?.isTypeOnly) return undefined;
    const named = clause?.namedBindings;
    if (
      named &&
      ts.isNamedImports(named) &&
      !clause?.name &&
      named.elements.length &&
      named.elements.every((item) => item.isTypeOnly)
    )
      return undefined;
    if (!node.moduleSpecifier || !ts.isStringLiteralLike(node.moduleSpecifier))
      return undefined;
    const file = this.resolutions.get(
      `${node.getSourceFile().fileName}\0${node.moduleSpecifier.text}`,
    );
    return file ? this.sources.get(file)?.ast : undefined;
  }

  /** The declarations of one export of the local module an `import()` call loads. */
  public namespaceExport(
    call: ts.CallExpression,
    name: string,
  ): readonly ts.Declaration[] {
    const specifier = call.arguments[0];
    if (!specifier || !ts.isStringLiteralLike(specifier)) return [];
    const file = this.resolutions.get(
      `${call.getSourceFile().fileName}\0${specifier.text}`,
    );
    const source = file ? this.sources.get(file)?.ast : undefined;
    const module = source && this.checker.getSymbolAtLocation(source);
    let symbol = module
      ? this.checker
          .getExportsOfModule(module)
          .find((item) => item.name === name)
      : undefined;
    if (symbol && symbol.flags & ts.SymbolFlags.Alias)
      symbol = this.checker.getAliasedSymbol(symbol);
    return symbol?.declarations ?? [];
  }

  public symbol(node: ts.Node): ts.Symbol | undefined {
    if (
      node.parent &&
      ts.isShorthandPropertyAssignment(node.parent) &&
      node.parent.name === node
    )
      return this.checker.getShorthandAssignmentValueSymbol(node.parent);
    return this.checker.getSymbolAtLocation(node);
  }

  public declarations(node: ts.Node): readonly ts.Declaration[] {
    let symbol = this.symbol(node);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias)
      symbol = this.checker.getAliasedSymbol(symbol);
    return symbol?.declarations ?? [];
  }

  /** The package exporting a service token that no local code registers: the host or that package provides it. */
  public externalService(token: ts.Node): string | undefined {
    if (!ts.isIdentifier(token)) return undefined;
    const imported = this.symbol(token)?.declarations?.find(
      ts.isImportSpecifier,
    );
    if (!imported || imported.isTypeOnly) return undefined;
    const statement = imported.parent.parent.parent;
    if (
      !ts.isImportDeclaration(statement) ||
      statement.importClause?.isTypeOnly ||
      !this.isExternalImport(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier)
    )
      return undefined;
    const declaration = this.declarations(token)[0];
    if (declaration && this.services.get(declaration)?.length) return undefined;
    return statement.moduleSpecifier.text;
  }

  /** Only one locally registered implementation can prove a resolved service value. */
  public serviceFactories(
    token: ts.Node,
  ): readonly ts.Expression[] | undefined {
    const declaration = this.declarations(token)[0];
    const factories = declaration ? this.services.get(declaration) : undefined;
    return factories?.length === 1 ? factories : undefined;
  }

  public isExported(declaration: ts.Declaration): boolean {
    const statement = ts.isVariableDeclaration(declaration)
      ? declaration.parent.parent
      : declaration;
    return (
      ts.canHaveModifiers(statement) &&
      !!ts
        .getModifiers(statement)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    );
  }

  /** Resolve returned local functions and React's identity-preserving callback wrapper only. */
  public functions(
    node: ts.Node,
    seen: Set<ts.Node> = new Set<ts.Node>(),
  ): readonly ts.SignatureDeclaration[] {
    if (seen.has(node) || seen.size >= 32) return [];
    seen = new Set(seen).add(node);
    return this.values(node).flatMap((value): ts.SignatureDeclaration[] => {
      if (ts.isFunctionLike(value)) return [value];
      if (!ts.isCallExpression(value)) return [];
      const callback = (this.symbol(value.expression)?.declarations ?? []).some(
        (declaration) => {
          if (
            !ts.isImportSpecifier(declaration) ||
            declaration.isTypeOnly ||
            (declaration.propertyName?.text ?? declaration.name.text) !==
              'useCallback'
          )
            return false;
          const statement = declaration.parent.parent.parent;
          return (
            ts.isImportDeclaration(statement) &&
            !statement.importClause?.isTypeOnly &&
            ts.isStringLiteralLike(statement.moduleSpecifier) &&
            statement.moduleSpecifier.text === 'react'
          );
        },
      );
      if (callback && value.arguments[0])
        return [...this.functions(value.arguments[0], seen)];
      return this.functions(value.expression, seen).flatMap((fn) => {
        const results: ts.SignatureDeclaration[] = [];
        const visit = (child: ts.Node): void => {
          if (ts.isReturnStatement(child) && child.expression)
            results.push(...this.functions(child.expression, seen));
          else if (!ts.isFunctionLike(child)) ts.forEachChild(child, visit);
        };
        if ('body' in fn && fn.body) {
          if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body))
            results.push(...this.functions(fn.body, seen));
          else visit(fn.body);
        }
        return results;
      });
    });
  }

  /** A const binding is insufficient when its object or function escapes or is written through. */
  public immutable(
    declaration: ts.VariableDeclaration,
    allowArgument: (call: ts.CallExpression) => boolean = () => false,
  ): boolean {
    if (
      !ts.isIdentifier(declaration.name) ||
      !ts.isVariableDeclarationList(declaration.parent) ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      (ts.isVariableStatement(declaration.parent.parent) &&
        !!ts
          .getModifiers(declaration.parent.parent)
          ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
    )
      return false;
    const symbol = this.symbol(declaration.name);
    let valid = true;
    let visits = 0;
    const visit = (node: ts.Node): void => {
      if (++visits > 100_000) valid = false;
      if (!valid || ts.isTypeNode(node)) return;
      if (
        ts.isIdentifier(node) &&
        node !== declaration.name &&
        this.symbol(node) === symbol
      ) {
        let owner: ts.Node = node;
        const transparent = (
          node: ts.Node,
        ): node is
          | ts.ParenthesizedExpression
          | ts.AsExpression
          | ts.SatisfiesExpression
          | ts.TypeAssertion
          | ts.NonNullExpression =>
          ts.isParenthesizedExpression(node) ||
          ts.isAsExpression(node) ||
          ts.isSatisfiesExpression(node) ||
          ts.isTypeAssertionExpression(node) ||
          ts.isNonNullExpression(node);
        for (;;) {
          const parent = owner.parent;
          if (
            (ts.isPropertyAccessExpression(parent) ||
              ts.isElementAccessExpression(parent) ||
              transparent(parent)) &&
            parent.expression === owner
          )
            owner = parent;
          else if (
            ts.isConditionalExpression(parent) &&
            (parent.whenTrue === owner || parent.whenFalse === owner)
          )
            owner = parent;
          else break;
        }
        const parent = owner.parent;
        if (ts.isCallExpression(parent)) {
          const initializer = declaration.initializer;
          valid =
            allowArgument(parent) ||
            (parent.expression === owner &&
              owner === node &&
              !!initializer &&
              (ts.isArrowFunction(initializer) ||
                ts.isFunctionExpression(initializer)));
        } else if (
          ts.isShorthandPropertyAssignment(parent) ||
          ts.isPropertyAssignment(parent) ||
          ts.isSpreadAssignment(parent) ||
          ts.isSpreadElement(parent) ||
          ts.isArrayLiteralExpression(parent)
        ) {
          let context: ts.Node = parent;
          while (
            ts.isShorthandPropertyAssignment(context.parent) ||
            ts.isPropertyAssignment(context.parent) ||
            ts.isSpreadAssignment(context.parent) ||
            ts.isSpreadElement(context.parent) ||
            ts.isArrayLiteralExpression(context.parent) ||
            ts.isObjectLiteralExpression(context.parent) ||
            transparent(context.parent)
          )
            context = context.parent;
          valid =
            ts.isCallExpression(context.parent) &&
            allowArgument(context.parent);
        } else if (!(
          ts.isConditionalExpression(parent) && parent.condition === owner
        )) {
          // Every other use can escape or modify the value, including expression-bodied
          // closures and assignment RHSs. Unknown contexts cannot establish immutability.
          valid = false;
        }
      }
      ts.forEachChild(node, visit);
    };
    // An unexported lexical binding cannot be referenced outside its own module. Export aliases are rejected above.
    visit(declaration.getSourceFile());
    return valid;
  }

  /** Resolve local value aliases and re-exports without executing a module. */
  public values(
    node: ts.Node,
    seen: Set<ts.Node> = new Set<ts.Node>(),
  ): readonly ts.Node[] {
    if (seen.has(node)) return [];
    seen.add(node);
    if (ts.isIdentifier(node))
      return this.declarations(node).flatMap((item) => this.values(item, seen));
    if (ts.isVariableDeclaration(node))
      return node.initializer ? this.values(node.initializer, seen) : [];
    if (ts.isExportAssignment(node)) return this.values(node.expression, seen);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return this.values(node.expression, seen);
    return [node];
  }

  private serviceMethod(
    receiver: ts.Expression,
    method: string,
    bindings: ReadonlyMap<ts.Declaration, readonly ts.Node[]>,
  ): readonly ts.Node[] {
    const roots: ts.Node[] = [];
    for (const value of new StaticValues(
      this,
      bindings,
      undefined,
      undefined,
      false,
    ).values(receiver)) {
      if (
        !ts.isCallExpression(value) ||
        !ts.isPropertyAccessExpression(value.expression) ||
        value.expression.name.text !== 'resolve'
      )
        continue;
      const token = value.arguments[0];
      const declaration = token && this.declarations(token)[0];
      const factories = declaration
        ? (this.services.get(declaration) ?? [])
        : [];
      // Competing registrations cannot establish which implementation this runtime selected.
      if (factories.length !== 1) continue;
      for (const factory of factories) {
        const find = (node: ts.Node): void => {
          if (ts.isNewExpression(node)) {
            for (const candidate of this.values(node.expression)) {
              if (
                !ts.isClassDeclaration(candidate) &&
                !ts.isClassExpression(candidate)
              )
                continue;
              roots.push(node);
              roots.push(candidate);
              for (const member of candidate.members)
                if (
                  ts.isMethodDeclaration(member) &&
                  member.name &&
                  member.name.getText() === method
                )
                  roots.push(member);
            }
          }
          ts.forEachChild(node, find);
        };
        this.values(factory).forEach(find);
      }
    }
    return roots;
  }
}
