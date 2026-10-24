import ts from 'typescript';
import { StaticValues } from './static-values.js';
import type { SourceEvidence } from './source-evidence.js';

type Bindings = ReadonlyMap<ts.Declaration, readonly ts.Node[]>;
interface Value {
  node: ts.Node;
  bindings: Bindings;
}
export interface RouteDeclaration {
  name: string;
  loader: ts.Node;
  bindings: Bindings;
}

/** Finite local route constructors, interpreted as syntax with invocation-local bindings. */
export class RouteEvidence {
  public complete = true;
  private visits = 0;
  private readonly routes: RouteDeclaration[] = [];
  public constructor(private readonly analysis: SourceEvidence) {}

  public collect(ast: ts.SourceFile): RouteDeclaration[] {
    this.scan({ node: ast, bindings: new Map() }, new Set());
    return this.routes;
  }

  private values(value: Value, seen = new Set<ts.Node>()): Value[] {
    const { node, bindings } = value;
    if (++this.visits > 100_000 || seen.size >= 32 || seen.has(node)) {
      this.complete = false;
      return [];
    }
    const nextSeen = new Set(seen).add(node);
    const next = (child: ts.Node, context = bindings): Value[] =>
      this.values({ node: child, bindings: context }, nextSeen);
    if (ts.isIdentifier(node)) {
      const declarations = this.analysis.declarations(node);
      return declarations.length
        ? declarations.flatMap((d) => next(d))
        : [value];
    }
    if (ts.isParameter(node) || ts.isVariableDeclaration(node)) {
      const bound = bindings.get(node);
      return bound
        ? bound.flatMap((child) => next(child))
        : node.initializer
          ? next(node.initializer)
          : [];
    }
    if (ts.isBindingElement(node)) {
      const owner = node.parent.parent;
      const containers = next(owner);
      const name = node.propertyName ?? node.name;
      const result = containers.flatMap((container) => {
        if (
          ts.isArrayBindingPattern(node.parent) &&
          ts.isArrayLiteralExpression(container.node)
        ) {
          const child =
            container.node.elements[node.parent.elements.indexOf(node)];
          return child
            ? this.values({ ...container, node: child }, nextSeen)
            : [];
        }
        return ts.isIdentifier(name) || ts.isStringLiteralLike(name)
          ? this.property(container, name.text, nextSeen)
          : [];
      });
      return result.length
        ? result
        : node.initializer
          ? next(node.initializer)
          : [];
    }
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return next(node.expression);
    if (ts.isPropertyAccessExpression(node))
      return next(node.expression).flatMap((item) =>
        this.property(item, node.name.text, nextSeen),
      );
    if (ts.isElementAccessExpression(node) && node.argumentExpression) {
      const keys = new StaticValues(this.analysis, bindings).strings(
        node.argumentExpression,
      );
      return next(node.expression).flatMap((item) =>
        keys.flatMap((key) => this.property(item, key, nextSeen)),
      );
    }
    if (ts.isConditionalExpression(node)) {
      const truth = this.truth({ node: node.condition, bindings }, nextSeen);
      if (truth === undefined) {
        this.complete = false;
        return [];
      }
      return next(truth ? node.whenTrue : node.whenFalse);
    }
    if (ts.isCallExpression(node)) {
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'Object' &&
        node.expression.name.text === 'entries' &&
        !this.analysis.declarations(node.expression.expression).length &&
        node.arguments.length === 1
      ) {
        const objects = next(node.arguments[0]);
        if (
          objects.length !== 1 ||
          !ts.isObjectLiteralExpression(objects[0].node) ||
          objects[0].node.properties.length > 32 ||
          duplicateProperties(objects[0].node) ||
          objects[0].node.properties.some(
            (p) =>
              !ts.isPropertyAssignment(p) &&
              !ts.isShorthandPropertyAssignment(p),
          )
        ) {
          this.complete = false;
          return [];
        }
        const pairs: ts.Expression[] = [];
        for (const property of objects[0].node.properties) {
          if (
            !property.name ||
            !(
              ts.isIdentifier(property.name) ||
              ts.isStringLiteralLike(property.name)
            )
          ) {
            this.complete = false;
            return [];
          }
          const expression = ts.isPropertyAssignment(property)
            ? property.initializer
            : ts.isShorthandPropertyAssignment(property)
              ? property.name
              : undefined;
          if (!expression) {
            this.complete = false;
            return [];
          }
          pairs.push(
            ts.factory.createArrayLiteralExpression([
              ts.factory.createStringLiteral(property.name.text),
              expression,
            ]),
          );
        }
        return [
          {
            node: ts.factory.createArrayLiteralExpression(pairs),
            bindings: objects[0].bindings,
          },
        ];
      }
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        ['map', 'find'].includes(node.expression.name.text)
      ) {
        const arrays = next(node.expression.expression);
        const callback = node.arguments[0];
        if (
          arrays.length !== 1 ||
          !ts.isArrayLiteralExpression(arrays[0].node) ||
          !callback ||
          !(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
        ) {
          this.complete = false;
          return [];
        }
        const elements = this.elements(arrays[0], nextSeen);
        if (elements.length > 32) {
          this.complete = false;
          return [];
        }
        const results: Value[] = [];
        for (const element of elements) {
          const context = new Map([...bindings, ...element.bindings]);
          if (callback.parameters[0])
            context.set(callback.parameters[0], [element.node]);
          if (node.expression.name.text === 'find') {
            if (ts.isBlock(callback.body)) {
              this.complete = false;
              return [];
            }
            const truth = this.truth(
              { node: callback.body, bindings: context },
              nextSeen,
            );
            if (truth === undefined) {
              this.complete = false;
              return [];
            }
            if (truth) return [element];
          } else results.push(...this.returned(callback, context, nextSeen));
        }
        return results;
      }
      const functions = this.analysis.functions(node.expression);
      if (functions.length !== 1) {
        this.complete = false;
        return [];
      }
      const fn = functions[0];
      if (seen.has(fn)) {
        this.complete = false;
        return [];
      }
      const context = new Map(bindings);
      fn.parameters.forEach((parameter, index) => {
        const argument = node.arguments[index];
        const args = argument
          ? this.values({ node: argument, bindings }, nextSeen)
          : [];
        // Retain caller bindings when the argument is an object containing references to outer parameters.
        for (const arg of args)
          for (const [key, values] of arg.bindings) context.set(key, values);
        context.set(
          parameter,
          args.length
            ? args.map((arg) => arg.node)
            : argument
              ? [argument]
              : parameter.initializer
                ? [parameter.initializer]
                : [],
        );
      });
      return this.returned(fn, context, new Set(nextSeen).add(fn));
    }
    return [value];
  }

  private returned(
    fn: ts.SignatureDeclaration,
    bindings: Bindings,
    seen: Set<ts.Node>,
  ): Value[] {
    if (!('body' in fn) || !fn.body) {
      this.complete = false;
      return [];
    }
    if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body))
      return this.values({ node: fn.body, bindings }, seen);
    if (!ts.isBlock(fn.body)) {
      this.complete = false;
      return [];
    }
    const statements = (nodes: readonly ts.Statement[]): Value[] => {
      for (const node of nodes) {
        if (ts.isReturnStatement(node))
          return node.expression
            ? this.values({ node: node.expression, bindings }, seen)
            : [];
        if (
          ts.isVariableStatement(node) &&
          node.declarationList.flags & ts.NodeFlags.Const &&
          node.declarationList.declarations.every(
            (d) => d.initializer && !containsCall(d.initializer),
          )
        )
          continue;
        // No side effects, loops, assignments, recursion or unknown control flow are interpreted.
        this.complete = false;
        return [];
      }
      return [];
    };
    return statements(fn.body.statements);
  }

  private property(value: Value, name: string, seen: Set<ts.Node>): Value[] {
    if (
      !ts.isObjectLiteralExpression(value.node) ||
      value.node.properties.some(ts.isSpreadAssignment) ||
      duplicateProperties(value.node)
    )
      return [];
    const entry = value.node.properties.find(
      (p) =>
        p.name &&
        (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name)) &&
        p.name.text === name,
    );
    const node =
      entry && ts.isPropertyAssignment(entry)
        ? entry.initializer
        : entry && ts.isShorthandPropertyAssignment(entry)
          ? entry.name
          : undefined;
    return node ? this.values({ ...value, node }, seen) : [];
  }

  private truth(value: Value, seen: Set<ts.Node>): boolean | undefined {
    const values = this.values(value, seen);
    if (values.length === 1) {
      const node = values[0].node;
      if (
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isObjectLiteralExpression(node) ||
        ts.isArrayLiteralExpression(node)
      )
        return true;
      if (ts.isStringLiteralLike(node)) return Boolean(node.text);
    }
    const atoms = new StaticValues(this.analysis, value.bindings).booleans(
      value.node,
    );
    if (atoms.length === 1) return atoms[0];
    // Missing optional object properties and omitted arguments have the value undefined.
    if (!values.length && ts.isIdentifier(value.node)) {
      const declarations = this.analysis.declarations(value.node);
      if (declarations.length === 1) {
        const declaration = declarations[0];
        if (
          ts.isParameter(declaration) &&
          value.bindings.has(declaration) &&
          !value.bindings.get(declaration)?.length
        )
          return false;
        if (ts.isBindingElement(declaration) && !declaration.initializer) {
          const owner = declaration.parent.parent;
          const containers = this.values(
            { node: owner, bindings: value.bindings },
            seen,
          );
          const name = declaration.propertyName ?? declaration.name;
          if (
            ts.isIdentifier(name) &&
            containers.length === 1 &&
            ts.isObjectLiteralExpression(containers[0].node) &&
            !containers[0].node.properties.some(ts.isSpreadAssignment) &&
            !containers[0].node.properties.some(
              (p) => p.name?.getText() === name.text,
            )
          )
            return false;
        }
      }
    }
    return undefined;
  }

  private elements(value: Value, seen: Set<ts.Node>): Value[] {
    if (
      !ts.isArrayLiteralExpression(value.node) ||
      value.node.elements.length > 32
    ) {
      this.complete = false;
      return [];
    }
    return value.node.elements.flatMap((node) =>
      ts.isSpreadElement(node)
        ? this.values({ ...value, node: node.expression }, seen).flatMap(
            (item) =>
              ts.isArrayLiteralExpression(item.node)
                ? this.elements(item, seen)
                : [item],
          )
        : [{ ...value, node }],
    );
  }

  private scan(value: Value, seen: Set<ts.Node>): void {
    if (++this.visits > 100_000 || seen.size >= 32 || seen.has(value.node)) {
      this.complete = false;
      return;
    }
    const { node, bindings } = value;
    const nextSeen = new Set(seen).add(node);
    if (ts.isFunctionLike(node)) return;
    if (
      ts.isForStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isIfStatement(node) ||
      ts.isSwitchStatement(node) ||
      ts.isTryStatement(node)
    ) {
      this.complete = false;
      return;
    }
    if (ts.isObjectLiteralExpression(node)) {
      if (
        node.properties.some(ts.isSpreadAssignment) ||
        duplicateProperties(node)
      ) {
        this.complete = false;
        return;
      }
      const name = field(node, 'name'),
        loader = field(node, 'componentLoader');
      if (name && loader) {
        const names = new StaticValues(this.analysis, bindings).strings(name);
        const loaders = this.values({ node: loader, bindings });
        if (names.length !== 1 || loaders.length !== 1) this.complete = false;
        else {
          const declaration = {
            name: names[0],
            loader: loaders[0].node,
            bindings: loaders[0].bindings,
          };
          if (
            !this.routes.some(
              (r) =>
                r.name === declaration.name && r.loader === declaration.loader,
            )
          )
            this.routes.push(declaration);
        }
        const children = field(node, 'children');
        if (children) this.scan({ node: children, bindings }, nextSeen);
        return;
      }
    }
    if (ts.isConditionalExpression(node)) {
      for (const selected of this.values(value)) this.scan(selected, nextSeen);
      return;
    }
    if (ts.isCallExpression(node)) {
      // The framework wrapper supplies definitions unchanged. Other opaque wrappers retain only explicit argument evidence.
      const knownWrapper = this.analysis
        .declarations(node.expression)
        .some(
          (d) =>
            ts.isImportSpecifier(d) &&
            (d.propertyName?.text ?? d.name.text) === 'defineAppRoutes',
        );
      if (!knownWrapper) {
        const values = this.values(value);
        for (const selected of values) this.scan(selected, nextSeen);
      }
      for (const argument of node.arguments)
        this.scan({ node: argument, bindings }, nextSeen);
      return;
    }
    if (ts.isSpreadElement(node)) {
      for (const item of this.values({ node: node.expression, bindings }))
        this.scan(item, nextSeen);
      return;
    }
    ts.forEachChild(node, (child) =>
      this.scan({ node: child, bindings }, nextSeen),
    );
  }
}

function field(
  node: ts.ObjectLiteralExpression,
  name: string,
): ts.Node | undefined {
  const entry = node.properties.find(
    (p) =>
      p.name &&
      (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name)) &&
      p.name.text === name,
  );
  return entry && ts.isPropertyAssignment(entry)
    ? entry.initializer
    : entry && ts.isShorthandPropertyAssignment(entry)
      ? entry.name
      : undefined;
}
function containsCall(node: ts.Node): boolean {
  if (ts.isFunctionLike(node)) return false;
  if (
    ts.isCallExpression(node) ||
    ts.isNewExpression(node) ||
    ts.isAwaitExpression(node) ||
    ts.isClassExpression(node) ||
    ts.isDeleteExpression(node) ||
    ts.isYieldExpression(node) ||
    ts.isTaggedTemplateExpression(node) ||
    ts.isPostfixUnaryExpression(node) ||
    (ts.isPrefixUnaryExpression(node) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(
        node.operator,
      )) ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment)
  )
    return true;
  let found = false;
  ts.forEachChild(node, (child) => {
    if (containsCall(child)) found = true;
  });
  return found;
}

function duplicateProperties(node: ts.ObjectLiteralExpression): boolean {
  const names = node.properties.flatMap((p) =>
    p.name && (ts.isIdentifier(p.name) || ts.isStringLiteralLike(p.name))
      ? [p.name.text]
      : [],
  );
  return new Set(names).size !== names.length;
}
