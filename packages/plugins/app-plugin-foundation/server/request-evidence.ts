import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';
import { StaticValues } from './static-values.js';

export interface ApiReference {
  readonly path: string;
  readonly method: string;
}

export const REPOSITORY_ACTIONS: ReadonlySet<string> = new Set([
  'findMany',
  'findOne',
  'count',
  'aggregate',
  'groupBy',
  'exists',
  'createOne',
  'updateOne',
  'deleteOne',
]);

export function objectProperty(
  node: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression | undefined {
  const entry = node.properties.find(
    (item) =>
      item.name &&
      (ts.isIdentifier(item.name) || ts.isStringLiteralLike(item.name)) &&
      item.name.text === name,
  );
  return entry && ts.isPropertyAssignment(entry)
    ? entry.initializer
    : entry && ts.isShorthandPropertyAssignment(entry)
      ? entry.name
      : undefined;
}

export function returned(node: ts.Node): readonly ts.Node[] {
  if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) return [node.body];
  const result: ts.Node[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isReturnStatement(child) && child.expression)
      result.push(child.expression);
    else if (!ts.isFunctionLike(child)) ts.forEachChild(child, visit);
  };
  if (ts.isFunctionLike(node) && 'body' in node && node.body) visit(node.body);
  return result;
}

/** Only calls on a proven host API client count. Parameter bindings are local to one selected page slice. */
export function pageRequests(
  sources: readonly { readonly nodes: ReadonlySet<ts.Node> }[],
  analysis: SourceEvidence,
): ApiReference[] {
  const selected = new Set(sources.flatMap((source) => [...source.nodes]));
  type Bindings = ReadonlyMap<ts.Declaration, readonly ts.Node[]>;
  type Call =
    ts.CallExpression | ts.JsxSelfClosingElement | ts.JsxOpeningElement;
  const calls = new Map<ts.SignatureDeclaration, Call[]>();
  for (const node of selected) {
    const expression = ts.isCallExpression(node)
      ? node.expression
      : ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)
        ? node.tagName
        : undefined;
    if (!expression) continue;
    if (
      !ts.isCallExpression(node) &&
      !ts.isJsxSelfClosingElement(node) &&
      !ts.isJsxOpeningElement(node)
    )
      continue;
    for (const fn of analysis.functions(expression))
      calls.set(fn, [...(calls.get(fn) ?? []), node]);
  }
  const enclosing = (node: ts.Node): ts.SignatureDeclaration | undefined => {
    for (let parent = node.parent; parent; parent = parent.parent)
      if (ts.isFunctionLike(parent)) return parent;
    return undefined;
  };
  const cache = new Map<ts.SignatureDeclaration, readonly Bindings[]>();
  const contexts = (
    fn: ts.SignatureDeclaration | undefined,
    seen = new Set<ts.Node>(),
  ): readonly Bindings[] => {
    if (!fn) return [new Map()];
    if (seen.has(fn) || seen.size >= 32) return [];
    const cached = cache.get(fn);
    if (cached) return cached;
    const next = new Set(seen).add(fn);
    const invocations = calls.get(fn) ?? [];
    const result = invocations.length
      ? invocations
          .flatMap((call) =>
            contexts(enclosing(call), next).map((parent) => {
              const bindings = new Map(parent);
              fn.parameters.forEach((parameter, index) => {
                const argument = ts.isCallExpression(call)
                  ? call.arguments[index]
                  : index === 0
                    ? call.attributes
                    : undefined;
                const value = argument ?? parameter.initializer;
                bindings.set(parameter, value ? [value] : []);
              });
              return bindings;
            }),
          )
          .slice(0, 32)
      : contexts(enclosing(fn), next);
    cache.set(fn, result);
    return result;
  };
  const imported = (node: ts.Node, name: string): boolean => {
    const symbol = analysis.symbol(node);
    return (symbol?.declarations ?? []).some((declaration) => {
      if (
        !ts.isImportSpecifier(declaration) ||
        declaration.isTypeOnly ||
        (declaration.propertyName?.text ?? declaration.name.text) !== name
      )
        return false;
      const statement = declaration.parent.parent.parent;
      return (
        ts.isImportDeclaration(statement) &&
        !statement.importClause?.isTypeOnly &&
        ts.isStringLiteralLike(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === '@nocobase/app-client'
      );
    });
  };
  const client = (
    node: ts.Node,
    bindings: Bindings,
    seen = new Set<ts.Node>(),
  ): boolean => {
    if (seen.has(node)) return false;
    seen.add(node);
    return new StaticValues(analysis, bindings).values(node).some((value) => {
      if (!ts.isCallExpression(value)) return false;
      if (imported(value.expression, 'useApiClient')) return true;
      if (
        imported(value.expression, 'useService') &&
        value.arguments[0] &&
        imported(value.arguments[0], 'apiClientToken')
      )
        return true;
      if (
        ts.isPropertyAccessExpression(value.expression) &&
        value.expression.name.text === 'resolve' &&
        value.arguments[0] &&
        imported(value.arguments[0], 'apiClientToken')
      )
        return true;
      return analysis
        .values(value.expression)
        .some((fn) =>
          returned(fn).some((result) =>
            client(result, bindings, new Set(seen)),
          ),
        );
    });
  };
  const paths: ApiReference[] = [];
  for (const node of selected) {
    if (
      !ts.isCallExpression(node) ||
      !ts.isPropertyAccessExpression(node.expression)
    )
      continue;
    const methodName = node.expression.name.text;
    const receiver = node.expression.expression;
    if (methodName !== 'request' && !REPOSITORY_ACTIONS.has(methodName))
      continue;
    for (const bindings of contexts(enclosing(node))) {
      const literals = new StaticValues(analysis, bindings);
      const values = (value: ts.Node): readonly ts.Node[] =>
        literals.values(value);
      const strings = (value: ts.Node): string[] =>
        literals.strings(value, true);
      if (methodName === 'request' && client(receiver, bindings)) {
        for (const argument of node.arguments[0]
          ? values(node.arguments[0])
          : []) {
          if (!ts.isObjectLiteralExpression(argument)) continue;
          const path = objectProperty(argument, 'path');
          const method = objectProperty(argument, 'method');
          for (const verb of method ? strings(method) : ['GET'])
            for (const pathValue of path ? strings(path) : [])
              paths.push({ path: pathValue, method: verb.toUpperCase() });
        }
      }
      if (REPOSITORY_ACTIONS.has(methodName)) {
        for (const repository of values(receiver)) {
          if (
            !ts.isCallExpression(repository) ||
            !ts.isPropertyAccessExpression(repository.expression) ||
            repository.expression.name.text !== 'repository' ||
            !client(repository.expression.expression, bindings)
          )
            continue;
          for (const name of repository.arguments[0]
            ? strings(repository.arguments[0])
            : [])
            paths.push({ path: `${name}/${methodName}`, method: 'POST' });
        }
      }
    }
  }
  return [
    ...new Map(
      paths.map((reference) => [
        `${reference.method}\0${reference.path}`,
        reference,
      ]),
    ).values(),
  ];
}
