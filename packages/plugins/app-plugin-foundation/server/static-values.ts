import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';

type Atom = string | number | boolean | null;
type Bindings = ReadonlyMap<ts.Declaration, readonly ts.Node[]>;
interface Invocation {
  readonly fn: ts.SignatureDeclaration;
  readonly bindings: Bindings;
}
interface Flow {
  readonly values: readonly ts.Node[];
  readonly continues: boolean;
  readonly returns: boolean;
  readonly throws: boolean;
  readonly unknown: boolean;
}
const MAX_VALUES = 32;
const MAX_CALL_DEPTH = 32;

/** Resolves bounded local values and returns without loading or executing application code. */
export class StaticValues {
  // Bindings of the invocation that produced a returned function or object literal, keyed by that node.
  private readonly captures: Map<ts.Node, Bindings>;
  private readonly activeCalls: Set<ts.CallExpression>;

  public constructor(
    private readonly analysis: SourceEvidence,
    private readonly bindings: Bindings = new Map(),
    captures?: Map<ts.Node, Bindings>,
    activeCalls?: Set<ts.CallExpression>,
    private readonly expandServices = true,
    private readonly awaitReturns = false,
  ) {
    this.captures = captures ?? new Map<ts.Node, Bindings>();
    this.activeCalls = activeCalls ?? new Set();
  }

  public values(
    node: ts.Node,
    seen: Set<ts.Node> = new Set(),
  ): readonly ts.Node[] {
    if (seen.has(node) || seen.size >= MAX_VALUES) return [];
    seen = new Set(seen).add(node);
    const next = (value: ts.Node): readonly ts.Node[] =>
      this.values(value, seen);
    if (node.kind === ts.SyntaxKind.ThisKeyword) {
      let owner: ts.Node | undefined = node.parent;
      while (owner && !ts.isClassLike(owner)) owner = owner.parent;
      return owner && ts.isClassLike(owner)
        ? (this.bindings.get(owner) ?? [])
        : [];
    }
    if (ts.isExportAssignment(node)) return next(node.expression);
    if (ts.isIdentifier(node))
      return this.analysis
        .declarations(node)
        .flatMap(next)
        .slice(0, MAX_VALUES);
    if (ts.isParameter(node))
      return (
        this.bindings.get(node) ?? (node.initializer ? [node.initializer] : [])
      )
        .flatMap(next)
        .slice(0, MAX_VALUES);
    if (ts.isBindingElement(node)) {
      const owner = node.parent.parent;
      const containers = ts.isParameter(owner)
        ? this.values(owner, seen)
        : ts.isVariableDeclaration(owner) && owner.initializer
          ? this.values(owner.initializer, seen)
          : [];
      if (
        ts.isParameter(owner) &&
        this.bindings.has(owner) &&
        !containers.length
      )
        return [];
      if (containers.some((value) => this.hasSpread(value))) return [];
      if (ts.isArrayBindingPattern(node.parent)) {
        const index = node.parent.elements.indexOf(node);
        return containers.flatMap((value) =>
          ts.isArrayLiteralExpression(value) &&
          !value.elements.some(ts.isSpreadElement) &&
          value.elements[index] &&
          !node.dotDotDotToken
            ? next(value.elements[index])
            : [],
        );
      }
      const name = node.propertyName ?? node.name;
      const found =
        ts.isIdentifier(name) || ts.isStringLiteralLike(name)
          ? containers.flatMap((value) => this.property(value, name.text, seen))
          : [];
      const declared =
        (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) &&
        containers.some((value) =>
          ts.isObjectLiteralExpression(value)
            ? value.properties.some(
                (entry) =>
                  entry.name &&
                  (ts.isIdentifier(entry.name) ||
                    ts.isStringLiteralLike(entry.name)) &&
                  entry.name.text === name.text,
              )
            : ts.isJsxAttributes(value) &&
              value.properties.some(
                (entry) =>
                  ts.isJsxAttribute(entry) &&
                  entry.name.getText() === name.text,
              ),
        );
      return found.length || declared
        ? found
        : node.initializer
          ? next(node.initializer)
          : [];
    }
    if (ts.isVariableDeclaration(node)) {
      const bound = this.bindings.get(node);
      if (bound) return bound.flatMap(next).slice(0, MAX_VALUES);
      if (node.initializer) return next(node.initializer);
      const loop = node.parent.parent;
      if (ts.isForOfStatement(loop))
        return this.values(loop.expression, seen)
          .flatMap((value) =>
            ts.isArrayLiteralExpression(value)
              ? value.elements.flatMap(next)
              : [],
          )
          .slice(0, MAX_VALUES);
      return [];
    }
    if (ts.isAwaitExpression(node)) {
      const target = this.expressionCall(node.expression);
      if (!target) return next(node.expression);
      const flow = this.callFlow(target.call, new Set(seen), 0, true);
      return flow.unknown ? [] : flow.values;
    }
    if (ts.isCallExpression(node)) {
      if (this.activeCalls.has(node) || this.activeCalls.size >= MAX_CALL_DEPTH)
        return [];
      const nested = new Set(this.activeCalls).add(node);
      const evaluator = new StaticValues(
        this.analysis,
        this.bindings,
        this.captures,
        nested,
        this.expandServices,
        this.awaitReturns,
      );
      const service = this.expandServices
        ? evaluator.serviceValues(node)
        : undefined;
      if (service) return service;
      const invocations = evaluator.invocations(node);
      if (!invocations.length) return [node];
      return invocations
        .flatMap((invocation) =>
          ts
            .getModifiers(invocation.fn as ts.FunctionLikeDeclaration)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
            ? []
            : evaluator.invoke(invocation, new Set(), this.activeCalls.size),
        )
        .slice(0, MAX_VALUES);
    }
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return next(node.expression);
    if (ts.isConditionalExpression(node))
      return this.atoms(node.condition, seen)
        .flatMap((value) => next(value ? node.whenTrue : node.whenFalse))
        .slice(0, MAX_VALUES);
    if (ts.isPropertyAccessExpression(node))
      return this.values(node.expression, seen)
        .flatMap((value) => this.property(value, node.name.text, seen))
        .slice(0, MAX_VALUES);
    if (ts.isElementAccessExpression(node)) {
      const key = node.argumentExpression;
      const names = key ? this.strings(key) : [];
      const indices = key
        ? this.atoms(key, seen).filter(
            (value): value is number =>
              typeof value === 'number' &&
              Number.isInteger(value) &&
              value >= 0 &&
              value < MAX_VALUES,
          )
        : [];
      if (!names.length && !indices.length) return [];
      return this.values(node.expression, seen)
        .flatMap((value) => [
          ...names.flatMap((name) => this.property(value, name, seen)),
          ...(ts.isArrayLiteralExpression(value) &&
          !value.elements.some(ts.isSpreadElement)
            ? indices.flatMap((index) =>
                value.elements[index]
                  ? this.values(value.elements[index], seen)
                  : [],
              )
            : []),
        ])
        .slice(0, MAX_VALUES);
    }
    return [node];
  }

  /** Local calls are interpreted only through bounded arguments and explicit return paths. */
  public invocations(node: ts.CallExpression): readonly Invocation[] {
    const functions = new Set<ts.SignatureDeclaration>([
      ...this.analysis.functions(node.expression),
      ...this.values(node.expression).filter(ts.isFunctionLike),
    ]);
    const result: Invocation[] = [];
    for (const fn of functions) {
      if (!('body' in fn) || !fn.body) continue;
      const captured =
        this.captures.get(fn) ?? new Map<ts.Declaration, readonly ts.Node[]>();
      const bindings = new Map(captured);
      for (const [declaration, values] of this.bindings)
        bindings.set(declaration, values);
      fn.parameters.forEach((parameter, index) => {
        const argument = node.arguments[index] ?? parameter.initializer;
        bindings.set(parameter, argument ? [argument] : []);
      });
      if (
        node.arguments.some(ts.isSpreadElement) ||
        fn.parameters.some((parameter) => parameter.dotDotDotToken)
      )
        continue;
      result.push({ fn, bindings });
      if (result.length >= MAX_VALUES) break;
    }
    return result;
  }

  private serviceValues(
    node: ts.CallExpression,
  ): readonly ts.Node[] | undefined {
    if (
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.name.text !== 'resolve' ||
      node.arguments.length !== 1 ||
      node.questionDotToken ||
      node.expression.questionDotToken
    )
      return undefined;
    const factories = this.analysis.serviceFactories(node.arguments[0]);
    // Another package's service stays this opaque `resolve(token)` value; competing local registrations are unknown.
    if (!factories)
      return this.analysis.externalService(node.arguments[0]) ? [node] : [];
    const factory = factories[0];
    const summary = this.analysis.serviceSummary(factory, (receiver) => {
      const scopes = new Map<ts.Node, Bindings>();
      const evaluator = new StaticValues(this.analysis, new Map(), scopes);
      const result: ts.Node[] = [];
      for (const value of evaluator.values(factory)) {
        if (ts.isFunctionLike(value) && 'body' in value && value.body) {
          if (
            ts
              .getModifiers(value)
              ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
          )
            continue;
          const bindings = new Map<ts.Declaration, readonly ts.Node[]>();
          if (value.parameters[0])
            bindings.set(value.parameters[0], receiver ? [receiver] : []);
          result.push(
            ...evaluator.invoke({ fn: value, bindings }, new Set(), 0),
          );
        } else result.push(value);
      }
      return { values: result.slice(0, MAX_VALUES), scopes };
    });
    for (const [value, scope] of summary.scopes) {
      const imported = new Map(scope);
      for (const [declaration, values] of this.captures.get(value) ?? []) {
        const current = imported.get(declaration);
        imported.set(
          declaration,
          current &&
            (current.length !== values.length ||
              current.some((item, index) => item !== values[index]))
            ? []
            : values,
        );
      }
      this.captures.set(value, imported);
    }
    return summary.values;
  }

  private invoke(
    invocation: Invocation,
    seen: ReadonlySet<ts.Node>,
    depth: number,
  ): readonly ts.Node[] {
    if (depth >= MAX_CALL_DEPTH || !('body' in invocation.fn)) return [];
    const body = invocation.fn.body;
    if (!body) return [];
    const evaluator = new StaticValues(
      this.analysis,
      invocation.bindings,
      this.captures,
      this.activeCalls,
      this.expandServices,
      this.awaitReturns,
    );
    const flow = evaluator.flow(body, seen, depth + 1);
    if (flow.unknown) return [];
    for (const value of flow.values)
      evaluator.capture(value, invocation.bindings);
    return [...new Set(flow.values)].slice(0, MAX_VALUES);
  }

  /** A statement is terminal only when every bounded local path returns or throws. */
  public definitelyTerminates(node: ts.Node): boolean {
    const flow = this.flow(node, new Set(), 0);
    return !flow.continues && (flow.returns || flow.throws);
  }

  /**
   * `awaited` is whether the caller waits for the result. An async function's throw only rejects its promise, so an
   * async target that is not awaited lets the caller continue; a synchronous target throws either way.
   */
  private callFlow(
    node: ts.CallExpression,
    seen: ReadonlySet<ts.Node>,
    depth: number,
    awaited = false,
  ): Flow {
    if (
      depth >= MAX_CALL_DEPTH ||
      this.activeCalls.has(node) ||
      this.activeCalls.size >= MAX_CALL_DEPTH
    )
      return {
        values: [],
        continues: true,
        returns: false,
        throws: false,
        unknown: true,
      };
    const activeCalls = new Set(this.activeCalls).add(node);
    const evaluator = new StaticValues(
      this.analysis,
      this.bindings,
      this.captures,
      activeCalls,
      this.expandServices,
      this.awaitReturns,
    );
    const service = this.expandServices
      ? evaluator.serviceValues(node)
      : undefined;
    if (service !== undefined)
      return {
        values: service,
        continues: service.length > 0,
        returns: false,
        throws: false,
        unknown: service.length === 0,
      };
    const invocations = evaluator.invocations(node);
    if (!invocations.length)
      return {
        values: [],
        continues: true,
        returns: false,
        throws: false,
        unknown: true,
      };
    const values: ts.Node[] = [];
    let continues = false;
    let throws = false;
    let unknown = false;
    for (const invocation of invocations) {
      const body = 'body' in invocation.fn ? invocation.fn.body : undefined;
      if (!body) {
        continues = true;
        unknown = true;
        continue;
      }
      if ('asteriskToken' in invocation.fn && invocation.fn.asteriskToken) {
        // A generator runs nothing until iterated; its body says nothing about this call.
        continues = true;
        continue;
      }
      const isAsync = !!ts
        .getModifiers(invocation.fn as ts.FunctionLikeDeclaration)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);
      const flow = new StaticValues(
        this.analysis,
        invocation.bindings,
        this.captures,
        activeCalls,
        this.expandServices,
        awaited,
      ).flow(body, new Set(seen), depth + 1);
      if (!isAsync || awaited) {
        for (const value of flow.values)
          this.capture(value, invocation.bindings);
        values.push(...flow.values);
      }
      if (isAsync && !awaited) {
        // The rejection reaches the promise, not this call site.
        continues = true;
        unknown ||= flow.unknown;
        continue;
      }
      continues ||= flow.continues || flow.returns;
      throws ||= flow.throws;
      unknown ||= flow.unknown;
    }
    return {
      values: values.slice(0, MAX_VALUES),
      continues,
      returns: false,
      throws,
      unknown,
    };
  }

  private flow(node: ts.Node, seen: ReadonlySet<ts.Node>, depth: number): Flow {
    if (depth >= MAX_CALL_DEPTH || seen.has(node))
      return {
        values: [],
        continues: false,
        returns: false,
        throws: false,
        unknown: true,
      };
    const nextSeen = new Set(seen).add(node);
    if (ts.isExpression(node)) {
      const target = this.expressionCall(node);
      if (target && !ts.isCallExpression(node)) {
        const call = this.callFlow(
          target.call,
          nextSeen,
          depth + 1,
          target.awaited,
        );
        return {
          values: call.values,
          continues: false,
          returns: call.continues,
          throws: call.throws,
          unknown: call.unknown,
        };
      }
      if (ts.isCallExpression(node)) {
        const call = this.callFlow(node, nextSeen, depth + 1);
        return {
          values: call.values,
          continues: false,
          returns: call.continues,
          throws: call.throws,
          unknown: call.unknown,
        };
      }
      return {
        values: this.values(node, new Set(seen)),
        continues: false,
        returns: true,
        throws: false,
        unknown: false,
      };
    }
    if (ts.isBlock(node)) {
      let continues = true;
      let returns = false;
      let throws = false;
      let unknown = false;
      const values: ts.Node[] = [];
      for (const statement of node.statements) {
        if (!continues) break;
        const flow = this.flow(statement, nextSeen, depth + 1);
        values.push(...flow.values);
        returns ||= flow.returns;
        throws ||= flow.throws;
        unknown ||= flow.unknown;
        continues = flow.continues;
      }
      return { values, continues, returns, throws, unknown };
    }
    if (ts.isReturnStatement(node)) {
      const target = node.expression && this.expressionCall(node.expression);
      const call = target
        ? this.callFlow(
            target.call,
            nextSeen,
            depth + 1,
            target.awaited || this.awaitReturns,
          )
        : undefined;
      return {
        values:
          call?.values ??
          (node.expression
            ? this.values(node.expression, new Set(nextSeen))
            : []),
        continues: false,
        returns: call ? call.continues : true,
        throws: call?.throws ?? false,
        unknown: call?.unknown ?? false,
      };
    }
    if (ts.isThrowStatement(node))
      return {
        values: [],
        continues: false,
        returns: false,
        throws: true,
        unknown: false,
      };
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node))
      return {
        values: [],
        continues: false,
        returns: false,
        throws: false,
        unknown: true,
      };
    if (ts.isVariableStatement(node)) {
      let throws = false;
      let unknown = false;
      for (const declaration of node.declarationList.declarations) {
        if (!declaration.initializer) continue;
        const target = this.expressionCall(declaration.initializer);
        if (!target) continue;
        const flow = this.callFlow(
          target.call,
          nextSeen,
          depth + 1,
          target.awaited,
        );
        throws ||= flow.throws;
        unknown ||= flow.unknown;
        if (!flow.continues) return { ...flow, returns: false };
      }
      return {
        values: [],
        continues: true,
        returns: false,
        throws,
        unknown,
      };
    }
    if (ts.isExpressionStatement(node)) {
      if (ts.isDeleteExpression(node.expression))
        return {
          values: [],
          continues: true,
          returns: false,
          throws: false,
          unknown: true,
        };
      const target = this.expressionCall(node.expression);
      if (target) {
        const flow = this.callFlow(
          target.call,
          nextSeen,
          depth + 1,
          target.awaited,
        );
        return { ...flow, values: [], returns: false };
      }
    }
    if (ts.isIfStatement(node)) {
      const branches = [...new Set(this.atoms(node.expression).map(Boolean))];
      if (branches.length === 1)
        return branches[0]
          ? this.flow(node.thenStatement, nextSeen, depth + 1)
          : node.elseStatement
            ? this.flow(node.elseStatement, nextSeen, depth + 1)
            : {
                values: [],
                continues: true,
                returns: false,
                throws: false,
                unknown: false,
              };
      const then = this.flow(node.thenStatement, nextSeen, depth + 1);
      const otherwise = node.elseStatement
        ? this.flow(node.elseStatement, nextSeen, depth + 1)
        : {
            values: [],
            continues: true,
            returns: false,
            throws: false,
            unknown: false,
          };
      return {
        values: [...then.values, ...otherwise.values].slice(0, MAX_VALUES),
        continues: then.continues || otherwise.continues,
        returns: then.returns || otherwise.returns,
        throws: then.throws || otherwise.throws,
        unknown:
          then.unknown ||
          otherwise.unknown ||
          (then.values.length > 0 && otherwise.continues) ||
          (otherwise.values.length > 0 && then.continues),
      };
    }
    if (ts.isForOfStatement(node)) {
      const arrays = this.values(node.expression).filter(
        ts.isArrayLiteralExpression,
      );
      const declaration =
        ts.isVariableDeclarationList(node.initializer) &&
        node.initializer.declarations.length === 1
          ? node.initializer.declarations[0]
          : undefined;
      if (
        !declaration ||
        !arrays.length ||
        arrays.length > MAX_VALUES ||
        arrays.some(
          (array) =>
            array.elements.length > MAX_VALUES ||
            array.elements.some(ts.isSpreadElement) ||
            !this.stableCollection(array) ||
            array.elements.some((element) => !this.completeCandidate(element)),
        )
      )
        return {
          values: [],
          continues: true,
          returns: false,
          throws: false,
          unknown: true,
        };
      const values: ts.Node[] = [];
      let returns = false;
      let throws = false;
      let unknown = false;
      let continues = true;
      for (const array of arrays) {
        for (const element of array.elements) {
          if (!continues) break;
          const bindings = new Map(this.bindings).set(declaration, [element]);
          const flow = new StaticValues(
            this.analysis,
            bindings,
            this.captures,
            this.activeCalls,
            this.expandServices,
            this.awaitReturns,
          ).flow(node.statement, nextSeen, depth + 1);
          values.push(...flow.values);
          returns ||= flow.returns;
          throws ||= flow.throws;
          unknown ||= flow.unknown;
          continues = flow.continues;
        }
      }
      return {
        values: values.slice(0, MAX_VALUES),
        continues,
        returns,
        throws,
        unknown,
      };
    }
    if (
      ts.isFunctionLike(node) ||
      ts.isClassDeclaration(node) ||
      ts.isClassExpression(node) ||
      ts.isTypeNode(node)
    )
      return {
        values: [],
        continues: true,
        returns: false,
        throws: false,
        unknown: false,
      };
    return {
      values: [],
      continues: true,
      returns: false,
      throws: false,
      unknown: false,
    };
  }

  /** The call an expression evaluates, and whether it is awaited. */
  private expressionCall(
    node: ts.Expression,
    awaited = false,
  ): { call: ts.CallExpression; awaited: boolean } | undefined {
    if (ts.isCallExpression(node)) return { call: node, awaited };
    if (ts.isAwaitExpression(node))
      return this.expressionCall(node.expression, true);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return this.expressionCall(node.expression, awaited);
    return undefined;
  }

  private stableCollection(
    node: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression,
  ): boolean {
    if (
      (ts.isArrayLiteralExpression(node) &&
        (node.elements.length > MAX_VALUES ||
          node.elements.some(ts.isSpreadElement))) ||
      (ts.isObjectLiteralExpression(node) &&
        node.properties.some(ts.isSpreadAssignment))
    )
      return false;
    const parent = node.parent;
    return ts.isVariableDeclaration(parent) ? this.stableBinding(parent) : true;
  }

  private stableBinding(declaration: ts.VariableDeclaration): boolean {
    if (
      !ts.isIdentifier(declaration.name) ||
      !ts.isVariableDeclarationList(declaration.parent) ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      this.analysis.isExported(declaration)
    )
      return false;
    const symbol = this.analysis.symbol(declaration.name);
    let stable = true;
    const visit = (current: ts.Node): void => {
      if (!stable || ts.isTypeNode(current)) return;
      if (
        ts.isIdentifier(current) &&
        current !== declaration.name &&
        this.analysis.symbol(current) === symbol
      ) {
        let owner: ts.Node = current;
        while (
          (ts.isPropertyAccessExpression(owner.parent) &&
            owner.parent.expression === owner) ||
          (ts.isElementAccessExpression(owner.parent) &&
            owner.parent.expression === owner)
        )
          owner = owner.parent;
        const use = owner.parent;
        if (ts.isCallExpression(use)) {
          if (use.expression === owner) {
            stable =
              ts.isPropertyAccessExpression(owner) &&
              owner.name.text === 'safeParse';
          } else stable = false;
        } else if (
          ts.isBinaryExpression(use) &&
          use.left === owner &&
          use.operatorToken.kind === ts.SyntaxKind.EqualsToken
        )
          stable = false;
        else if (
          ts.isPrefixUnaryExpression(use) ||
          ts.isPostfixUnaryExpression(use)
        )
          stable = false;
        else if (ts.isDeleteExpression(use)) stable = false;
      }
      ts.forEachChild(current, visit);
    };
    visit(declaration.getSourceFile());
    return stable;
  }

  private completeCandidate(node: ts.Node, seen = new Set<ts.Node>()): boolean {
    if (seen.has(node) || seen.size >= MAX_VALUES) return false;
    const next = new Set(seen).add(node);
    if (
      ts.isIdentifier(node) &&
      this.analysis
        .declarations(node)
        .some(
          (declaration) =>
            ts.isVariableDeclaration(declaration) &&
            !this.stableBinding(declaration),
        )
    )
      return false;
    const values = this.values(node);
    if (!values.length) return false;
    return values.every((value) => {
      if (ts.isObjectLiteralExpression(value))
        return (
          this.stableCollection(value) &&
          value.properties.length <= MAX_VALUES &&
          value.properties.every((property) => {
            if (
              ts.isSpreadAssignment(property) ||
              ts.isGetAccessorDeclaration(property) ||
              ts.isSetAccessorDeclaration(property) ||
              !property.name ||
              ts.isComputedPropertyName(property.name)
            )
              return false;
            if (ts.isPropertyAssignment(property)) {
              const nested = this.values(property.initializer);
              return (
                nested.length > 0 &&
                nested.every((item) =>
                  ts.isObjectLiteralExpression(item) ||
                  ts.isArrayLiteralExpression(item)
                    ? this.completeCandidate(item, next)
                    : true,
                )
              );
            }
            return (
              ts.isShorthandPropertyAssignment(property) ||
              ts.isMethodDeclaration(property)
            );
          })
        );
      if (ts.isArrayLiteralExpression(value))
        return (
          value.elements.length <= MAX_VALUES &&
          value.elements.every(
            (element) =>
              !ts.isSpreadElement(element) &&
              this.completeCandidate(element, next),
          )
        );
      return (
        ts.isFunctionLike(value) ||
        ts.isStringLiteralLike(value) ||
        ts.isNumericLiteral(value) ||
        value.kind === ts.SyntaxKind.TrueKeyword ||
        value.kind === ts.SyntaxKind.FalseKeyword ||
        value.kind === ts.SyntaxKind.NullKeyword ||
        ts.isNoSubstitutionTemplateLiteral(value)
      );
    });
  }

  private capture(node: ts.Node, bindings: Bindings): void {
    if (ts.isFunctionLike(node) || ts.isObjectLiteralExpression(node)) {
      // Inner invocations own their parameters. An outer return must retain that scope; competing
      // values for the same parameter are ambiguous and cannot establish selected evidence.
      const captured = new Map(bindings);
      for (const [declaration, values] of this.captures.get(node) ?? []) {
        const current = captured.get(declaration);
        captured.set(
          declaration,
          current &&
            (current.length !== values.length ||
              current.some((value, index) => value !== values[index]))
            ? []
            : values,
        );
      }
      this.captures.set(node, captured);
      if (ts.isFunctionLike(node)) return;
    }
    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property))
          this.capture(property.initializer, bindings);
        else if (ts.isShorthandPropertyAssignment(property))
          this.capture(property.name, bindings);
        else if (ts.isMethodDeclaration(property))
          this.capture(property, bindings);
      }
    } else if (ts.isArrayLiteralExpression(node))
      node.elements.forEach((element) => this.capture(element, bindings));
  }

  private hasSpread(node: ts.Node, seen = new Set<ts.Node>()): boolean {
    if (seen.has(node) || seen.size >= MAX_VALUES) return true;
    const next = new Set(seen).add(node);
    return ts.isObjectLiteralExpression(node)
      ? node.properties.some((property) => {
          if (!ts.isSpreadAssignment(property)) return false;
          const scope = this.captures.get(node);
          const evaluator = scope
            ? new StaticValues(
                this.analysis,
                new Map([...this.bindings, ...scope]),
                this.captures,
                this.activeCalls,
                this.expandServices,
                this.awaitReturns,
              )
            : this;
          const values = evaluator.values(property.expression);
          return (
            values.length !== 1 ||
            !ts.isObjectLiteralExpression(values[0]) ||
            this.hasSpread(values[0], next)
          );
        })
      : ts.isJsxAttributes(node) &&
          node.properties.some(ts.isJsxSpreadAttribute);
  }

  private property(
    node: ts.Node,
    name: string,
    seen: Set<ts.Node>,
  ): readonly ts.Node[] {
    if (this.hasSpread(node)) return [];
    if (ts.isNewExpression(node)) {
      const classes = this.analysis
        .values(node.expression)
        .filter(ts.isClassLike);
      if (
        classes.length !== 1 ||
        classes[0].heritageClauses?.length ||
        node.arguments?.some(ts.isSpreadElement)
      )
        return [];
      const owner = classes[0];
      const constructor = owner.members.find(ts.isConstructorDeclaration);
      if (constructor?.parameters.some((parameter) => parameter.dotDotDotToken))
        return [];
      const scope = new Map(this.bindings).set(owner, [node]);
      constructor?.parameters.forEach((parameter, index) => {
        const argument = node.arguments?.[index] ?? parameter.initializer;
        scope.set(parameter, argument ? this.values(argument, seen) : []);
      });
      const evaluator = new StaticValues(
        this.analysis,
        scope,
        this.captures,
        this.activeCalls,
        this.expandServices,
        this.awaitReturns,
      );
      if (constructor?.body) {
        const flow = evaluator.flow(constructor.body, new Set(), 0);
        if (flow.unknown || !flow.continues || flow.returns) return [];
      }
      const member = owner.members.find(
        (item) =>
          item.name &&
          (ts.isIdentifier(item.name) || ts.isStringLiteralLike(item.name)) &&
          item.name.text === name &&
          !(
            ts.canHaveModifiers(item) ? ts.getModifiers(item) : undefined
          )?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword),
      );
      if (member && ts.isMethodDeclaration(member)) {
        evaluator.capture(member, scope);
        return [member];
      }
      const values: ts.Node[] =
        member && ts.isPropertyDeclaration(member) && member.initializer
          ? [member.initializer]
          : [];
      const parameterProperty = constructor?.parameters.find(
        (parameter) =>
          ts.isIdentifier(parameter.name) &&
          parameter.name.text === name &&
          parameter.modifiers?.some((modifier) =>
            [
              ts.SyntaxKind.PrivateKeyword,
              ts.SyntaxKind.PublicKeyword,
              ts.SyntaxKind.ProtectedKeyword,
              ts.SyntaxKind.ReadonlyKeyword,
            ].includes(modifier.kind),
          ),
      );
      if (parameterProperty) values.push(parameterProperty);
      for (const statement of constructor?.body?.statements ?? []) {
        const assignment = ts.isExpressionStatement(statement)
          ? statement.expression
          : undefined;
        if (
          assignment &&
          ts.isBinaryExpression(assignment) &&
          assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(assignment.left) &&
          assignment.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
          assignment.left.name.text === name
        )
          values.push(assignment.right);
      }
      return values.length === 1 ? evaluator.values(values[0], seen) : [];
    }
    if (ts.isObjectLiteralExpression(node)) {
      const properties: ts.ObjectLiteralElementLike[] = [];
      const expand = (
        object: ts.ObjectLiteralExpression,
        visited = new Set<ts.Node>(),
      ): boolean => {
        if (visited.has(object) || visited.size >= MAX_VALUES) return false;
        const scope = this.captures.get(object);
        const evaluator = scope
          ? new StaticValues(
              this.analysis,
              new Map([...this.bindings, ...scope]),
              this.captures,
              this.activeCalls,
              this.expandServices,
              this.awaitReturns,
            )
          : this;
        for (const property of object.properties) {
          if (ts.isSpreadAssignment(property)) {
            const values = evaluator.values(property.expression);
            if (
              values.length !== 1 ||
              !ts.isObjectLiteralExpression(values[0]) ||
              !expand(values[0], new Set(visited).add(object))
            )
              return false;
          } else properties.push(property);
        }
        return true;
      };
      if (!expand(node)) return [];
      const entry = [...properties]
        .reverse()
        .find(
          (item) =>
            item.name &&
            (ts.isIdentifier(item.name) || ts.isStringLiteralLike(item.name)) &&
            item.name.text === name,
        );
      const value =
        entry && ts.isPropertyAssignment(entry)
          ? entry.initializer
          : entry && ts.isShorthandPropertyAssignment(entry)
            ? entry.name
            : entry && ts.isMethodDeclaration(entry)
              ? entry
              : undefined;
      const scope = this.captures.get(node);
      const evaluator = scope
        ? new StaticValues(
            this.analysis,
            new Map([...this.bindings, ...scope]),
            this.captures,
            this.activeCalls,
            this.expandServices,
            this.awaitReturns,
          )
        : this;
      return value ? evaluator.values(value, seen) : [];
    }
    if (ts.isJsxAttributes(node)) {
      const entry = node.properties.find(
        (item) => ts.isJsxAttribute(item) && item.name.getText() === name,
      );
      if (entry && ts.isJsxAttribute(entry) && entry.initializer) {
        const value = ts.isJsxExpression(entry.initializer)
          ? entry.initializer.expression
          : entry.initializer;
        return value ? this.values(value, seen) : [];
      }
    }
    return [];
  }

  private atoms(node: ts.Node, seen: Set<ts.Node> = new Set()): Atom[] {
    return this.values(node, seen)
      .flatMap((value): Atom[] => {
        if (ts.isStringLiteralLike(value)) return [value.text];
        if (ts.isNumericLiteral(value)) return [Number(value.text)];
        if (value.kind === ts.SyntaxKind.TrueKeyword) return [true];
        if (value.kind === ts.SyntaxKind.FalseKeyword) return [false];
        if (value.kind === ts.SyntaxKind.NullKeyword) return [null];
        if (ts.isTypeOfExpression(value))
          return this.atoms(value.expression, new Set(seen).add(value)).map(
            (item) => typeof item,
          );
        if (ts.isCallExpression(value))
          return this.call(value, new Set(seen).add(value));
        if (
          ts.isPrefixUnaryExpression(value) &&
          value.operator === ts.SyntaxKind.ExclamationToken
        )
          return this.atoms(value.operand, new Set(seen).add(value)).map(
            (item) => !item,
          );
        if (!ts.isBinaryExpression(value)) return [];
        const next = new Set(seen).add(value);
        return this.atoms(value.left, next)
          .flatMap((left) =>
            this.atoms(value.right, next).flatMap((right): Atom[] => {
              switch (value.operatorToken.kind) {
                case ts.SyntaxKind.EqualsEqualsEqualsToken:
                  return [left === right];
                case ts.SyntaxKind.EqualsEqualsToken:
                  return left === null ||
                    right === null ||
                    typeof left === typeof right
                    ? [left === right]
                    : [];
                case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                  return [left !== right];
                case ts.SyntaxKind.BarBarToken:
                  return [left || right];
                case ts.SyntaxKind.AmpersandAmpersandToken:
                  return [left && right];
                case ts.SyntaxKind.QuestionQuestionToken:
                  return [left ?? right];
                case ts.SyntaxKind.PlusToken:
                  return typeof left === 'string' || typeof right === 'string'
                    ? [String(left) + String(right)]
                    : typeof left === 'number' && typeof right === 'number'
                      ? [left + right]
                      : [];
                default:
                  return [];
              }
            }),
          )
          .slice(0, MAX_VALUES);
      })
      .slice(0, MAX_VALUES);
  }

  /** Interpret only literal inputs, local returns and decidable branches; never invoke application code. */
  private call(node: ts.CallExpression, seen: Set<ts.Node>): Atom[] {
    if (seen.size >= MAX_VALUES) return [];
    if (
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'String' &&
      !this.analysis.declarations(node.expression).length &&
      node.arguments.length === 1
    )
      return this.atoms(node.arguments[0], seen).map(String);
    return this.analysis
      .functions(node.expression)
      .flatMap((fn) => {
        if (!('body' in fn) || !fn.body) return [];
        const bindings = new Map(this.bindings);
        fn.parameters.forEach((parameter, index) => {
          const argument = node.arguments[index] ?? parameter.initializer;
          bindings.set(parameter, argument ? [argument] : []);
        });
        const evaluator = new StaticValues(this.analysis, bindings);
        type Result = { returned: boolean; values: Atom[] };
        const statement = (item: ts.Node): Result => {
          if (ts.isReturnStatement(item))
            return {
              returned: true,
              values: item.expression
                ? evaluator.atoms(item.expression, seen)
                : [],
            };
          if (ts.isBlock(item)) {
            for (const child of item.statements) {
              const result = statement(child);
              if (result.returned) return result;
            }
            return { returned: false, values: [] };
          }
          if (ts.isIfStatement(item)) {
            const condition = [
              ...new Set(evaluator.atoms(item.expression, seen).map(Boolean)),
            ];
            if (condition.length !== 1) return { returned: true, values: [] };
            return condition[0]
              ? statement(item.thenStatement)
              : item.elseStatement
                ? statement(item.elseStatement)
                : { returned: false, values: [] };
          }
          // Assignments, loops, throws and opaque statements are not a pure literal conversion.
          return { returned: true, values: [] };
        };
        return ts.isArrowFunction(fn) && !ts.isBlock(fn.body)
          ? evaluator.atoms(fn.body, seen)
          : statement(fn.body).values;
      })
      .slice(0, MAX_VALUES);
  }

  public booleans(node: ts.Node): boolean[] {
    return [...new Set(this.atoms(node).map(Boolean))];
  }

  public strings(node: ts.Node, dynamic = false): string[] {
    return this.values(node)
      .flatMap((value) => {
        if (ts.isStringLiteralLike(value)) return [value.text];
        if (!ts.isTemplateExpression(value))
          return this.atoms(value).filter(
            (item): item is string => typeof item === 'string',
          );
        let paths = [value.head.text];
        for (const span of value.templateSpans) {
          const known = this.atoms(span.expression).map(String);
          const parts = known.length ? known : dynamic ? [':dynamic'] : [];
          paths = paths
            .flatMap((prefix) =>
              parts.map((part) => prefix + part + span.literal.text),
            )
            .slice(0, MAX_VALUES);
        }
        return paths;
      })
      .slice(0, MAX_VALUES);
  }
}
