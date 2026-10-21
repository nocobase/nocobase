import ts from 'typescript';

export interface EvidenceSource {
  readonly file: string;
  readonly ast: ts.SourceFile;
}

/** Package-local value reachability. The host never loads dependencies, libraries or application code. */
export class SourceEvidence {
  private readonly checker: ts.TypeChecker;
  private readonly sources: Map<string, EvidenceSource>;

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
        const receiver = this.checker.getSymbolAtLocation(node.expression);
        const namespace = receiver?.declarations?.find(ts.isNamespaceImport);
        if (namespace) {
          imported(namespace, node.name.text);
          return;
        }
      }
      if (ts.isIdentifier(node)) {
        const symbol = this.checker.getSymbolAtLocation(node);
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
    return this.checker.getSymbolAtLocation(node);
  }
}
