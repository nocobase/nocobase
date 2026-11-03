import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';
import { importedContract } from './api-contracts.js';

type Atom = string | number | boolean | null | undefined;
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
// Escape verdicts per authorized handler context; the source graph never changes during a scan.
const ESCAPES = new WeakMap<ts.Node, { scope: number; value: boolean }>();
const ESCAPE_ACTIVE = new WeakMap<SourceEvidence, Set<ts.Node>>();
// A handler context whose proof re-entered itself is "not proven" from any top-level entry while the authorized
// handlers stay the same; reuse that answer only within the authorization scope that produced it.
const CYCLE_UNPROVEN = new WeakMap<ts.Node, number>();
const CHILDREN = new WeakMap<ts.Node, readonly ts.Node[]>();
function childrenOf(node: ts.Node): readonly ts.Node[] {
  let children = CHILDREN.get(node);
  if (!children) {
    const found: ts.Node[] = [];
    ts.forEachChild(node, (child) => {
      found.push(child);
    });
    children = found;
    CHILDREN.set(node, children);
  }
  return children;
}
// Pre-order walk with an explicit stack, so a deep evaluation does not also spend call stack on syntax depth.
function walk(root: ts.Node, visit: (node: ts.Node) => boolean): void {
  const stack: ts.Node[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    if (!visit(node)) return;
    const children: ts.Node[] = [];
    ts.forEachChild(node, (child) => {
      children.push(child);
    });
    for (let index = children.length - 1; index >= 0; index--)
      stack.push(children[index]);
  }
}
const MUTATED = new WeakMap<ts.Declaration, boolean>();
const STABLE_BINDINGS = new WeakMap<
  SourceEvidence,
  WeakMap<ts.VariableDeclaration, boolean>
>();
const CLOSED_RECORDS = new WeakMap<SourceEvidence, WeakMap<ts.Node, boolean>>();
// Accessor names declared in object literals of an analysis's sources; the source graph never changes during a scan.
const ACCESSORS = new WeakMap<
  object,
  {
    names: Set<string>;
    computed: boolean;
    arrayMethodsIntact: boolean;
    regexpMethodsIntact: boolean;
  }
>();
function accessorIndex(analysis: SourceEvidence): {
  names: Set<string>;
  computed: boolean;
  arrayMethodsIntact: boolean;
  regexpMethodsIntact: boolean;
} {
  let index = ACCESSORS.get(analysis);
  if (index) return index;
  index = {
    names: new Set(),
    computed: false,
    arrayMethodsIntact: true,
    regexpMethodsIntact: true,
  };
  const found = index;
  for (const source of analysis.evidenceSources())
    walk(source, (node) => {
      if (
        ts.isTypeNode(node) ||
        (ts.isIdentifier(node) && ts.isTypeNode(node.parent))
      )
        return true;
      if (
        (ts.isPropertyAccessExpression(node) &&
          (['__proto__', 'constructor'].includes(node.name.text) ||
            (node.name.text === 'prototype' &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === 'Array' &&
              !analysis.symbol(node.expression)))) ||
        (ts.isIdentifier(node) &&
          ['Array', 'eval', 'Function'].includes(node.text) &&
          !analysis.symbol(node) &&
          !(
            ts.isPropertyAccessExpression(node.parent) &&
            node.parent.expression === node &&
            ['isArray', 'from', 'of'].includes(node.parent.name.text) &&
            ts.isCallExpression(node.parent.parent) &&
            node.parent.parent.expression === node.parent
          )) ||
        (ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ['defineProperty', 'defineProperties', 'setPrototypeOf'].includes(
            node.expression.name.text,
          ))
      )
        found.arrayMethodsIntact = false;
      if (
        (ts.isIdentifier(node) &&
          node.text === 'RegExp' &&
          !analysis.symbol(node)) ||
        (ts.isPropertyAccessExpression(node) &&
          ['__proto__', 'constructor'].includes(node.name.text)) ||
        (ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ['defineProperty', 'defineProperties', 'setPrototypeOf'].includes(
            node.expression.name.text,
          ))
      )
        found.regexpMethodsIntact = false;
      if (
        (ts.isGetAccessorDeclaration(node) ||
          ts.isSetAccessorDeclaration(node)) &&
        ts.isObjectLiteralExpression(node.parent)
      ) {
        if (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name))
          found.names.add(node.name.text);
        else found.computed = true;
      }
      return true;
    });
  ACCESSORS.set(analysis, index);
  return index;
}
const CONTINUES = {
  values: [],
  continues: true,
  returns: false,
  throws: false,
  unknown: false,
} as const;

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
    private readonly localArrays: Map<
      ts.VariableDeclaration,
      ts.Expression[]
    > = new Map(),
  ) {
    this.captures = captures ?? new Map<ts.Node, Bindings>();
    this.activeCalls = activeCalls ?? new Set();
  }

  public values(
    node: ts.Node,
    seen: Set<ts.Node> = new Set(),
  ): readonly ts.Node[] {
    if (seen.has(node) || seen.size >= MAX_VALUES) return [];
    // These values are already represented by their syntax and have no alias to follow.
    // Keep the cycle and value budgets above this fast path.
    if (
      ts.isLiteralExpression(node) ||
      ts.isFunctionLike(node) ||
      ts.isArrayLiteralExpression(node) ||
      ts.isObjectLiteralExpression(node) ||
      node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword ||
      node.kind === ts.SyntaxKind.NullKeyword
    )
      return [node];
    // Evaluation is synchronous. Restore the path on every exit so sibling
    // branches and callers observe the same set without copying it per alias.
    seen.add(node);
    try {
      return this.resolveValues(node, seen);
    } finally {
      seen.delete(node);
    }
  }

  private resolveValues(node: ts.Node, seen: Set<ts.Node>): readonly ts.Node[] {
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
    if (
      ts.isIdentifier(node) &&
      ['undefined', 'NaN', 'Infinity'].includes(node.text) &&
      !this.analysis.declarations(node).length
    )
      return [node];
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
      if (node.dotDotDotToken && ts.isObjectBindingPattern(node.parent)) {
        if (!ts.isVariableDeclaration(owner) || !owner.initializer) return [];
        const source = StaticValues.unwrap(owner.initializer);
        if (!ts.isObjectLiteralExpression(source)) {
          if (!ts.isIdentifier(source)) return [];
          const declarations = this.analysis.declarations(source);
          if (
            declarations.length !== 1 ||
            !ts.isVariableDeclaration(declarations[0]) ||
            !declarations[0].initializer ||
            !ts.isObjectLiteralExpression(
              StaticValues.unwrap(declarations[0].initializer),
            )
          )
            return [];
        }
        const excluded = new Set<string>();
        for (const sibling of node.parent.elements) {
          if (sibling === node) continue;
          const key = sibling.propertyName ?? sibling.name;
          if (
            sibling.dotDotDotToken ||
            !(ts.isIdentifier(key) || ts.isStringLiteralLike(key))
          )
            return [];
          excluded.add(key.text);
        }
        if (
          containers.length !== 1 ||
          !ts.isObjectLiteralExpression(containers[0]) ||
          !this.finiteOwner(containers[0])
        )
          return [];
        const properties: ts.ObjectLiteralElementLike[] = [];
        for (const property of containers[0].properties) {
          if (
            !(
              ts.isPropertyAssignment(property) ||
              ts.isShorthandPropertyAssignment(property)
            ) ||
            !(
              ts.isIdentifier(property.name) ||
              ts.isStringLiteralLike(property.name)
            )
          )
            return [];
          if (property.name.text === '__proto__') return [];
          if (excluded.has(property.name.text)) continue;
          const child = this.materialize(
            ts.isPropertyAssignment(property)
              ? property.initializer
              : property.name,
            new Set(),
          );
          if (!child) return [];
          properties.push(
            ts.factory.createPropertyAssignment(property.name, child),
          );
        }
        return [
          this.origin(
            ts.factory.createObjectLiteralExpression(properties),
            node,
          ),
        ];
      }
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
      const local = this.localArrays.get(node);
      if (local)
        return [
          this.origin(
            ts.factory.createArrayLiteralExpression(local),
            node.initializer ?? node,
          ),
        ];
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
      const inputs = this.initializers(node.arguments, new Set(seen), 0);
      if (inputs.unknown || !inputs.continues) return [];
      const finite = this.finiteArrayCall(node, seen, 0);
      if (finite !== undefined)
        return finite.unknown || !finite.continues ? [] : finite.values;
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
        bindings.set(
          parameter,
          argument
            ? [argument]
            : [this.origin(ts.factory.createIdentifier('undefined'), node)],
        );
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

  /** Missing, the unshadowed `undefined`, or `void`: the parameter default is used. */
  private undefinedArgument(node: ts.Node | undefined): boolean {
    return (
      !node ||
      ts.isVoidExpression(node) ||
      (ts.isIdentifier(node) &&
        node.text === 'undefined' &&
        !this.analysis.declarations(node).length)
    );
  }

  /** Only syntax that cannot evaluate to undefined skips the default; anything else may trigger it. */
  private maybeUndefined(node: ts.Node | undefined): boolean {
    if (this.undefinedArgument(node)) return true;
    return !(
      ts.isStringLiteralLike(node!) ||
      ts.isNumericLiteral(node!) ||
      ts.isTemplateExpression(node!) ||
      ts.isObjectLiteralExpression(node!) ||
      ts.isArrayLiteralExpression(node!) ||
      ts.isFunctionLike(node) ||
      ts.isNewExpression(node!) ||
      [
        ts.SyntaxKind.TrueKeyword,
        ts.SyntaxKind.FalseKeyword,
        ts.SyntaxKind.NullKeyword,
        ts.SyntaxKind.ThisKeyword,
      ].includes(node!.kind)
    );
  }

  /** A declaration reassigned, deleted or written through anywhere in its scope is not a stable alias. */
  private mutated(declaration: ts.Declaration): boolean {
    let scope: ts.Node = declaration.parent;
    while (!ts.isFunctionLike(scope) && !ts.isSourceFile(scope))
      scope = scope.parent;
    let found = false;
    const base = (target: ts.Node): ts.Node => {
      while (
        ts.isPropertyAccessExpression(target) ||
        ts.isElementAccessExpression(target) ||
        ts.isParenthesizedExpression(target) ||
        ts.isNonNullExpression(target)
      )
        target = target.expression;
      return target;
    };
    const known = MUTATED.get(declaration);
    if (known !== undefined) return known;
    const visit = (node: ts.Node): void => {
      if (found) return;
      const target =
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
          ? node.left
          : ts.isDeleteExpression(node)
            ? node.expression
            : (ts.isPrefixUnaryExpression(node) ||
                  ts.isPostfixUnaryExpression(node)) &&
                [
                  ts.SyntaxKind.PlusPlusToken,
                  ts.SyntaxKind.MinusMinusToken,
                ].includes(node.operator)
              ? node.operand
              : undefined;
      const written = target && base(target);
      if (
        written &&
        ts.isIdentifier(written) &&
        this.analysis.declarations(written).includes(declaration)
      )
        found = true;
    };
    walk(scope, (node) => {
      visit(node);
      return !found;
    });
    MUTATED.set(declaration, found);
    return found;
  }

  /**
   * The AuthorizationContext the official authorization middleware stores under `authz` for a handler that
   * `authorizedHandlers` proves runs behind it. Only const and bound-parameter aliases, and properties of object
   * literals returned by local functions, are followed; a rebound or written alias, `c.set`, or any other
   * receiver is not the proven context.
   */
  private authorizationContext(
    node: ts.Node,
    seen = new Set<ts.Node>(),
  ): boolean {
    if (seen.has(node) || seen.size >= MAX_VALUES) return false;
    seen = new Set(seen).add(node);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return this.authorizationContext(node.expression, seen);
    if (ts.isIdentifier(node)) {
      const declarations = this.analysis.declarations(node);
      if (declarations.length !== 1 || this.mutated(declarations[0]))
        return false;
      const declaration = declarations[0];
      if (ts.isParameter(declaration)) {
        const bound = this.bindings.get(declaration);
        return (
          !!bound?.length &&
          bound.every((value) => this.authorizationContext(value, seen))
        );
      }
      return (
        ts.isVariableDeclaration(declaration) &&
        ts.isIdentifier(declaration.name) &&
        !!declaration.initializer &&
        !!(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) &&
        this.authorizationContext(declaration.initializer, seen)
      );
    }
    if (ts.isPropertyAccessExpression(node) && !node.questionDotToken) {
      const objects = this.returnedObjects(node.expression, seen);
      return (
        !!objects.length &&
        objects.every(([object, evaluator]) => {
          const matches = object.properties.filter(
            (property) =>
              property.name &&
              (ts.isIdentifier(property.name) ||
                ts.isStringLiteralLike(property.name)) &&
              property.name.text === node.name.text,
          );
          if (
            matches.length !== 1 ||
            object.properties.some((property) =>
              ts.isSpreadAssignment(property),
            )
          )
            return false;
          const property = matches[0];
          return ts.isPropertyAssignment(property)
            ? evaluator.authorizationContext(property.initializer, seen)
            : ts.isShorthandPropertyAssignment(property) &&
                evaluator.authorizationContext(property.name, seen);
        })
      );
    }
    if (
      !ts.isCallExpression(node) ||
      node.questionDotToken ||
      node.arguments.length !== 1 ||
      !ts.isStringLiteralLike(node.arguments[0]) ||
      node.arguments[0].text !== 'authz' ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.questionDotToken ||
      node.expression.name.text !== 'get' ||
      !ts.isIdentifier(node.expression.expression)
    )
      return false;
    return this.handlerContext(node.expression.expression, seen);
  }

  /** The first parameter of an authorized handler, directly or through bound parameters of local helpers. */
  private handlerContext(node: ts.Node, seen: Set<ts.Node>): boolean {
    if (seen.has(node) || seen.size >= MAX_VALUES || !ts.isIdentifier(node))
      return false;
    seen = new Set(seen).add(node);
    const declarations = this.analysis.declarations(node);
    if (declarations.length !== 1 || !ts.isParameter(declarations[0]))
      return false;
    const parameter = declarations[0];
    if (this.mutated(parameter)) return false;
    const bound = this.bindings.get(parameter);
    if (bound)
      return (
        !!bound.length &&
        bound.every((value) => this.handlerContext(value, seen))
      );
    const handler = parameter.parent;
    if (
      handler.parameters[0] !== parameter ||
      !this.analysis.authorizedHandlers.has(handler)
    )
      return false;
    const cached = ESCAPES.get(parameter);
    if (cached?.scope === this.analysis.authorizationScope)
      return !cached.value;
    let known: boolean;
    if (CYCLE_UNPROVEN.get(parameter) === this.analysis.authorizationScope) {
      // The reused verdict came from a cycle: whatever consumes it is cycle-affected too.
      this.analysis.proofRevision++;
      return false;
    }
    let active = ESCAPE_ACTIVE.get(this.analysis);
    if (!active) ESCAPE_ACTIVE.set(this.analysis, (active = new Set()));
    if (active.has(parameter)) {
      this.analysis.proofRevision++;
      return false;
    }
    const revision = this.analysis.proofRevision;
    active.add(parameter);
    try {
      known = new StaticValues(this.analysis).escapes(
        parameter,
        {
          seen: new Set(),
          fields: new Set(),
        },
        0,
      );
      if (revision !== this.analysis.proofRevision) {
        if (active.size === 1)
          CYCLE_UNPROVEN.set(parameter, this.analysis.authorizationScope);
        return false;
      }
      ESCAPES.set(parameter, {
        scope: this.analysis.authorizationScope,
        value: known,
      });
      return !known;
    } finally {
      active.delete(parameter);
    }
  }

  /**
   * Whether the handler context, or a value derived from it, can reach code that could replace or rewrite the
   * authorization context: an unresolved call, a write through it, `set('authz')` or a non-literal key, storage
   * outside a returned object. Every use in the scope counts, wherever it is evaluated.
   */
  private escapes(
    declaration: ts.Declaration,
    state: { seen: Set<ts.Node>; fields: Set<string> },
    depth: number,
  ): boolean {
    if (state.seen.has(declaration)) return false;
    if (depth > 8 || state.seen.size >= 64) return true;
    state.seen.add(declaration);
    const scope: ts.Node = ts.isParameter(declaration)
      ? declaration.parent
      : (() => {
          let node: ts.Node = declaration.parent;
          while (!ts.isFunctionLike(node) && !ts.isSourceFile(node))
            node = node.parent;
          return node;
        })();
    let escaped = false;
    const visit = (node: ts.Node): void => {
      if (escaped) return;
      if (
        ts.isIdentifier(node) &&
        node.parent !== declaration &&
        this.analysis.declarations(node).includes(declaration)
      )
        escaped = this.valueEscapes(node, state, depth);
    };
    walk(scope, (node) => {
      visit(node);
      return !escaped;
    });
    return escaped;
  }

  private valueEscapes(
    node: ts.Node,
    state: { seen: Set<ts.Node>; fields: Set<string> },
    depth: number,
  ): boolean {
    const parent = node.parent;
    if (
      ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isSatisfiesExpression(parent) ||
      ts.isNonNullExpression(parent) ||
      ts.isAwaitExpression(parent)
    )
      return this.valueEscapes(parent, state, depth);
    const written = (target: ts.Node): boolean => {
      const use = target.parent;
      return (
        (ts.isBinaryExpression(use) &&
          use.left === target &&
          use.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          use.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
        ts.isDeleteExpression(use) ||
        ((ts.isPrefixUnaryExpression(use) ||
          ts.isPostfixUnaryExpression(use)) &&
          [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
            use.operator,
          ))
      );
    };
    if (written(node)) return true;
    if (
      ts.isBinaryExpression(parent) &&
      parent.right === node &&
      parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    )
      return true;
    if (
      (ts.isPropertyAccessExpression(parent) ||
        ts.isElementAccessExpression(parent)) &&
      parent.expression === node
    ) {
      if (written(parent)) return true;
      if (ts.isElementAccessExpression(parent)) return true;
      const use = parent.parent;
      if (ts.isCallExpression(use) && use.expression === parent) {
        const key = use.arguments[0];
        const literal =
          key && ts.isStringLiteralLike(key) ? key.text : undefined;
        if (parent.name.text === 'set')
          return literal === undefined || literal === 'authz';
        // The handler's stored context itself, read back through the official key.
        if (parent.name.text === 'get' && literal === 'authz')
          return this.valueEscapes(use, state, depth);
        return false;
      }
      return state.fields.has(parent.name.text)
        ? this.valueEscapes(parent, state, depth)
        : false;
    }
    if (
      ts.isCallExpression(parent) &&
      parent.arguments.includes(node as ts.Expression)
    ) {
      const index = parent.arguments.indexOf(node as ts.Expression);
      const invocations = this.invocations(parent);
      if (!invocations.length) return true;
      for (const invocation of invocations) {
        const parameter = invocation.fn.parameters[index];
        if (!parameter) continue;
        if (!ts.isIdentifier(parameter.name) || parameter.dotDotDotToken)
          return true;
        const evaluator = new StaticValues(
          this.analysis,
          invocation.bindings,
          this.captures,
          this.activeCalls,
          this.expandServices,
        );
        if (evaluator.escapes(parameter, state, depth + 1)) return true;
        if (
          evaluator.carries(
            invocation.fn,
            parameter,
            0,
            new Set(['authz', ...state.fields]),
          ) &&
          this.valueEscapes(parent, state, depth + 1)
        )
          return true;
      }
      return false;
    }
    if (ts.isVariableDeclaration(parent) && parent.initializer === node)
      return (
        !ts.isIdentifier(parent.name) ||
        !(ts.getCombinedNodeFlags(parent) & ts.NodeFlags.Const) ||
        this.escapes(parent, state, depth + 1)
      );
    if (
      (ts.isShorthandPropertyAssignment(parent) && parent.name === node) ||
      (ts.isPropertyAssignment(parent) && parent.initializer === node)
    ) {
      if (
        parent.name &&
        (ts.isIdentifier(parent.name) || ts.isStringLiteralLike(parent.name))
      )
        state.fields.add(parent.name.text);
      else return true;
      const object = parent.parent;
      const holder = object.parent;
      // A returned object reaches its callers, whose uses are checked through `carries`.
      return ts.isReturnStatement(holder) ||
        (ts.isArrowFunction(holder) && holder.body === object)
        ? false
        : this.valueEscapes(object, state, depth);
    }
    if (
      ts.isReturnStatement(parent) ||
      (ts.isArrowFunction(parent) && parent.body === node) ||
      ts.isExpressionStatement(parent) ||
      (ts.isIfStatement(parent) && parent.expression === node) ||
      (ts.isConditionalExpression(parent) && parent.condition === node) ||
      (ts.isBinaryExpression(parent) &&
        !(
          parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
        ) &&
        ![
          ts.SyntaxKind.AmpersandAmpersandToken,
          ts.SyntaxKind.BarBarToken,
          ts.SyntaxKind.QuestionQuestionToken,
          ts.SyntaxKind.CommaToken,
        ].includes(parent.operatorToken.kind)) ||
      (ts.isPrefixUnaryExpression(parent) &&
        parent.operator === ts.SyntaxKind.ExclamationToken) ||
      ts.isTypeOfExpression(parent)
    )
      return false;
    if (
      ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.CommaToken &&
      parent.left === node
    )
      return false;
    if (ts.isBinaryExpression(parent) || ts.isConditionalExpression(parent))
      return this.valueEscapes(parent, state, depth);
    return true;
  }

  /** Whether a local function may return its parameter or something derived from it. */
  private carries(
    fn: ts.SignatureDeclaration,
    parameter: ts.ParameterDeclaration,
    depth = 0,
    fields: ReadonlySet<string> = new Set(['authz']),
  ): boolean {
    const body = 'body' in fn ? fn.body : undefined;
    if (!body) return false;
    if (depth > 8) return true;
    // A direct argument reaches the call result only if the callee may return that parameter.
    const passedThrough = (identifier: ts.Node): boolean => {
      let argument: ts.Node = identifier;
      while (
        ts.isParenthesizedExpression(argument.parent) ||
        ts.isAsExpression(argument.parent) ||
        ts.isNonNullExpression(argument.parent)
      )
        argument = argument.parent;
      const call = argument.parent;
      if (
        !ts.isCallExpression(call) ||
        !call.arguments.includes(argument as ts.Expression)
      )
        return true;
      const index = call.arguments.indexOf(argument as ts.Expression);
      const invocations = this.invocations(call);
      return (
        !invocations.length ||
        invocations.some((invocation) => {
          const target = invocation.fn.parameters[index];
          return (
            !!target &&
            new StaticValues(
              this.analysis,
              invocation.bindings,
              this.captures,
              this.activeCalls,
              this.expandServices,
            ).carries(invocation.fn, target, depth + 1, fields)
          );
        })
      );
    };
    const derived = new Set<ts.Declaration>([parameter]);
    // A method call on the context returns its own result (a decision, a policy), except `get('authz')`.
    const methodReceiver = (identifier: ts.Node): boolean => {
      const access = identifier.parent;
      if (
        !ts.isPropertyAccessExpression(access) ||
        access.expression !== identifier
      )
        return false;
      const call = access.parent;
      if (!ts.isCallExpression(call) || call.expression !== access)
        return false;
      const key = call.arguments[0];
      return !(
        access.name.text === 'get' &&
        key &&
        ts.isStringLiteralLike(key) &&
        key.text === 'authz'
      );
    };
    // Reading a field that does not hold the context yields that field's value.
    const otherField = (identifier: ts.Node): boolean => {
      const access = identifier.parent;
      return (
        ts.isPropertyAccessExpression(access) &&
        access.expression === identifier &&
        !fields.has(access.name.text) &&
        !(
          ts.isCallExpression(access.parent) &&
          access.parent.expression === access
        )
      );
    };
    const mentions = (node: ts.Node): boolean => {
      let found = false;
      const visit = (child: ts.Node): void => {
        if (found) return;
        if (
          ts.isIdentifier(child) &&
          this.analysis
            .declarations(child)
            .some((declaration) => derived.has(declaration))
        ) {
          // Reads of fields that hold the context still denote it; judge the use of the outermost such read.
          let expression: ts.Node = child;
          while (
            ts.isPropertyAccessExpression(expression.parent) &&
            expression.parent.expression === expression &&
            fields.has(expression.parent.name.text)
          )
            expression = expression.parent;
          if (
            !methodReceiver(expression) &&
            !otherField(expression) &&
            passedThrough(expression)
          )
            found = true;
        } else ts.forEachChild(child, visit);
      };
      visit(node);
      return found;
    };
    const returns: ts.Node[] = [];
    const visit = (child: ts.Node): void => {
      if (ts.isFunctionLike(child)) return;
      if (
        ts.isVariableDeclaration(child) &&
        child.initializer &&
        mentions(child.initializer)
      )
        derived.add(child);
      if (ts.isReturnStatement(child) && child.expression)
        returns.push(child.expression);
      ts.forEachChild(child, visit);
    };
    if (ts.isBlock(body)) visit(body);
    else returns.push(body);
    return returns.some(mentions);
  }

  /** Object literals an expression denotes: itself, a const or bound alias, or every return of a local call. */
  private returnedObjects(
    node: ts.Node,
    seen: Set<ts.Node>,
  ): (readonly [ts.ObjectLiteralExpression, StaticValues])[] {
    if (seen.has(node) || seen.size >= MAX_VALUES) return [];
    seen = new Set(seen).add(node);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return this.returnedObjects(node.expression, seen);
    if (ts.isObjectLiteralExpression(node)) return [[node, this]];
    if (ts.isIdentifier(node)) {
      const declarations = this.analysis.declarations(node);
      if (declarations.length !== 1 || this.mutated(declarations[0])) return [];
      const declaration = declarations[0];
      if (ts.isParameter(declaration)) {
        const bound = this.bindings.get(declaration) ?? [];
        const objects = bound.map((value) => this.returnedObjects(value, seen));
        return objects.length && objects.every((items) => items.length)
          ? objects.flat()
          : [];
      }
      return ts.isVariableDeclaration(declaration) &&
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const
        ? this.returnedObjects(declaration.initializer, seen)
        : [];
    }
    if (!ts.isCallExpression(node) || node.questionDotToken) return [];
    const result: (readonly [ts.ObjectLiteralExpression, StaticValues])[] = [];
    const invocations = this.invocations(node);
    if (!invocations.length) return [];
    for (const invocation of invocations) {
      const fn = invocation.fn as ts.FunctionLikeDeclaration;
      if (
        !fn.body ||
        ts.getModifiers(fn)?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
      )
        return [];
      const evaluator = new StaticValues(
        this.analysis,
        invocation.bindings,
        this.captures,
        this.activeCalls,
        this.expandServices,
      );
      const returns: ts.Expression[] = [];
      let bare = false;
      if (!ts.isBlock(fn.body)) returns.push(fn.body);
      else {
        const visit = (child: ts.Node): void => {
          if (ts.isFunctionLike(child)) return;
          if (ts.isReturnStatement(child)) {
            if (child.expression) returns.push(child.expression);
            else bare = true;
          }
          ts.forEachChild(child, visit);
        };
        visit(fn.body);
      }
      if (bare || !returns.length) return [];
      for (const expression of returns) {
        const objects = evaluator.returnedObjects(expression, seen);
        if (!objects.length) return [];
        result.push(...objects);
      }
    }
    return result;
  }

  /**
   * PROPOSAL (needs approval). Hono 4.13.2 request reads on the first parameter of a handler registered on an
   * identified router (directly or through bound helper parameters), each proven separately:
   * - `query(key?)`: `getQueryParam(url, key)`; every decode goes through `tryDecode`, which catches.
   * - `param(key?)`: the route match's stored values, decoded through `tryDecodeURIComponent`; an absent key is
   *   `undefined`.
   * - `header()` iterates `raw.headers`; `header(name)` calls `raw.headers.get(name)`, which throws a TypeError for
   *   an invalid header name, so a name must be '' (the no-argument branch) or an RFC 9110 token.
   * A key must be one proven string: a literal, an unwritten const alias, or a local call with a single string result.
   */
  private stableKeySource(node: ts.Node, seen = new Set<ts.Node>()): boolean {
    if (seen.has(node) || seen.size >= 64) return false;
    const next = new Set(seen).add(node);
    if (ts.isIdentifier(node)) {
      for (const declaration of this.analysis.declarations(node)) {
        if (ts.isVariableDeclaration(declaration)) {
          if (
            !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) ||
            this.mutated(declaration) ||
            this.analysis.hasBindingWrites(declaration)
          )
            return false;
          if (
            declaration.initializer &&
            !this.stableKeySource(declaration.initializer, next)
          )
            return false;
        }
      }
    }
    if (ts.isCallExpression(node)) {
      for (const invocation of this.invocations(node)) {
        const body = 'body' in invocation.fn ? invocation.fn.body : undefined;
        if (body && !this.stableKeySource(body, next)) return false;
      }
    }
    let stable = true;
    ts.forEachChild(node, (child) => {
      if (
        stable &&
        !(
          ts.isIdentifier(child) &&
          ((ts.isPropertyAccessExpression(node) && child === node.name) ||
            ('name' in node && child === node.name))
        )
      )
        stable = this.stableKeySource(child, next);
    });
    return stable;
  }

  private requestRead(node: ts.CallExpression): boolean {
    if (
      node.questionDotToken ||
      node.arguments.length > 1 ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.questionDotToken ||
      !['query', 'param', 'header'].includes(node.expression.name.text) ||
      !ts.isPropertyAccessExpression(node.expression.expression) ||
      node.expression.expression.questionDotToken ||
      node.expression.expression.name.text !== 'req'
    )
      return false;
    const argument = node.arguments[0];
    if (argument) {
      if (ts.isSpreadElement(argument)) return false;
      // Only syntax whose single value cannot change after it is proven.
      if (ts.isIdentifier(argument)) {
        const declarations = this.analysis.declarations(argument);
        const declaration = declarations[0];
        if (
          declarations.length !== 1 ||
          !ts.isVariableDeclaration(declaration) ||
          !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) ||
          this.mutated(declaration)
        )
          return false;
      } else if (
        !ts.isStringLiteralLike(argument) &&
        !ts.isCallExpression(argument)
      )
        return false;
      if (!this.stableKeySource(argument)) return false;
      const keys = this.strings(argument);
      if (keys.length !== 1) return false;
      if (
        node.expression.name.text === 'header' &&
        keys[0] !== '' &&
        /[^!#$%&'*+\-.^_`|~0-9A-Za-z]/.test(keys[0])
      )
        return false;
    }
    const handlerParameter = (
      identifier: ts.Node,
      seen: Set<ts.Node>,
    ): boolean => {
      if (
        seen.has(identifier) ||
        seen.size >= MAX_VALUES ||
        !ts.isIdentifier(identifier)
      )
        return false;
      seen = new Set(seen).add(identifier);
      const declarations = this.analysis.declarations(identifier);
      if (declarations.length !== 1 || !ts.isParameter(declarations[0]))
        return false;
      const parameter = declarations[0];
      if (this.mutated(parameter)) return false;
      const bound = this.bindings.get(parameter);
      if (bound)
        return (
          !!bound.length &&
          bound.every((value) => handlerParameter(value, seen))
        );
      return (
        parameter.parent.parameters[0] === parameter &&
        this.analysis.routeHandlers.has(parameter.parent)
      );
    };
    return handlerParameter(node.expression.expression.expression, new Set());
  }

  /** The proven context's own `get('authz')` read, or its `authorize(request)` decision. */
  private authorizationCall(node: ts.CallExpression): boolean {
    if (!this.analysis.authorizationIdentityResolved) return false;
    if (this.authorizationContext(node)) return true;
    return (
      !node.questionDotToken &&
      node.arguments.length === 1 &&
      !ts.isSpreadElement(node.arguments[0]) &&
      ts.isPropertyAccessExpression(node.expression) &&
      !node.expression.questionDotToken &&
      node.expression.name.text === 'authorize' &&
      this.authorizationContext(node.expression.expression)
    );
  }

  private global(node: ts.Node): string | undefined {
    // An unresolved import still has an alias symbol; only a name with no symbol at all is a global.
    return ts.isIdentifier(node) && !this.analysis.symbol(node)
      ? node.text
      : undefined;
  }

  /** `principal.id` / `principal.type` of the proven context's `identity.principal`: strings by the official contract. */
  private principalString(node: ts.Node, seen = new Set<ts.Node>()): boolean {
    if (seen.has(node) || seen.size >= MAX_VALUES) return false;
    seen = new Set(seen).add(node);
    if (
      !ts.isPropertyAccessExpression(node) ||
      node.questionDotToken ||
      !['id', 'type'].includes(node.name.text)
    )
      return false;
    let principal: ts.Node = node.expression;
    while (ts.isIdentifier(principal)) {
      const declarations = this.analysis.declarations(principal);
      const declaration = declarations[0];
      if (
        declarations.length !== 1 ||
        !ts.isVariableDeclaration(declaration) ||
        !ts.isIdentifier(declaration.name) ||
        !declaration.initializer ||
        !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) ||
        this.mutated(declaration) ||
        seen.has(declaration)
      )
        return false;
      seen.add(declaration);
      principal = declaration.initializer;
    }
    return (
      ts.isPropertyAccessExpression(principal) &&
      !principal.questionDotToken &&
      principal.name.text === 'principal' &&
      ts.isPropertyAccessExpression(principal.expression) &&
      !principal.expression.questionDotToken &&
      principal.expression.name.text === 'identity' &&
      this.analysis.authorizationIdentityResolved &&
      this.authorizationContext(principal.expression.expression)
    );
  }

  private static unwrap(node: ts.Node): ts.Node {
    while (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node)
    )
      node = node.expression;
    return node;
  }

  /** A primitive literal, or a const whose initializer is one (a primitive binding cannot be changed). */
  private closedPrimitive(node: ts.Node): boolean {
    node = StaticValues.unwrap(node);
    if (
      ts.isStringLiteralLike(node) ||
      ts.isNumericLiteral(node) ||
      [
        ts.SyntaxKind.TrueKeyword,
        ts.SyntaxKind.FalseKeyword,
        ts.SyntaxKind.NullKeyword,
      ].includes(node.kind)
    )
      return true;
    if (!ts.isIdentifier(node)) return false;
    const declarations = this.analysis.declarations(node);
    const declaration = declarations[0];
    return (
      declarations.length === 1 &&
      ts.isVariableDeclaration(declaration) &&
      ts.isIdentifier(declaration.name) &&
      !!declaration.initializer &&
      !!(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) &&
      !ts.isIdentifier(StaticValues.unwrap(declaration.initializer)) &&
      this.closedPrimitive(declaration.initializer)
    );
  }

  /**
   * An object literal of plain properties with closed primitive values, directly or through a local, non-exported
   * const that is never written and is only read (`x.k`, `x[k]`) or passed to `Object.keys/values/entries`; no
   * getters, setters, spreads, methods or computed keys.
   */
  private closedRecord(node: ts.Node): boolean {
    let cache = CLOSED_RECORDS.get(this.analysis);
    if (!cache) CLOSED_RECORDS.set(this.analysis, (cache = new WeakMap()));
    const known = cache.get(node);
    if (known !== undefined) return known;
    const result = this.closedRecordUncached(node);
    cache.set(node, result);
    return result;
  }

  private closedRecordUncached(node: ts.Node): boolean {
    node = StaticValues.unwrap(node);
    const literal = (n: ts.Node): boolean =>
      ts.isObjectLiteralExpression(n) &&
      n.properties.every(
        (p) =>
          ts.isPropertyAssignment(p) &&
          !ts.isComputedPropertyName(p.name) &&
          this.closedPrimitive(p.initializer),
      );
    if (literal(node)) return true;
    if (!ts.isIdentifier(node)) return false;
    const declarations = this.analysis.declarations(node);
    const declaration = declarations[0];
    if (
      declarations.length !== 1 ||
      !ts.isVariableDeclaration(declaration) ||
      !ts.isIdentifier(declaration.name) ||
      !declaration.initializer ||
      !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) ||
      this.analysis.isExported(declaration) ||
      !literal(StaticValues.unwrap(declaration.initializer)) ||
      this.mutated(declaration)
    )
      return false;
    let scope: ts.Node = declaration.parent;
    while (!ts.isFunctionLike(scope) && !ts.isSourceFile(scope))
      scope = scope.parent;
    let closed = true;
    const visit = (child: ts.Node): void => {
      if (!closed) return;
      if (
        ts.isIdentifier(child) &&
        child.parent !== declaration &&
        this.analysis.declarations(child).includes(declaration)
      ) {
        let use: ts.Node = child;
        while (
          ts.isParenthesizedExpression(use.parent) ||
          ts.isAsExpression(use.parent) ||
          ts.isNonNullExpression(use.parent)
        )
          use = use.parent;
        const parent = use.parent;
        const read =
          (ts.isPropertyAccessExpression(parent) ||
            ts.isElementAccessExpression(parent)) &&
          parent.expression === use &&
          !(
            ts.isCallExpression(parent.parent) &&
            parent.parent.expression === parent
          );
        const inspected =
          ts.isCallExpression(parent) &&
          parent.arguments.length === 1 &&
          parent.arguments[0] === use &&
          ts.isPropertyAccessExpression(parent.expression) &&
          this.global(parent.expression.expression) === 'Object' &&
          ['keys', 'values', 'entries'].includes(parent.expression.name.text);
        if (!read && !inspected) closed = false;
      }
    };
    walk(scope, (child) => {
      visit(child);
      return closed;
    });
    return closed;
  }

  /** Whether reading `name` (or any key, when unknown) from this receiver can run an accessor. */
  private readsAccessor(receiver: ts.Node, name: string | undefined): boolean {
    // Values are syntax of the analysed sources: no accessor of that name anywhere means none can run.
    const index = accessorIndex(this.analysis);
    if (
      !index.computed &&
      (name === undefined ? !index.names.size : !index.names.has(name))
    )
      return false;
    return this.values(receiver).some(
      (value) =>
        ts.isObjectLiteralExpression(value) &&
        value.properties.some(
          (property) =>
            (ts.isGetAccessorDeclaration(property) ||
              ts.isSetAccessorDeclaration(property)) &&
            (name === undefined ||
              ts.isComputedPropertyName(property.name) ||
              ((ts.isIdentifier(property.name) ||
                ts.isStringLiteralLike(property.name)) &&
                property.name.text === name)),
        ),
    );
  }

  private intrinsic(node: ts.CallExpression | ts.NewExpression): boolean {
    if (this.closedGuard(node) !== undefined) return true;
    if (
      ts.isCallExpression(node) &&
      !node.questionDotToken &&
      this.global(node.expression) === 'String' &&
      node.arguments.length === 1 &&
      this.principalString(node.arguments[0])
    )
      return true;
    const primitive = (n: ts.Node): boolean => this.closedPrimitive(n);
    const record = (n: ts.Node): boolean => this.closedRecord(n);
    const array = (n: ts.Node): boolean =>
      ts.isArrayLiteralExpression(n) && n.elements.every(primitive);
    const args = node.arguments ?? [];
    if (ts.isCallExpression(node) && node.questionDotToken) return false;
    const callee = node.expression;
    if (ts.isNewExpression(node)) {
      if (this.global(callee) === 'Error') return args.every(primitive);
      if (this.global(callee) === 'Map' && args.length === 0) return true;
      if (this.global(callee) !== 'Set') return false;
      return (
        args.length === 0 ||
        (args.length === 1 &&
          (array(args[0]) ||
            (ts.isCallExpression(args[0]) &&
              ts.isPropertyAccessExpression(args[0].expression) &&
              this.global(args[0].expression.expression) === 'Object' &&
              args[0].expression.name.text === 'values' &&
              args[0].arguments.length === 1 &&
              record(args[0].arguments[0]))))
      );
    }
    if (ts.isIdentifier(callee))
      return (
        [
          'String',
          'Number',
          'Boolean',
          'isNaN',
          'isFinite',
          'parseInt',
          'parseFloat',
        ].includes(this.global(callee) ?? '') && args.every(primitive)
      );
    if (!ts.isPropertyAccessExpression(callee) || callee.questionDotToken)
      return false;
    const owner = this.global(callee.expression),
      name = callee.name.text;
    if (owner === 'Object' && ['keys', 'values', 'entries'].includes(name))
      return args.length === 1 && record(args[0]);
    if (owner === 'Array' && ['isArray', 'of'].includes(name))
      return args.every(primitive);
    if (
      owner === 'Number' &&
      ['isFinite', 'isInteger', 'isNaN', 'isSafeInteger'].includes(name)
    )
      return args.every(primitive);
    if (
      owner === 'Math' &&
      [
        'abs',
        'min',
        'max',
        'round',
        'floor',
        'ceil',
        'trunc',
        'sqrt',
        'pow',
      ].includes(name)
    )
      return args.every(primitive);
    return owner === 'Date' && name === 'now' && args.length === 0;
  }

  /** `this.method()` from an instance member of the same class, as provider registration already follows it. */
  private ownMethods(node: ts.CallExpression): readonly ts.MethodDeclaration[] {
    const callee = node.expression;
    if (
      node.questionDotToken ||
      !ts.isPropertyAccessExpression(callee) ||
      callee.questionDotToken ||
      callee.expression.kind !== ts.SyntaxKind.ThisKeyword
    )
      return [];
    // Walk to the nearest non-arrow function; it must be an instance member of a class.
    let fn: ts.Node | undefined = node.parent;
    while (
      fn &&
      !(ts.isFunctionLike(fn) && !ts.isArrowFunction(fn)) &&
      !ts.isClassLike(fn)
    )
      fn = fn.parent;
    if (
      !fn ||
      !(ts.isMethodDeclaration(fn) || ts.isConstructorDeclaration(fn)) ||
      !ts.isClassLike(fn.parent) ||
      ts.getModifiers(fn)?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
    )
      return [];
    const cls = fn.parent;
    return this.analysis
      .declarations(callee)
      .filter(
        (declaration): declaration is ts.MethodDeclaration =>
          ts.isMethodDeclaration(declaration) &&
          !!declaration.body &&
          declaration.parent === cls &&
          !ts
            .getModifiers(declaration)
            ?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword),
      );
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
    if (!factories) {
      if (!this.analysis.externalService(node.arguments[0])) return [];
      const bindings = this.receiverBindings(node.expression.expression);
      if (!bindings) return [];
      this.capture(node, bindings, false);
      return [node];
    }
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
      new Map(this.localArrays),
    );
    const flow = evaluator.flow(body, seen, depth + 1);
    if (flow.unknown) return [];
    for (const value of flow.values)
      evaluator.capture(value, invocation.bindings);
    return [...new Set(flow.values)].slice(0, MAX_VALUES);
  }

  /**
   * `terminates`: every bounded path returns or throws, so the suffix is unreachable. `unknown`: the suffix may run,
   * but nothing proves it does; it is still checked for escapes and writes, and yields no new evidence.
   */
  public expressionBarrier(
    node: ts.Node,
  ): 'continues' | 'terminates' | 'unknown' {
    const flow = this.initialization(node, new Set(), 0);
    if (!flow.continues && flow.throws && !flow.unknown) return 'terminates';
    return flow.unknown || !flow.continues ? 'unknown' : 'continues';
  }

  public statementBarrier(
    node: ts.Node,
  ): 'continues' | 'terminates' | 'unknown' {
    const flow = this.flow(node, new Set(), 0);
    if (!flow.continues && (flow.returns || flow.throws)) return 'terminates';
    return flow.unknown || !flow.continues ? 'unknown' : 'continues';
  }

  /** `x = v`, `x += v`, `x ||= v`, ... */
  public static isAssignment(
    node: ts.Node,
  ): node is ts.AssignmentExpression<ts.AssignmentOperatorToken> {
    return (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    );
  }

  /**
   * The JavaScript order of one assignment, shared by the completion check and the evidence walk: the target's
   * receiver, then its key; for compound and logical forms the current value is read (running a getter); a logical
   * form reads only to decide whether the value runs; then the value; then the write (running a setter). Accessors
   * are listed with the bindings of the object that declares them; an unresolved key on an accessor object, or a
   * destructuring target, is unknown.
   */
  public assignmentSteps(
    node: ts.AssignmentExpression<ts.AssignmentOperatorToken>,
  ):
    | {
        receiver?: ts.Expression;
        key?: ts.Expression;
        getters: readonly { body: ts.Node; bindings: Bindings }[];
        valueReachable: boolean;
        setters: readonly {
          body: ts.Node;
          bindings: Bindings;
          parameter?: ts.ParameterDeclaration;
        }[];
      }
    | undefined {
    const operator = node.operatorToken.kind;
    const logical = [
      ts.SyntaxKind.BarBarEqualsToken,
      ts.SyntaxKind.AmpersandAmpersandEqualsToken,
      ts.SyntaxKind.QuestionQuestionEqualsToken,
    ].includes(operator);
    const reads = operator !== ts.SyntaxKind.EqualsToken;
    const target = StaticValues.unwrap(node.left);
    let receiver: ts.Expression | undefined;
    let key: ts.Expression | undefined;
    let name: string | undefined;
    if (ts.isIdentifier(target)) {
      // A const binding cannot be assigned; that write throws.
    } else if (
      ts.isPropertyAccessExpression(target) &&
      !target.questionDotToken
    ) {
      receiver = target.expression;
      name = target.name.text;
    } else if (
      ts.isElementAccessExpression(target) &&
      !target.questionDotToken
    ) {
      receiver = target.expression;
      key = target.argumentExpression;
      const keys = this.strings(key);
      name = keys.length === 1 ? keys[0] : undefined;
      if (name === undefined && this.readsAccessor(receiver, undefined))
        return undefined;
    } else return undefined;
    const accessors = (kind: 'get' | 'set') => {
      const found: {
        body: ts.Node;
        bindings: Bindings;
        parameter?: ts.ParameterDeclaration;
      }[] = [];
      if (receiver === undefined) return found;
      for (const value of this.values(receiver)) {
        if (!ts.isObjectLiteralExpression(value)) continue;
        for (const property of value.properties) {
          if (
            !(kind === 'get'
              ? ts.isGetAccessorDeclaration(property)
              : ts.isSetAccessorDeclaration(property))
          )
            continue;
          const accessor = property as ts.AccessorDeclaration;
          if (
            accessor.body &&
            (ts.isIdentifier(accessor.name) ||
              ts.isStringLiteralLike(accessor.name)) &&
            accessor.name.text === name
          )
            found.push({
              body: accessor.body,
              bindings: this.captures.get(value) ?? this.bindings,
              parameter: accessor.parameters[0],
            });
        }
      }
      return found;
    };
    if (
      receiver !== undefined &&
      name !== undefined &&
      this.values(receiver).some(
        (value) =>
          ts.isObjectLiteralExpression(value) &&
          value.properties.some(
            (property) =>
              (ts.isGetAccessorDeclaration(property) ||
                ts.isSetAccessorDeclaration(property)) &&
              ts.isComputedPropertyName(property.name),
          ),
      )
    )
      return undefined;
    let valueReachable = true;
    if (logical) {
      if (operator === ts.SyntaxKind.QuestionQuestionEqualsToken) {
        const current = this.values(target);
        if (
          current.length &&
          current.every(
            (value) =>
              ts.isObjectLiteralExpression(value) ||
              ts.isArrayLiteralExpression(value) ||
              ts.isFunctionLike(value) ||
              ts.isStringLiteralLike(value) ||
              ts.isNumericLiteral(value) ||
              value.kind === ts.SyntaxKind.TrueKeyword ||
              value.kind === ts.SyntaxKind.FalseKeyword,
          )
        )
          valueReachable = false;
      } else {
        const known = this.booleans(target);
        if (
          known.length === 1 &&
          ((operator === ts.SyntaxKind.BarBarEqualsToken && known[0]) ||
            (operator === ts.SyntaxKind.AmpersandAmpersandEqualsToken &&
              !known[0]))
        )
          valueReachable = false;
      }
    }
    return {
      receiver,
      key,
      getters: reads ? accessors('get') : [],
      valueReachable,
      // A logical form whose value does not run does not write either.
      setters: valueReachable ? accessors('set') : [],
    };
  }

  /** Whether every resolved receiver of this member assignment declares the written name only as an accessor. */
  public accessorOnlyWrite(
    node: ts.AssignmentExpression<ts.AssignmentOperatorToken>,
  ): boolean {
    const target = StaticValues.unwrap(node.left);
    let receiver: ts.Expression;
    let name: string | undefined;
    if (ts.isPropertyAccessExpression(target) && !target.questionDotToken) {
      receiver = target.expression;
      name = target.name.text;
    } else if (
      ts.isElementAccessExpression(target) &&
      !target.questionDotToken
    ) {
      receiver = target.expression;
      const keys = this.strings(target.argumentExpression);
      name = keys.length === 1 ? keys[0] : undefined;
    } else return false;
    if (name === undefined) return false;
    const values = this.values(receiver);
    return (
      values.length > 0 &&
      values.every((value) => {
        if (!ts.isObjectLiteralExpression(value)) return false;
        const named = value.properties.filter(
          (property) =>
            property.name &&
            (ts.isIdentifier(property.name) ||
              ts.isStringLiteralLike(property.name)) &&
            property.name.text === name,
        );
        return (
          named.length > 0 &&
          named.every(
            (property) =>
              ts.isGetAccessorDeclaration(property) ||
              ts.isSetAccessorDeclaration(property),
          ) &&
          !value.properties.some(
            (property) =>
              ts.isSpreadAssignment(property) ||
              (property.name !== undefined &&
                ts.isComputedPropertyName(property.name)),
          )
        );
      })
    );
  }

  /** Completion of one assignment in JavaScript order (see `assignmentSteps`). */
  private assignmentFlow(
    node: ts.AssignmentExpression<ts.AssignmentOperatorToken>,
    seen: ReadonlySet<ts.Node>,
    depth: number,
  ): Flow {
    const steps = this.assignmentSteps(node);
    if (!steps) return { ...CONTINUES, unknown: true };
    const target = StaticValues.unwrap(node.left);
    if (ts.isIdentifier(target)) {
      const declarations = this.analysis.declarations(target);
      if (
        declarations.length === 1 &&
        ts.isVariableDeclaration(declarations[0]) &&
        ts.getCombinedNodeFlags(declarations[0]) & ts.NodeFlags.Const
      )
        return {
          values: [],
          continues: false,
          returns: false,
          throws: true,
          unknown: false,
        };
    }
    let unknown = false;
    let throws = false;
    const step = (flow: Flow): Flow | undefined => {
      unknown ||= flow.unknown;
      throws ||= flow.throws;
      return flow.continues && !flow.unknown
        ? undefined
        : { ...flow, values: [], returns: false, unknown, throws };
    };
    const run = (accessor: {
      body: ts.Node;
      bindings: Bindings;
      parameter?: ts.ParameterDeclaration;
    }): Flow => {
      const bindings = new Map(accessor.bindings);
      if (accessor.parameter) bindings.set(accessor.parameter, [node.right]);
      const flow = new StaticValues(
        this.analysis,
        bindings,
        this.captures,
        this.activeCalls,
        this.expandServices,
      ).flow(accessor.body, new Set(seen), depth + 1);
      return {
        ...flow,
        continues: flow.continues || flow.returns,
        returns: false,
      };
    };
    for (const part of [steps.receiver, steps.key])
      if (part) {
        const stop = step(this.initialization(part, seen, depth));
        if (stop) return stop;
      }
    for (const getter of steps.getters) {
      const stop = step(run(getter));
      if (stop) return stop;
    }
    if (steps.valueReachable) {
      const stop = step(this.initialization(node.right, seen, depth));
      if (stop) return stop;
    }
    for (const setter of steps.setters) {
      const stop = step(run(setter));
      if (stop) return stop;
    }
    return { values: [], continues: true, returns: false, throws, unknown };
  }

  /** An expression statement that is not a direct call: an assignment in JavaScript order, otherwise its initialization. */
  private statementExpression(
    expression: ts.Expression,
    seen: ReadonlySet<ts.Node>,
    depth: number,
  ): Flow {
    const node = StaticValues.unwrap(expression);
    if (StaticValues.isAssignment(node))
      return this.assignmentFlow(node, seen, depth);
    return this.initialization(node, seen, depth);
  }

  /** Completion of one assignment for the evidence walk, in the same order as statements. */
  public assignmentBarrier(
    node: ts.AssignmentExpression<ts.AssignmentOperatorToken>,
  ): 'continues' | 'terminates' | 'unknown' {
    const flow = this.assignmentFlow(node, new Set(), 0);
    if (!flow.continues && flow.throws && !flow.unknown) return 'terminates';
    return flow.unknown || !flow.continues ? 'unknown' : 'continues';
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
    if (this.analysis.nativeInitialization.accepts(node, this))
      return {
        values: [node],
        continues: true,
        returns: false,
        throws: false,
        unknown: false,
      };
    const inputs = this.initializers(node.arguments, seen, depth + 1);
    if (inputs.unknown || !inputs.continues) return inputs;
    const finite = this.finiteArrayCall(node, seen, depth + 1);
    if (finite !== undefined) return finite;
    if (
      this.authorizationCall(node) ||
      this.requestRead(node) ||
      this.databaseAccessor(node)
    )
      return {
        values: [node],
        continues: true,
        returns: false,
        throws: false,
        unknown: false,
      };
    // Configuration reads retain an unknown value, but do not run application factories. Identify
    // the host application through its provider or route binding, never through a method name alone.
    if (this.configurationRead(node))
      return {
        values: [node],
        continues: true,
        returns: false,
        throws: false,
        unknown: false,
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
    const invocations: Invocation[] = [...evaluator.invocations(node)];
    // A provider's own helper method proves only that the call completes; its value stays opaque.
    const own = !invocations.length;
    if (own) {
      for (const fn of this.ownMethods(node)) {
        const bindings = new Map<ts.Declaration, readonly ts.Node[]>();
        for (const [index, parameter] of fn.parameters.entries()) {
          const argument = node.arguments[index];
          if (!argument && !parameter.initializer)
            return { ...CONTINUES, unknown: true };
          bindings.set(
            parameter,
            this.undefinedArgument(argument)
              ? [parameter.initializer!]
              : [argument],
          );
        }
        invocations.push({ fn, bindings });
      }
    }
    if (!invocations.length)
      return {
        values: [],
        continues: true,
        returns: false,
        throws: false,
        unknown: !this.intrinsic(node),
      };
    const values: ts.Node[] = [];
    let continues = false;
    let throws = false;
    let unknown = false;
    for (const invocation of invocations) {
      // A default runs when its argument is missing or evaluates to undefined; it must be proven like any eager input.
      if (
        invocation.fn.parameters.some(
          (parameter, index) =>
            parameter.initializer &&
            this.maybeUndefined(node.arguments[index]) &&
            (() => {
              const initialized = new StaticValues(
                this.analysis,
                invocation.bindings,
                this.captures,
                activeCalls,
                this.expandServices,
              ).initialization(parameter.initializer, seen, depth + 1);
              return initialized.unknown || !initialized.continues;
            })(),
        )
      ) {
        continues = true;
        unknown = true;
        continue;
      }
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
      values: own ? [] : values.slice(0, MAX_VALUES),
      continues,
      returns: false,
      throws,
      unknown,
    };
  }

  /** Immediate child expressions run before a call or an object value can be acquired. */
  private initializers(
    nodes: readonly ts.Node[],
    seen: ReadonlySet<ts.Node>,
    depth: number,
  ): Flow {
    let unknown = false;
    let throws = false;
    for (const node of nodes) {
      const flow = this.initialization(node, seen, depth + 1);
      unknown ||= flow.unknown;
      throws ||= flow.throws;
      if (!flow.continues)
        return { ...flow, values: [], returns: false, unknown, throws };
    }
    return { values: [], continues: true, returns: false, throws, unknown };
  }

  private initialization(
    node: ts.Node,
    seen: ReadonlySet<ts.Node>,
    depth: number,
  ): Flow {
    if (depth >= MAX_CALL_DEPTH || seen.has(node))
      return {
        values: [],
        continues: false,
        returns: false,
        throws: false,
        unknown: true,
      };
    // Leaf syntax has no eager children. Avoid allocating a child list and a
    // copied traversal set for every identifier and literal in repeated calls.
    if (
      ts.isIdentifier(node) ||
      ts.isLiteralExpression(node) ||
      node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword ||
      node.kind === ts.SyntaxKind.NullKeyword ||
      node.kind === ts.SyntaxKind.ThisKeyword ||
      node.kind === ts.SyntaxKind.SuperKeyword
    )
      return CONTINUES;
    if (
      (ts.isFunctionLike(node) &&
        !ts.isGetAccessorDeclaration(node) &&
        !ts.isSetAccessorDeclaration(node)) ||
      ts.isTypeNode(node)
    )
      return this.initializers(
        ts.isMethodDeclaration(node) && ts.isComputedPropertyName(node.name)
          ? [node.name.expression]
          : [],
        seen,
        depth + 1,
      );
    if (ts.isConditionalExpression(node)) {
      const condition = this.initialization(node.condition, seen, depth);
      if (!condition.continues || condition.unknown) return condition;
      const branches = this.booleans(node.condition);
      return this.initializers(
        branches.length === 1
          ? [branches[0] ? node.whenTrue : node.whenFalse]
          : [node.whenTrue, node.whenFalse],
        seen,
        depth - 1,
      );
    }
    // A declared or imported constructor keeps the existing argument-only rule; an undeclared global must be a listed intrinsic.
    if (
      ts.isNewExpression(node) &&
      this.global(node.expression) !== undefined &&
      !this.intrinsic(node)
    )
      return { ...CONTINUES, unknown: true };
    if (ts.isSpreadElement(node) || ts.isSpreadAssignment(node)) {
      const values = this.values(node.expression);
      if (
        values.length !== 1 ||
        !(
          ts.isArrayLiteralExpression(values[0]) ||
          ts.isObjectLiteralExpression(values[0])
        )
      )
        return {
          values: [],
          continues: true,
          returns: false,
          throws: false,
          unknown: true,
        };
      if (this.readsAccessor(node.expression, undefined))
        return { ...CONTINUES, unknown: true };
      return this.initialization(values[0], new Set(seen).add(node), depth + 1);
    }
    // Creating an accessor runs only its computed key; its body runs when the property is read.
    if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node))
      return this.initializers(
        ts.isComputedPropertyName(node.name) ? [node.name.expression] : [],
        seen,
        depth - 1,
      );
    if (
      (ts.isPropertyAccessExpression(node) &&
        this.readsAccessor(node.expression, node.name.text)) ||
      (ts.isElementAccessExpression(node) &&
        this.readsAccessor(
          node.expression,
          ts.isStringLiteralLike(node.argumentExpression)
            ? node.argumentExpression.text
            : undefined,
        ))
    )
      return { ...CONTINUES, unknown: true };
    if (
      ts.isDeleteExpression(node) ||
      (ts.isBinaryExpression(node) &&
        node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
      ((ts.isPrefixUnaryExpression(node) ||
        ts.isPostfixUnaryExpression(node)) &&
        [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
          node.operator,
        ))
    )
      return {
        values: [],
        continues: true,
        returns: false,
        throws: false,
        unknown: true,
      };
    const target = ts.isExpression(node)
      ? this.expressionCall(node)
      : undefined;
    if (target)
      return this.callFlow(target.call, seen, depth + 1, target.awaited);
    // Short-circuit operands run only when the left value does not decide the result, as the evidence walk visits them.
    if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind)
    ) {
      const left = this.initialization(node.left, seen, depth);
      if (!left.continues || left.unknown) return left;
      const operator = node.operatorToken.kind;
      const known = this.booleans(node.left);
      if (
        known.length === 1 &&
        ((operator === ts.SyntaxKind.AmpersandAmpersandToken && !known[0]) ||
          (operator === ts.SyntaxKind.BarBarToken && known[0]))
      )
        return left;
      if (operator === ts.SyntaxKind.QuestionQuestionToken) {
        const values = this.values(node.left);
        if (
          values.length &&
          values.every(
            (value) =>
              ts.isObjectLiteralExpression(value) ||
              ts.isArrayLiteralExpression(value) ||
              ts.isFunctionLike(value) ||
              ts.isStringLiteralLike(value) ||
              ts.isNumericLiteral(value) ||
              value.kind === ts.SyntaxKind.TrueKeyword ||
              value.kind === ts.SyntaxKind.FalseKeyword,
          )
        )
          return left;
      }
      return this.initializers(
        [node.right],
        new Set(seen).add(node),
        depth - 1,
      );
    }
    // Every nested expression still runs before the value is acquired; syntax nesting does not consume the call depth.
    const children = childrenOf(node);
    if (!children.length) return CONTINUES;
    return this.initializers(children, new Set(seen).add(node), depth - 1);
  }

  /** Constructing a query on the identified host database does not execute it. Its value stays opaque. */
  private databaseAccessor(node: ts.CallExpression): boolean {
    if (
      node.questionDotToken ||
      node.arguments.length !== 0 ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.questionDotToken ||
      node.expression.name.text !== 'query'
    )
      return false;
    return this.databaseIdentity(node.expression.expression, new Set(), true);
  }

  /** Database provenance follows invocation captures as well as the value returned by a local helper. */
  public databaseIdentity(
    value: ts.Node,
    seen: Set<ts.Node> = new Set(),
    strict: boolean = false,
  ): boolean {
    if (seen.has(value) || seen.size >= MAX_VALUES) return false;
    const next = new Set(seen).add(value);
    if (
      ts.isIdentifier(value) &&
      this.analysis
        .declarations(value)
        .some((declaration) => this.mutated(declaration))
    )
      return false;
    const scope = this.captures.get(value);
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
    if (
      ts.isCallExpression(value) &&
      !value.questionDotToken &&
      ts.isPropertyAccessExpression(value.expression) &&
      !value.expression.questionDotToken
    ) {
      if (
        value.expression.name.text === 'resolve' &&
        value.arguments.length === 1
      )
        return (
          this.analysis.externalService(value.arguments[0]) ===
            '@nocobase/db' &&
          (!strict || evaluator.containerIdentity(value.expression.expression))
        );
      if (
        ['connection', 'query', 'repository'].includes(
          value.expression.name.text,
        )
      )
        return evaluator.databaseIdentity(
          value.expression.expression,
          next,
          strict,
        );
    }
    if (
      ts.isPropertyAccessExpression(value) &&
      !value.questionDotToken &&
      value.name.text === 'query'
    )
      return evaluator.databaseIdentity(value.expression, next, strict);
    const values = evaluator.values(value);
    return (
      values.length > 0 &&
      values.every(
        (candidate) =>
          candidate !== value &&
          evaluator.databaseIdentity(candidate, next, strict),
      )
    );
  }

  private receiverBindings(
    receiver: ts.Node,
  ): Map<ts.Declaration, readonly ts.Node[]> | undefined {
    const bindings = new Map<ts.Declaration, readonly ts.Node[]>();
    const seen = new Set<ts.Node>();
    const pending = [receiver];
    while (pending.length) {
      const node = pending.pop()!;
      if (seen.has(node)) continue;
      if (seen.size >= 1024) return undefined;
      seen.add(node);
      const declarations = [...this.analysis.declarations(node)];
      if (node.kind === ts.SyntaxKind.ThisKeyword) {
        let owner: ts.Node | undefined = node.parent;
        while (owner && !ts.isClassLike(owner)) owner = owner.parent;
        if (owner && ts.isClassLike(owner)) declarations.push(owner);
      }
      for (const declaration of declarations) {
        const values = this.bindings.get(declaration);
        if (values) {
          bindings.set(declaration, values);
          pending.push(...values);
        } else if (
          ts.isVariableDeclaration(declaration) &&
          declaration.initializer
        )
          pending.push(declaration.initializer);
      }
      ts.forEachChild(node, (child) => {
        pending.push(child);
      });
    }
    return bindings;
  }

  private containerIdentity(
    value: ts.Node,
    seen = new Set<ts.Node>(),
  ): boolean {
    if (seen.has(value) || seen.size >= MAX_VALUES) return false;
    const next = new Set(seen).add(value);
    if (
      ts.isPropertyAccessExpression(value) &&
      !value.questionDotToken &&
      value.name.text === 'container'
    )
      return this.applicationIdentity(value.expression);
    if (ts.isIdentifier(value)) {
      const declarations = this.analysis.declarations(value);
      if (declarations.length !== 1) return false;
      const declaration = declarations[0];
      if (
        this.mutated(declaration) ||
        this.analysis.hasBindingWrites(declaration)
      )
        return false;
      const bound = this.bindings.get(declaration);
      if (bound)
        return bound.length === 1 && this.containerIdentity(bound[0], next);
      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer &&
        ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const
      )
        return this.containerIdentity(declaration.initializer, next);
    }
    const values = this.values(value);
    return (
      values.length === 1 &&
      values[0] !== value &&
      this.containerIdentity(values[0], next)
    );
  }

  private configurationRead(node: ts.CallExpression): boolean {
    if (
      node.questionDotToken ||
      node.arguments.length !== 1 ||
      !ts.isStringLiteralLike(node.arguments[0]) ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.questionDotToken ||
      node.expression.name.text !== 'get'
    )
      return false;
    const config = node.expression.expression;
    if (
      !ts.isPropertyAccessExpression(config) ||
      config.questionDotToken ||
      config.name.text !== 'config'
    )
      return false;
    return this.applicationIdentity(config.expression);
  }

  private applicationIdentity(
    value: ts.Node,
    seen = new Set<ts.Node>(),
  ): boolean {
    if (seen.has(value) || seen.size >= MAX_VALUES) return false;
    const next = new Set(seen).add(value);
    if (
      ts.isPropertyAccessExpression(value) &&
      !value.questionDotToken &&
      value.name.text === 'app' &&
      value.expression.kind === ts.SyntaxKind.ThisKeyword
    ) {
      let owner: ts.Node | undefined = value.parent;
      while (owner && !ts.isClassLike(owner)) {
        if (
          ts.isFunctionDeclaration(owner) ||
          ts.isFunctionExpression(owner) ||
          (ts.canHaveModifiers(owner) &&
            ts
              .getModifiers(owner)
              ?.some(
                (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
              ))
        )
          return false;
        owner = owner.parent;
      }
      return (
        !!owner &&
        ts.isClassLike(owner) &&
        !!owner.heritageClauses?.some(
          (clause) =>
            clause.token === ts.SyntaxKind.ExtendsKeyword &&
            clause.types.some((type) =>
              importedContract(
                type.expression,
                this.analysis,
                '@nocobase/service-provider',
                'ServiceProvider',
              ),
            ),
        )
      );
    }
    return this.analysis.declarations(value).some((declaration) => {
      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer &&
        ts.isVariableDeclarationList(declaration.parent) &&
        declaration.parent.flags & ts.NodeFlags.Const
      )
        return this.applicationIdentity(declaration.initializer, next);
      if (!ts.isParameter(declaration)) return false;
      const bound = this.bindings.get(declaration);
      if (bound)
        return bound.length === 1 && this.applicationIdentity(bound[0], next);
      const fn = declaration.parent;
      return (
        ts.isArrowFunction(fn) &&
        fn.parameters[0] === declaration &&
        ts.isCallExpression(fn.parent) &&
        fn.parent.arguments[0] === fn &&
        importedContract(
          fn.parent.expression,
          this.analysis,
          '@nocobase/app-server/router',
          'defineApiRoutes',
        )
      );
    });
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
      const initialized = this.initialization(node, seen, depth + 1);
      return {
        ...initialized,
        values:
          initialized.continues && !initialized.unknown
            ? this.values(node, new Set(seen))
            : [],
        continues: false,
        returns: initialized.continues,
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
      const initialized =
        !target && node.expression
          ? this.initialization(node.expression, nextSeen, depth + 1)
          : undefined;
      return {
        values:
          (initialized && (!initialized.continues || initialized.unknown)
            ? []
            : undefined) ??
          call?.values ??
          (node.expression
            ? this.values(node.expression, new Set(nextSeen))
            : []),
        continues: false,
        returns: call?.continues ?? initialized?.continues ?? true,
        throws: call?.throws ?? initialized?.throws ?? false,
        unknown: call?.unknown ?? initialized?.unknown ?? false,
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
        // Destructuring reads the named properties, running any accessor behind them.
        if (
          ts.isObjectBindingPattern(declaration.name) &&
          declaration.name.elements.some((element) => {
            const key = element.propertyName ?? element.name;
            return (
              element.dotDotDotToken ||
              this.readsAccessor(
                declaration.initializer!,
                ts.isIdentifier(key) || ts.isStringLiteralLike(key)
                  ? key.text
                  : undefined,
              )
            );
          }) &&
          this.readsAccessor(declaration.initializer, undefined)
        )
          return { ...CONTINUES, unknown: true, returns: false };
        const flow = this.initialization(
          declaration.initializer,
          nextSeen,
          depth + 1,
        );
        throws ||= flow.throws;
        unknown ||= flow.unknown;
        if (!flow.continues) return { ...flow, returns: false };
        if (
          ts.isObjectBindingPattern(declaration.name) &&
          declaration.name.elements.some(
            (element) =>
              element.dotDotDotToken && this.values(element).length !== 1,
          )
        )
          return { ...CONTINUES, unknown: true };
        if (
          !flow.unknown &&
          ts.isArrayLiteralExpression(declaration.initializer) &&
          this.finiteOwner(declaration.initializer) &&
          declaration.initializer.elements.every(
            (element) =>
              !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
          )
        )
          this.localArrays.set(declaration, [
            ...declaration.initializer.elements,
          ]);
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
      // A statement that is not a direct call still runs its operands: its completion is theirs.
      const completion = this.statementExpression(
        node.expression,
        nextSeen,
        depth + 1,
      );
      if (completion.unknown || !completion.continues)
        return { ...completion, values: [], returns: false };
    }
    if (
      ts.isExpressionStatement(node) &&
      this.analysis.nativeInitialization.containsCall(node.expression)
    )
      return {
        values: [],
        continues: true,
        returns: false,
        throws: false,
        unknown: true,
      };
    if (ts.isIfStatement(node)) {
      // The condition is evaluated before either branch. An opaque call, getter
      // or terminating constructor there cannot be erased by branch selection.
      const condition = this.initialization(
        node.expression,
        nextSeen,
        depth + 1,
      );
      if (condition.unknown || !condition.continues)
        return { ...condition, values: [], returns: false };
      const branches = this.booleans(node.expression);
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
      if (this.localArrays.size) {
        let writes = false;
        walk(node, (child) => {
          if (
            ts.isCallExpression(child) &&
            ts.isPropertyAccessExpression(child.expression) &&
            child.expression.name.text === 'push'
          )
            writes = true;
          return !writes;
        });
        if (writes) return { ...CONTINUES, unknown: true };
      }
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
        (this.localArrays.size > 0 && arrays.length !== 1) ||
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

  /** A finite callback runs with its own bindings; a failed iteration cannot contribute a partial result. */
  private finiteArrayCall(
    node: ts.CallExpression,
    seen: ReadonlySet<ts.Node>,
    depth: number,
  ): Flow | undefined {
    if (
      !ts.isPropertyAccessExpression(node.expression) ||
      !['map', 'some', 'push'].includes(node.expression.name.text)
    )
      return undefined;
    const unknown = { ...CONTINUES, unknown: true };
    if (!accessorIndex(this.analysis).arrayMethodsIntact) return unknown;
    if (node.expression.name.text === 'push') {
      const declarations = this.analysis.declarations(
        node.expression.expression,
      );
      const declaration = declarations[0];
      if (
        node.questionDotToken ||
        node.expression.questionDotToken ||
        declarations.length !== 1 ||
        !declaration ||
        !ts.isVariableDeclaration(declaration)
      )
        return unknown;
      const elements = this.localArrays.get(declaration);
      if (!elements || elements.length + node.arguments.length > MAX_VALUES)
        return unknown;
      const appended = node.arguments.map((argument) =>
        ts.isSpreadElement(argument)
          ? undefined
          : this.materialize(argument, new Set()),
      );
      if (appended.some((value) => value === undefined)) return unknown;
      elements.push(...(appended as ts.Expression[]));
      return {
        ...CONTINUES,
        values: [
          this.origin(ts.factory.createNumericLiteral(elements.length), node),
        ],
      };
    }
    if (
      depth >= MAX_CALL_DEPTH ||
      node.questionDotToken ||
      node.expression.questionDotToken ||
      this.activeCalls.has(node) ||
      node.arguments.length !== 1 ||
      ts.isSpreadElement(node.arguments[0])
    )
      return unknown;
    const arrays = this.values(node.expression.expression, new Set(seen));
    const callbacks = this.values(node.arguments[0]);
    if (
      arrays.length !== 1 ||
      !ts.isArrayLiteralExpression(arrays[0]) ||
      arrays[0].elements.length > MAX_VALUES ||
      !this.finiteOwner(arrays[0]) ||
      arrays[0].elements.some(
        (element) =>
          ts.isSpreadElement(element) ||
          ts.isOmittedExpression(element) ||
          !this.ownedCandidate(element) ||
          !this.completeCandidate(element),
      ) ||
      callbacks.length !== 1 ||
      !ts.isFunctionLike(callbacks[0]) ||
      !ts.isFunctionLike(StaticValues.unwrap(node.arguments[0]))
    )
      return unknown;
    const fn = callbacks[0];
    if (
      !('body' in fn) ||
      !fn.body ||
      ('asteriskToken' in fn && fn.asteriskToken) ||
      ts
        .getModifiers(fn)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ||
      fn.parameters.length > 3 ||
      fn.parameters.some(
        (parameter) => parameter.dotDotDotToken || this.mutated(parameter),
      )
    )
      return unknown;
    let writes = false;
    walk(fn.body, (child) => {
      if (
        StaticValues.isAssignment(child) ||
        ts.isDeleteExpression(child) ||
        ((ts.isPrefixUnaryExpression(child) ||
          ts.isPostfixUnaryExpression(child)) &&
          [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
            child.operator,
          ))
      )
        writes = true;
      return !writes;
    });
    if (writes || !this.finiteCaptures(fn)) return unknown;
    const elements: ts.Expression[] = [];
    const active = new Set(this.activeCalls).add(node);
    for (const [index, element] of arrays[0].elements.entries()) {
      const bindings = new Map([
        ...this.bindings,
        ...(this.captures.get(fn) ?? []),
      ]);
      const args = [element, ts.factory.createNumericLiteral(index), arrays[0]];
      fn.parameters.forEach((parameter, position) =>
        bindings.set(parameter, [args[position]]),
      );
      const evaluator = new StaticValues(
        this.analysis,
        bindings,
        this.captures,
        active,
        this.expandServices,
        this.awaitReturns,
        new Map(this.localArrays),
      );
      const flow = evaluator.flow(fn.body, seen, depth + 1);
      if (flow.unknown || !flow.returns || flow.continues || flow.throws)
        return { ...flow, values: [], unknown: true };
      if (flow.values.length !== 1) return unknown;
      if (node.expression.name.text === 'some') {
        const truth = evaluator.booleans(flow.values[0]);
        if (truth.length !== 1) return unknown;
        if (truth[0])
          return { ...CONTINUES, values: [ts.factory.createTrue()] };
      } else {
        const value = evaluator.materialize(flow.values[0], new Set());
        if (!value) return unknown;
        elements.push(value);
      }
    }
    return {
      ...CONTINUES,
      values: [
        node.expression.name.text === 'some'
          ? ts.factory.createFalse()
          : this.origin(
              ts.factory.createArrayLiteralExpression(elements),
              node,
            ),
      ],
    };
  }

  /** A finite collection cannot be aliased, returned, passed out, or have its methods rewritten. */
  private finiteOwner(
    array: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression,
  ): boolean {
    let declaration = array.parent;
    while (
      declaration &&
      (ts.isParenthesizedExpression(declaration) ||
        ts.isAsExpression(declaration) ||
        ts.isSatisfiesExpression(declaration) ||
        ts.isNonNullExpression(declaration))
    )
      declaration = declaration.parent;
    if (!declaration || !ts.isVariableDeclaration(declaration)) return true;
    if (
      ts.isObjectLiteralExpression(array) &&
      ts.isObjectBindingPattern(declaration.name)
    )
      return true;
    if (
      !ts.isIdentifier(declaration.name) ||
      !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) ||
      this.analysis.isExported(declaration) ||
      this.mutated(declaration)
    )
      return false;
    let safe = true;
    walk(declaration.getSourceFile(), (node) => {
      if (
        ts.isIdentifier(node) &&
        node !== declaration.name &&
        this.analysis.declarations(node).includes(declaration)
      ) {
        const parent = node.parent;
        if (ts.isObjectLiteralExpression(array)) {
          safe =
            ts.isVariableDeclaration(parent) &&
            ts.isObjectBindingPattern(parent.name) &&
            parent.initializer === node;
        } else {
          safe =
            ts.isPropertyAccessExpression(parent) &&
            parent.expression === node &&
            ((parent.name.text === 'length' &&
              !ts.isCallExpression(parent.parent)) ||
              (['map', 'some', 'push'].includes(parent.name.text) &&
                ts.isCallExpression(parent.parent) &&
                parent.parent.expression === parent));
        }
      }
      return safe;
    });
    return safe;
  }

  private finiteCaptures(
    fn: ts.SignatureDeclaration,
    seen = new Set<ts.Node>(),
  ): boolean {
    if (seen.has(fn) || seen.size >= MAX_VALUES) return false;
    const next = new Set(seen).add(fn);
    let safe = true;
    let visits = 0;
    walk(fn, (node) => {
      if (++visits > 4096) safe = false;
      if (!safe || !ts.isIdentifier(node)) return safe;
      for (const declaration of this.analysis.declarations(node)) {
        let owner: ts.Node | undefined = declaration;
        while (owner && owner !== fn) owner = owner.parent;
        if (owner === fn) continue;
        if (
          ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration)
        ) {
          if (
            this.mutated(declaration) ||
            this.analysis.hasBindingWrites(declaration) ||
            (ts.isVariableDeclaration(declaration) &&
              !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const)) ||
            (ts.isParameter(declaration) && !this.bindings.has(declaration)) ||
            !this.ownedCandidate(declaration) ||
            !this.completeCandidate(declaration)
          )
            safe = false;
        } else if (
          ts.isFunctionDeclaration(declaration) &&
          !this.finiteCaptures(declaration, next)
        )
          safe = false;
      }
      return safe;
    });
    return safe;
  }

  private ownedCandidate(
    node: ts.Node,
    seen = new Set<ts.Node>(),
    budget = { remaining: 1024 },
  ): boolean {
    if (--budget.remaining < 0 || seen.has(node) || seen.size >= MAX_VALUES)
      return false;
    const next = new Set(seen).add(node);
    return this.values(node).every((value) => {
      if (ts.isObjectLiteralExpression(value))
        return (
          this.finiteOwner(value) &&
          value.properties.every((property) =>
            ts.isPropertyAssignment(property)
              ? this.ownedCandidate(property.initializer, next, budget)
              : ts.isShorthandPropertyAssignment(property)
                ? this.ownedCandidate(property.name, next, budget)
                : ts.isMethodDeclaration(property),
          )
        );
      if (ts.isArrayLiteralExpression(value))
        return (
          this.finiteOwner(value) &&
          value.elements.every((element) =>
            this.ownedCandidate(element, next, budget),
          )
        );
      return true;
    });
  }

  private origin<T extends ts.Node>(value: T, source: ts.Node): T {
    ts.setOriginalNode(value, source);
    (value as ts.Node & { parent: ts.Node }).parent = source.parent;
    return value;
  }

  /** Snapshot plain returned data before another iteration can bind the same callback parameters. */
  private materialize(
    node: ts.Node,
    seen: Set<ts.Node>,
    budget = { remaining: 1024 },
  ): ts.Expression | undefined {
    if (--budget.remaining < 0 || seen.has(node) || seen.size >= MAX_VALUES)
      return undefined;
    const values = this.values(node);
    if (values.length !== 1) return undefined;
    const value = values[0];
    const next = new Set(seen).add(node);
    if (ts.isObjectLiteralExpression(value)) {
      if (!this.finiteOwner(value)) return undefined;
      const properties: ts.ObjectLiteralElementLike[] = [];
      for (const property of value.properties) {
        if (
          !property.name ||
          !(
            ts.isIdentifier(property.name) ||
            ts.isStringLiteralLike(property.name)
          ) ||
          property.name.text === '__proto__' ||
          !(
            ts.isPropertyAssignment(property) ||
            ts.isShorthandPropertyAssignment(property)
          )
        )
          return undefined;
        const child = this.materialize(
          ts.isPropertyAssignment(property)
            ? property.initializer
            : property.name,
          next,
          budget,
        );
        if (!child) return undefined;
        properties.push(
          ts.factory.createPropertyAssignment(property.name, child),
        );
      }
      return this.origin(
        ts.factory.createObjectLiteralExpression(properties),
        value,
      );
    }
    if (ts.isArrayLiteralExpression(value)) {
      if (!this.finiteOwner(value)) return undefined;
      const elements = value.elements.map((element) =>
        this.materialize(element, next, budget),
      );
      return elements.every((element) => element !== undefined)
        ? this.origin(ts.factory.createArrayLiteralExpression(elements), value)
        : undefined;
    }
    // Functions retain the invocation that produced them, with a distinct node per iteration.
    if (ts.isArrowFunction(value)) {
      const fn = ts.factory.createArrowFunction(
        value.modifiers,
        value.typeParameters,
        value.parameters,
        value.type,
        value.equalsGreaterThanToken,
        value.body,
      );
      ts.setOriginalNode(fn, value);
      (fn as ts.Node & { parent: ts.Node }).parent = value.parent;
      this.captures.set(fn, this.snapshotBindings(this.bindings));
      return fn;
    }
    return ts.isExpression(value) && !ts.isFunctionLike(value)
      ? value
      : undefined;
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
    let cache = STABLE_BINDINGS.get(this.analysis);
    if (!cache) {
      cache = new WeakMap();
      STABLE_BINDINGS.set(this.analysis, cache);
    }
    const known = cache.get(declaration);
    if (known !== undefined) return known;
    const stable = this.computeStableBinding(declaration);
    cache.set(declaration, stable);
    return stable;
  }

  // This proof uses declaration identity and syntax only, never invocation bindings.
  private computeStableBinding(declaration: ts.VariableDeclaration): boolean {
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

  private sameValues(
    left: readonly ts.Node[],
    right: readonly ts.Node[],
  ): boolean {
    return (
      left.length === right.length &&
      left.every((value, index) => {
        const other = right[index];
        return (
          value === other ||
          (value.pos < 0 &&
            other.pos < 0 &&
            ts.isArrayLiteralExpression(value) &&
            ts.isArrayLiteralExpression(other) &&
            ts.getOriginalNode(value) === ts.getOriginalNode(other) &&
            value.elements.length === other.elements.length &&
            value.elements.every(
              (element, position) => element === other.elements[position],
            ))
        );
      })
    );
  }

  private sameCapture(
    previous: Bindings | undefined,
    incoming: Bindings,
  ): boolean {
    if (!previous || previous.size < incoming.size) return false;
    const entries = previous.entries();
    for (const [declaration, values] of incoming) {
      const entry = entries.next().value!;
      if (
        entry[0] !== declaration ||
        (entry[1].length !== 0 && !this.sameValues(entry[1], values))
      )
        return false;
    }
    return true;
  }

  private snapshotBindings(
    bindings: Bindings,
  ): Map<ts.Declaration, readonly ts.Node[]> {
    const snapshot = new Map(bindings);
    for (const [declaration, elements] of this.localArrays)
      snapshot.set(declaration, [
        this.origin(
          ts.factory.createArrayLiteralExpression(elements),
          declaration.initializer ?? declaration,
        ),
      ]);
    return snapshot;
  }

  private capture(
    node: ts.Node,
    bindings: Bindings,
    snapshotLocals = true,
  ): void {
    if (snapshotLocals && this.localArrays.size)
      bindings = this.snapshotBindings(bindings);
    if (
      ts.isFunctionLike(node) ||
      ts.isObjectLiteralExpression(node) ||
      ts.isCallExpression(node)
    ) {
      // Inner invocations own their parameters. An outer return must retain that scope; competing
      // values for the same parameter are ambiguous and cannot establish selected evidence.
      // An unchanged ordered merge retains the immutable scope; children still capture below.
      if (!this.sameCapture(this.captures.get(node), bindings)) {
        const captured = new Map(bindings);
        for (const [declaration, values] of this.captures.get(node) ?? []) {
          const current = captured.get(declaration);
          captured.set(
            declaration,
            current && !this.sameValues(current, values) ? [] : values,
          );
        }
        this.captures.set(node, captured);
      }
      if (ts.isFunctionLike(node) || ts.isCallExpression(node)) return;
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

  /** Numeric guards may use closed const expressions, never coercible objects or mutable aliases. */
  private numericConstant(
    node: ts.Node,
    seen: ReadonlySet<ts.Node>,
  ): number | boolean | undefined {
    if (seen.has(node) || seen.size >= MAX_VALUES) return undefined;
    const next = new Set(seen).add(node);
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return this.numericConstant(node.expression, next);
    if (ts.isIdentifier(node)) {
      const declarations = this.analysis.declarations(node);
      const declaration = declarations[0];
      if (
        declarations.length !== 1 ||
        !ts.isVariableDeclaration(declaration) ||
        !ts.isIdentifier(declaration.name) ||
        !declaration.initializer ||
        !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) ||
        this.mutated(declaration) ||
        this.analysis.hasBindingWrites(declaration)
      )
        return undefined;
      return this.numericConstant(declaration.initializer, next);
    }
    if (ts.isPrefixUnaryExpression(node)) {
      const operand = this.numericConstant(node.operand, next);
      if (typeof operand !== 'number') return undefined;
      if (node.operator === ts.SyntaxKind.PlusToken) return +operand;
      if (node.operator === ts.SyntaxKind.MinusToken) return -operand;
      return undefined;
    }
    if (!ts.isBinaryExpression(node)) return undefined;
    const left = this.numericConstant(node.left, next);
    const right = this.numericConstant(node.right, next);
    if (typeof left !== 'number' || typeof right !== 'number') return undefined;
    switch (node.operatorToken.kind) {
      case ts.SyntaxKind.PlusToken:
        return left + right;
      case ts.SyntaxKind.MinusToken:
        return left - right;
      case ts.SyntaxKind.AsteriskToken:
        return left * right;
      case ts.SyntaxKind.SlashToken:
        return left / right;
      case ts.SyntaxKind.PercentToken:
        return left % right;
      case ts.SyntaxKind.AsteriskAsteriskToken:
        return left ** right;
      case ts.SyntaxKind.LessThanToken:
        return left < right;
      case ts.SyntaxKind.LessThanEqualsToken:
        return left <= right;
      case ts.SyntaxKind.GreaterThanToken:
        return left > right;
      case ts.SyntaxKind.GreaterThanEqualsToken:
        return left >= right;
      default:
        return undefined;
    }
  }

  /** Closed guards used by configuration constructors; no receiver aliases or application callbacks. */
  private closedGuard(node: ts.Node): boolean | undefined {
    if (
      !ts.isCallExpression(node) ||
      node.questionDotToken ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.questionDotToken ||
      node.arguments.length !== 1 ||
      ts.isSpreadElement(node.arguments[0])
    )
      return undefined;
    const { expression: receiver, name } = node.expression;
    // This literal grammar is the file repository's path check. Evaluate only this fixed,
    // linear pattern on one proven primitive string; never compile an application's regexp.
    if (
      name.text === 'test' &&
      ts.isRegularExpressionLiteral(receiver) &&
      receiver.text === String.raw`/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/`
    ) {
      const argument = node.arguments[0];
      if (
        !accessorIndex(this.analysis).regexpMethodsIntact ||
        !this.stableKeySource(argument) ||
        this.analysis
          .declarations(argument)
          .some((declaration) => this.mutated(declaration))
      )
        return undefined;
      const values = this.values(argument);
      if (
        values.length !== 1 ||
        !ts.isStringLiteralLike(values[0]) ||
        values[0].text.length > 4096
      )
        return undefined;
      return /^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(values[0].text);
    }
    if (this.global(receiver) === 'Number') {
      const value = this.numericConstant(node.arguments[0], new Set());
      if (typeof value !== 'number') return undefined;
      switch (name.text) {
        case 'isSafeInteger':
          return Number.isSafeInteger(value);
        case 'isInteger':
          return Number.isInteger(value);
        case 'isFinite':
          return Number.isFinite(value);
        case 'isNaN':
          return Number.isNaN(value);
        default:
          return undefined;
      }
    }
    if (
      name.text !== 'includes' ||
      !ts.isArrayLiteralExpression(receiver) ||
      receiver.elements.length > MAX_VALUES
    )
      return undefined;
    const literal = (item: ts.Node): Atom | undefined => {
      item = StaticValues.unwrap(item);
      if (ts.isStringLiteralLike(item)) return item.text;
      if (item.kind === ts.SyntaxKind.TrueKeyword) return true;
      if (item.kind === ts.SyntaxKind.FalseKeyword) return false;
      if (item.kind === ts.SyntaxKind.NullKeyword) return null;
      return this.numericConstant(item, new Set());
    };
    const search = literal(node.arguments[0]);
    const items = receiver.elements.map(literal);
    if (search === undefined || items.some((item) => item === undefined))
      return undefined;
    // Array.includes uses SameValueZero: NaN matches itself and signed zero compares equal.
    return items.includes(search);
  }

  private atoms(node: ts.Node, seen: Set<ts.Node> = new Set()): Atom[] {
    if (
      ts.isIdentifier(node) &&
      node.text === 'undefined' &&
      !this.analysis.declarations(node).length
    )
      return [undefined];
    const guard = this.closedGuard(node);
    if (guard !== undefined) return [guard];
    const numeric = this.numericConstant(node, seen);
    if (numeric !== undefined) return [numeric];
    return this.values(node, seen)
      .flatMap((value): Atom[] => {
        if (ts.isStringLiteralLike(value)) return [value.text];
        if (ts.isNumericLiteral(value)) return [Number(value.text)];
        if (value.kind === ts.SyntaxKind.TrueKeyword) return [true];
        if (value.kind === ts.SyntaxKind.FalseKeyword) return [false];
        if (value.kind === ts.SyntaxKind.NullKeyword) return [null];
        if (
          ts.isIdentifier(value) &&
          value.text === 'undefined' &&
          !this.analysis.declarations(value).length
        )
          return [undefined];
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
    const guarded = this.analysis.nativeInitialization.guardCondition(
      node,
      this,
    );
    return guarded === undefined
      ? [...new Set(this.atoms(node).map(Boolean))]
      : [guarded];
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
