import ts from 'typescript';

export interface EvidenceSource {
  readonly file: string;
  readonly ast: ts.SourceFile;
}

/** Package-local value reachability. The host never loads dependencies, libraries or application code. */
export class SourceEvidence {
  private readonly checker: ts.TypeChecker;
  private readonly sources: Map<string, EvidenceSource>;
  private readonly services = new Map<ts.Declaration, ts.Expression[]>();

  public constructor(
    sources: readonly EvidenceSource[],
    private readonly resolutions: ReadonlyMap<string, string>,
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
        if (declaration && factory)
          this.services.set(declaration, [
            ...(this.services.get(declaration) ?? []),
            factory,
          ]);
      }
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
  ): {
    references: Set<string>;
    nodes: Map<string, Set<ts.Node>>;
    complete: boolean;
  } {
    const references = new Set<string>();
    const nodes = new Map<string, Set<ts.Node>>();
    const visited = new Set<ts.Node>();
    const symbols = new Set<ts.Symbol>();
    let complete = true;
    const exported = (target: string, name: string): void => {
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
      follow(value);
    };
    const imported = (declaration: ts.Node, name?: string): boolean => {
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
        if (/^[.#/]/.test(specifier)) complete = false;
        else references.add(specifier);
      } else if (name) exported(target, name);
      else complete = false;
      return true;
    };
    const follow = (symbol: ts.Symbol): void => {
      if (symbols.has(symbol)) return;
      symbols.add(symbol);
      for (const declaration of symbol.declarations ?? []) {
        if (
          ts.isImportSpecifier(declaration) ||
          ts.isExportSpecifier(declaration)
        ) {
          if (declaration.isTypeOnly) continue;
          if (
            imported(
              declaration,
              declaration.propertyName?.text ?? declaration.name.text,
            )
          )
            continue;
          if (symbol.flags & ts.SymbolFlags.Alias)
            follow(this.checker.getAliasedSymbol(symbol));
        } else if (ts.isImportClause(declaration)) {
          if (!declaration.isTypeOnly) imported(declaration, 'default');
        } else if (ts.isNamespaceImport(declaration)) {
          imported(declaration);
        } else if (this.sources.has(declaration.getSourceFile().fileName)) {
          visit(declaration);
        }
      }
    };
    const visit = (node: ts.Node): void => {
      if (visited.has(node) || ts.isTypeNode(node)) return;
      visited.add(node);
      const sourceFile = node.getSourceFile();
      const selected = nodes.get(sourceFile.fileName) ?? new Set<ts.Node>();
      selected.add(node);
      nodes.set(sourceFile.fileName, selected);
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
      if (
        ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isPropertyDeclaration(node)
      ) {
        if (node.initializer) visit(node.initializer);
        return;
      }
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
        // Referring to a class does not mean all its methods are used.
        for (const member of node.members)
          if (
            ts.isConstructorDeclaration(member) ||
            ts.isPropertyDeclaration(member)
          )
            visit(member);
        return;
      }
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression)
      ) {
        for (const root of this.serviceMethod(node.expression, node.name.text))
          visit(root);
        const receiver = this.checker.getSymbolAtLocation(node.expression);
        const namespace = receiver?.declarations?.find(ts.isNamespaceImport);
        if (namespace) {
          imported(namespace, node.name.text);
          return;
        }
      }
      if (ts.isIdentifier(node)) {
        const symbol = this.symbol(node);
        if (symbol) follow(symbol);
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
          if (target) exported(target, 'default');
          else if (/^[.#/]/.test(argument.text)) complete = false;
          else references.add(argument.text);
        } else complete = false;
      }
      ts.forEachChild(node, (child) => {
        // A nested helper declaration is not a call. Follow it only when a value reference reaches it.
        if (!ts.isFunctionDeclaration(child)) visit(child);
      });
    };
    if (roots) roots.forEach(visit);
    else exported(file, 'default');
    return { references, nodes, complete };
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
      ts.isSatisfiesExpression(node)
    )
      return this.values(node.expression, seen);
    return [node];
  }

  private serviceMethod(
    receiver: ts.Expression,
    method: string,
  ): readonly ts.Node[] {
    const roots: ts.Node[] = [];
    for (const value of this.values(receiver)) {
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
