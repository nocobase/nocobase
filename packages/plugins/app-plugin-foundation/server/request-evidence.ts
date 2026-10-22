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
  const bindings = new Map<ts.Declaration, ts.Node[]>();
  for (const node of selected) {
    const expression = ts.isCallExpression(node)
      ? node.expression
      : ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)
        ? node.tagName
        : undefined;
    if (!expression) continue;
    for (const value of analysis.values(expression)) {
      if (!ts.isFunctionLike(value)) continue;
      value.parameters.forEach((parameter, index) => {
        const argument = ts.isCallExpression(node)
          ? node.arguments[index]
          : (ts.isJsxSelfClosingElement(node) ||
                ts.isJsxOpeningElement(node)) &&
              index === 0
            ? node.attributes
            : undefined;
        if (argument)
          bindings.set(parameter, [
            ...(bindings.get(parameter) ?? []),
            argument,
          ]);
      });
    }
  }
  const literals = new StaticValues(analysis, bindings);
  const values = (node: ts.Node): readonly ts.Node[] => literals.values(node);
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
  const client = (node: ts.Node, seen = new Set<ts.Node>()): boolean => {
    if (seen.has(node)) return false;
    seen.add(node);
    return values(node).some((value) => {
      if (!ts.isCallExpression(value)) return false;
      if (imported(value.expression, 'useApiClient')) return true;
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
          returned(fn).some((result) => client(result, new Set(seen))),
        );
    });
  };
  const strings = (node: ts.Node): string[] => literals.strings(node, true);
  const paths: ApiReference[] = [];
  for (const node of selected) {
    if (
      !ts.isCallExpression(node) ||
      !ts.isPropertyAccessExpression(node.expression)
    )
      continue;
    const methodName = node.expression.name.text;
    const receiver = node.expression.expression;
    if (methodName === 'request' && client(receiver)) {
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
          !client(repository.expression.expression)
        )
          continue;
        for (const name of repository.arguments[0]
          ? strings(repository.arguments[0])
          : [])
          paths.push({ path: `${name}/${methodName}`, method: 'POST' });
      }
    }
  }
  return paths;
}
