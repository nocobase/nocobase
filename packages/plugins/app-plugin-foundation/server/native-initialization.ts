import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';
import { importedContract } from './api-contracts.js';

interface Resolve {
  values(node: ts.Node): readonly ts.Node[];
}

/** One owned, inline SHA-256 initialization. No application or native code is executed. */
export class NativeInitialization {
  private intact: boolean | undefined;
  private readonly unchanged = new WeakMap<ts.ParameterDeclaration, boolean>();
  private readonly cryptoFiles = new WeakMap<ts.SourceFile, boolean>();
  private readonly immediateCalls = new WeakMap<ts.Node, boolean>();
  public constructor(
    private readonly analysis: SourceEvidence,
    private readonly sources: readonly ts.SourceFile[],
  ) {}

  private imported(node: ts.Node, name: string): boolean {
    return (
      this.analysis.symbol(node)?.declarations?.length === 1 &&
      importedContract(node, this.analysis, 'node:crypto', name)
    );
  }

  private call(
    node: ts.Node,
    name: string,
    arity: number,
  ): node is ts.CallExpression {
    return (
      ts.isCallExpression(node) &&
      !node.questionDotToken &&
      node.arguments.length === arity &&
      !node.arguments.some(ts.isSpreadElement) &&
      this.imported(node.expression, name)
    );
  }

  private method(
    node: ts.Node,
    name: string,
    arity: number,
  ): node is ts.CallExpression & { expression: ts.PropertyAccessExpression } {
    return (
      ts.isCallExpression(node) &&
      !node.questionDotToken &&
      node.arguments.length === arity &&
      !node.arguments.some(ts.isSpreadElement) &&
      ts.isPropertyAccessExpression(node.expression) &&
      !node.expression.questionDotToken &&
      node.expression.name.text === name
    );
  }

  // Every reference to these import bindings must remain a direct call. Namespace/default imports,
  // re-exports and Hmac prototype access make the intrinsic identity unprovable across the graph.
  private importsIntact(): boolean {
    if (this.intact !== undefined) return this.intact;
    const functions = new Set<ts.Symbol>();
    const hmac = new Set<ts.Symbol>();
    const names = new Set<string>();
    let intact = true;
    let visits = 0;
    for (const source of this.sources)
      for (const statement of source.statements) {
        if (
          (ts.isImportDeclaration(statement) ||
            ts.isExportDeclaration(statement)) &&
          statement.moduleSpecifier &&
          ts.isStringLiteralLike(statement.moduleSpecifier) &&
          ['node:crypto', 'crypto'].includes(statement.moduleSpecifier.text)
        ) {
          if (
            !ts.isImportDeclaration(statement) ||
            !statement.importClause ||
            statement.importClause.name ||
            !statement.importClause.namedBindings ||
            !ts.isNamedImports(statement.importClause.namedBindings)
          ) {
            intact = false;
            continue;
          }
          for (const specifier of statement.importClause.namedBindings
            .elements) {
            if (specifier.isTypeOnly || statement.importClause.isTypeOnly)
              continue;
            const name = specifier.propertyName?.text ?? specifier.name.text;
            if (name === 'Hmac') intact = false;
            if (['createHmac', 'randomBytes'].includes(name)) {
              const symbol = this.analysis.symbol(specifier.name);
              if (symbol) {
                functions.add(symbol);
                if (name === 'createHmac') hmac.add(symbol);
                names.add(specifier.name.text);
              }
            }
          }
        }
      }
    const visit = (node: ts.Node): void => {
      if (++visits > 1_000_000) intact = false;
      if (!intact || ts.isTypeNode(node)) return;
      if (
        ts.isCallExpression(node) &&
        node.arguments.some(
          (argument) =>
            ts.isStringLiteralLike(argument) &&
            ['node:crypto', 'crypto'].includes(argument.text),
        ) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === 'require'))
      ) {
        intact = false;
        return;
      }
      if (
        ts.isIdentifier(node) &&
        names.has(node.text) &&
        functions.has(this.analysis.symbol(node)!)
      ) {
        const parent = node.parent;
        if (
          !ts.isImportSpecifier(parent) &&
          hmac.has(this.analysis.symbol(node)!) &&
          (!ts.isCallExpression(parent) || !this.ownedHmac(parent))
        )
          intact = false;
        if (!(
          ts.isImportSpecifier(parent) ||
          (ts.isCallExpression(parent) &&
            parent.expression === node &&
            !parent.questionDotToken)
        ))
          intact = false;
      }
      ts.forEachChild(node, visit);
    };
    for (const source of this.sources) visit(source);
    this.intact = intact;
    return intact;
  }

  // This establishes ownership only, never continuation for other crypto call shapes.
  private ownedHmac(node: ts.CallExpression): boolean {
    let value: ts.Node = node;
    for (let depth = 0; depth < 32; depth++) {
      const property = value.parent;
      const call = property?.parent;
      if (
        !property ||
        !ts.isPropertyAccessExpression(property) ||
        property.expression !== value ||
        property.questionDotToken ||
        !call ||
        !ts.isCallExpression(call) ||
        call.expression !== property ||
        call.questionDotToken ||
        call.arguments.some(ts.isSpreadElement)
      )
        return false;
      if (property.name.text === 'digest') return call.arguments.length <= 1;
      if (
        property.name.text !== 'update' ||
        call.arguments.length < 1 ||
        call.arguments.length > 2
      )
        return false;
      value = call;
    }
    return false;
  }

  private undefined(node: ts.Node): boolean {
    return (
      ts.isIdentifier(node) &&
      node.text === 'undefined' &&
      !this.analysis.declarations(node).length
    );
  }

  private guard(node: ts.Node): ts.ParameterDeclaration | undefined {
    if (
      !ts.isBinaryExpression(node) ||
      node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken
    )
      return undefined;
    const { left, right } = node;
    if (
      !ts.isBinaryExpression(left) ||
      left.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      !this.undefined(left.right) ||
      !ts.isIdentifier(left.left) ||
      !ts.isBinaryExpression(right) ||
      right.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      !ts.isTypeOfExpression(right.left) ||
      !ts.isIdentifier(right.left.expression) ||
      !ts.isStringLiteralLike(right.right) ||
      right.right.text !== 'string'
    )
      return undefined;
    const symbol = this.analysis.symbol(left.left);
    if (!symbol || this.analysis.symbol(right.left.expression) !== symbol)
      return undefined;
    const declarations = this.analysis.declarations(left.left);
    const parameter = declarations.length === 1 ? declarations[0] : undefined;
    return parameter &&
      ts.isParameter(parameter) &&
      ts.isIdentifier(parameter.name) &&
      !parameter.dotDotDotToken &&
      !parameter.initializer
      ? parameter
      : undefined;
  }

  private parameterUnchanged(parameter: ts.ParameterDeclaration): boolean {
    const known = this.unchanged.get(parameter);
    if (known !== undefined) return known;
    const symbol = this.analysis.symbol(parameter.name);
    let valid = true;
    let visits = 0;
    const references = (node: ts.Node): boolean => {
      if (ts.isIdentifier(node) && this.analysis.symbol(node) === symbol)
        return true;
      return ts.forEachChild(node, references) === true;
    };
    const visit = (node: ts.Node): void => {
      if (++visits > 100_000) valid = false;
      if (!valid || ts.isTypeNode(node)) return;
      if (
        (ts.isBinaryExpression(node) &&
          node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
          references(node.left)) ||
        ((ts.isPrefixUnaryExpression(node) ||
          ts.isPostfixUnaryExpression(node)) &&
          [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
            node.operator,
          ) &&
          references(node.operand)) ||
        (ts.isIdentifier(node) && ['arguments', 'eval'].includes(node.text))
      ) {
        valid = false;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(parameter.parent);
    this.unchanged.set(parameter, valid);
    return valid;
  }

  /** Composite expressions do not silently hide unsupported native initialization. */
  public containsCall(node: ts.Node): boolean {
    const known = this.immediateCalls.get(node);
    if (known !== undefined) return known;
    const source = node.getSourceFile();
    let crypto = this.cryptoFiles.get(source);
    if (crypto === undefined) {
      crypto = source.statements.some(
        (statement) =>
          ts.isImportDeclaration(statement) &&
          ts.isStringLiteralLike(statement.moduleSpecifier) &&
          statement.moduleSpecifier.text === 'node:crypto',
      );
      this.cryptoFiles.set(source, crypto);
    }
    if (!crypto) {
      this.immediateCalls.set(node, false);
      return false;
    }
    let found = false;
    let visits = 0;
    const visit = (child: ts.Node): void => {
      if (++visits > 100_000) found = true;
      if (found || ts.isFunctionLike(child) || ts.isTypeNode(child)) return;
      if (
        ts.isCallExpression(child) &&
        (this.imported(child.expression, 'createHmac') ||
          this.imported(child.expression, 'randomBytes'))
      ) {
        found = true;
        return;
      }
      ts.forEachChild(child, visit);
    };
    visit(node);
    this.immediateCalls.set(node, found);
    return found;
  }

  /** A known invalid input takes the throwing arm; an unknown input still needs the dominating guard. */
  public guardCondition(node: ts.Node, resolve: Resolve): boolean | undefined {
    const parameter = this.guard(node);
    if (!parameter || !this.parameterUnchanged(parameter)) return undefined;
    const values = resolve.values(parameter);
    if (!values.length) return undefined;
    const invalid = values.map((value) => {
      if (this.undefined(value) || ts.isStringLiteralLike(value)) return false;
      if (
        ts.isNumericLiteral(value) ||
        ts.isBigIntLiteral(value) ||
        ts.isPrefixUnaryExpression(value) ||
        ts.isPostfixUnaryExpression(value) ||
        (ts.isIdentifier(value) &&
          ['NaN', 'Infinity'].includes(value.text) &&
          !this.analysis.declarations(value).length) ||
        ts.isObjectLiteralExpression(value) ||
        ts.isArrayLiteralExpression(value) ||
        ts.isNewExpression(value) ||
        ts.isFunctionLike(value) ||
        ts.isClassLike(value) ||
        ts.isRegularExpressionLiteral(value) ||
        [
          ts.SyntaxKind.TrueKeyword,
          ts.SyntaxKind.FalseKeyword,
          ts.SyntaxKind.NullKeyword,
        ].includes(value.kind)
      )
        return true;
      return undefined;
    });
    return invalid.every((value) => value === true)
      ? true
      : invalid.every((value) => value === false)
        ? false
        : undefined;
  }

  public accepts(node: ts.CallExpression, resolve: Resolve): boolean {
    if (!this.method(node, 'digest', 0)) return false;
    const update = node.expression.expression;
    if (
      !this.method(update, 'update', 1) ||
      !ts.isStringLiteralLike(update.arguments[0])
    )
      return false;
    const create = update.expression.expression;
    if (
      !this.call(create, 'createHmac', 2) ||
      !ts.isStringLiteralLike(create.arguments[0]) ||
      create.arguments[0].text !== 'sha256'
    )
      return false;
    const key = create.arguments[1];
    if (
      !ts.isBinaryExpression(key) ||
      key.operatorToken.kind !== ts.SyntaxKind.BarBarToken ||
      !ts.isIdentifier(key.left) ||
      !this.call(key.right, 'randomBytes', 1) ||
      !ts.isNumericLiteral(key.right.arguments[0]) ||
      key.right.arguments[0].text !== '32'
    )
      return false;
    // The HMAC and random Buffer never acquire an application-visible alias. Only the finished
    // Buffer is bound, and it can only supply a later local signing closure's native key.
    const declaration = node.parent;
    if (
      !ts.isVariableDeclaration(declaration) ||
      declaration.initializer !== node ||
      !ts.isIdentifier(declaration.name) ||
      !ts.isVariableDeclarationList(declaration.parent) ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      declaration.parent.declarations.length !== 1 ||
      !ts.isVariableStatement(declaration.parent.parent)
    )
      return false;
    const statement = declaration.parent.parent;
    const block = statement.parent;
    if (
      !ts.isBlock(block) ||
      !ts.isFunctionLike(block.parent) ||
      !('body' in block.parent) ||
      block.parent.body !== block
    )
      return false;
    const index = block.statements.indexOf(statement);
    const guard = index > 0 ? block.statements[index - 1] : undefined;
    if (!guard || !ts.isIfStatement(guard) || guard.elseStatement) return false;
    const parameter = this.guard(guard.expression);
    if (
      !parameter ||
      parameter.parent !== block.parent ||
      this.analysis.symbol(key.left) !== this.analysis.symbol(parameter.name) ||
      this.guardCondition(guard.expression, resolve) === true
    )
      return false;
    const body =
      ts.isBlock(guard.thenStatement) &&
      guard.thenStatement.statements.length === 1
        ? guard.thenStatement.statements[0]
        : guard.thenStatement;
    if (
      !ts.isThrowStatement(body) ||
      !body.expression ||
      !ts.isNewExpression(body.expression) ||
      !ts.isIdentifier(body.expression.expression) ||
      body.expression.expression.text !== 'TypeError' ||
      this.analysis.declarations(body.expression.expression).length ||
      body.expression.arguments?.length !== 1 ||
      !ts.isStringLiteralLike(body.expression.arguments[0])
    )
      return false;
    // No other immediate work is hidden behind the recognized initialization. The remaining
    // declarations create deferred functions, and the final object only exposes those functions.
    if (index !== 1) return false;
    const tail = block.statements.slice(index + 1);
    const returned = tail.at(-1);
    if (
      !returned ||
      !ts.isReturnStatement(returned) ||
      !returned.expression ||
      !ts.isObjectLiteralExpression(returned.expression)
    )
      return false;
    const functions = new Set<ts.Symbol>();
    for (const step of tail.slice(0, -1)) {
      if (ts.isFunctionDeclaration(step) && step.name) {
        const symbol = this.analysis.symbol(step.name);
        if (symbol) functions.add(symbol);
        continue;
      }
      if (
        !ts.isVariableStatement(step) ||
        !(step.declarationList.flags & ts.NodeFlags.Const)
      )
        return false;
      for (const local of step.declarationList.declarations) {
        if (
          !ts.isIdentifier(local.name) ||
          !local.initializer ||
          !(
            ts.isArrowFunction(local.initializer) ||
            ts.isFunctionExpression(local.initializer)
          )
        )
          return false;
        const symbol = this.analysis.symbol(local.name);
        if (symbol) functions.add(symbol);
      }
    }
    for (const property of returned.expression.properties) {
      if (
        !property.name ||
        !(
          ts.isIdentifier(property.name) ||
          ts.isStringLiteralLike(property.name)
        )
      )
        return false;
      if (ts.isMethodDeclaration(property)) continue;
      const value = ts.isShorthandPropertyAssignment(property)
        ? property.name
        : ts.isPropertyAssignment(property)
          ? property.initializer
          : undefined;
      if (
        !value ||
        !(
          ts.isArrowFunction(value) ||
          ts.isFunctionExpression(value) ||
          (ts.isIdentifier(value) &&
            functions.has(this.analysis.symbol(value)!))
        )
      )
        return false;
    }
    const input = this.analysis.symbol(parameter.name),
      output = this.analysis.symbol(declaration.name);
    if (!input || !output) return false;
    let local = true;
    let visits = 0;
    const within = (value: ts.Node, owner: ts.Node): boolean => {
      for (
        let current: ts.Node | undefined = value;
        current;
        current = current.parent
      )
        if (current === owner) return true;
      return false;
    };
    const visit = (value: ts.Node): void => {
      if (++visits > 100_000) local = false;
      if (!local || ts.isTypeNode(value)) return;
      if (ts.isIdentifier(value)) {
        const symbol = this.analysis.symbol(value);
        if (
          symbol === input &&
          value !== parameter.name &&
          value !== key.left &&
          !within(value, guard.expression)
        )
          local = false;
        if (symbol === output && value !== declaration.name) {
          const call = value.parent;
          if (
            !this.call(call, 'createHmac', 2) ||
            call.arguments[1] !== value ||
            !ts.isStringLiteralLike(call.arguments[0]) ||
            call.arguments[0].text !== 'sha256'
          )
            local = false;
          // This signing use is deferred, rather than another step during initialization.
          let owner: ts.Node | undefined = call;
          while (owner && owner !== block && !ts.isFunctionLike(owner))
            owner = owner.parent;
          if (!owner || owner === block || !ts.isFunctionLike(owner))
            local = false;
        }
      }
      ts.forEachChild(value, visit);
    };
    visit(block);
    return local && this.importsIntact();
  }
}
