import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';

type Atom = string | number | boolean | null;
type Bindings = ReadonlyMap<ts.Declaration, readonly ts.Node[]>;
const MAX_VALUES = 32;

/** A bounded literal evaluator. Calls, getters, spreads and unknown conditions are never executed or guessed. */
export class StaticValues {
  public constructor(
    private readonly analysis: SourceEvidence,
    private readonly bindings: Bindings = new Map(),
  ) {}

  public values(
    node: ts.Node,
    seen: Set<ts.Node> = new Set(),
  ): readonly ts.Node[] {
    if (seen.has(node) || seen.size >= MAX_VALUES) return [];
    seen = new Set(seen).add(node);
    const next = (value: ts.Node): readonly ts.Node[] =>
      this.values(value, seen);
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
    return [node];
  }

  private hasSpread(node: ts.Node): boolean {
    return ts.isObjectLiteralExpression(node)
      ? node.properties.some(ts.isSpreadAssignment)
      : ts.isJsxAttributes(node) &&
          node.properties.some(ts.isJsxSpreadAttribute);
  }

  private property(
    node: ts.Node,
    name: string,
    seen: Set<ts.Node>,
  ): readonly ts.Node[] {
    if (this.hasSpread(node)) return [];
    if (ts.isObjectLiteralExpression(node)) {
      const entry = node.properties.find(
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
            : undefined;
      return value ? this.values(value, seen) : [];
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
