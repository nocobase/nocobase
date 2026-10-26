import ts from 'typescript';
import { importedContract } from './api-contracts.js';
import type { SourceEvidence } from './source-evidence.js';
import { StaticValues } from './static-values.js';

/** Recognize one local, synchronous documentation factory without invoking it. */
export function documentationContract(
  call: ts.CallExpression,
  analysis: SourceEvidence,
): boolean {
  let visits = 0;
  const bindings = new Map<ts.Declaration, readonly ts.Node[]>();
  const pure = (node: ts.Node, seen = new Set<ts.Node>()): boolean => {
    if (++visits > 100_000 || seen.size >= 32 || seen.has(node)) return false;
    const next = new Set(seen).add(node);
    const check = (child: ts.Node): boolean => pure(child, next);
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
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return check(node.expression);
    if (ts.isParameter(node)) {
      const values =
        bindings.get(node) ?? (node.initializer ? [node.initializer] : []);
      return values.length === 1 && check(values[0]);
    }
    if (ts.isIdentifier(node)) {
      if (
        importedContract(
          node,
          analysis,
          '@nocobase/app-server/router',
          'apiErrorResponses',
        )
      )
        return true;
      const declarations = analysis.declarations(node);
      return declarations.length === 1 && check(declarations[0]);
    }
    if (ts.isVariableDeclaration(node))
      return (
        analysis.immutable(node, (call) =>
          [
            'dataResponse',
            'listResponse',
            'emptyResponse',
            'apiErrorResponse',
            'describeRoute',
          ].some((name) =>
            importedContract(
              call.expression,
              analysis,
              '@nocobase/app-server/router',
              name,
            ),
          ),
        ) &&
        !!node.initializer &&
        check(node.initializer)
      );
    if (ts.isArrayLiteralExpression(node))
      return node.elements.length <= 32 && node.elements.every(check);
    if (ts.isObjectLiteralExpression(node))
      return (
        node.properties.length <= 32 &&
        node.properties.every((p) => {
          if (ts.isSpreadAssignment(p)) return check(p.expression);
          if (ts.isShorthandPropertyAssignment(p))
            return !p.objectAssignmentInitializer && check(p.name);
          return (
            ts.isPropertyAssignment(p) &&
            !ts.isComputedPropertyName(p.name) &&
            check(p.initializer)
          );
        })
      );
    if (ts.isConditionalExpression(node)) {
      const values = new StaticValues(analysis, bindings).booleans(
        node.condition,
      );
      return (
        check(node.condition) &&
        values.length === 1 &&
        check(values[0] ? node.whenTrue : node.whenFalse)
      );
    }
    if (
      ts.isCallExpression(node) &&
      !node.questionDotToken &&
      !node.arguments.some(ts.isSpreadElement)
    ) {
      const constructors = [
        'dataResponse',
        'listResponse',
        'emptyResponse',
        'apiErrorResponse',
      ];
      if (
        constructors.some((name) =>
          importedContract(
            node.expression,
            analysis,
            '@nocobase/app-server/router',
            name,
          ),
        )
      )
        return node.arguments.every(check);
      // The finite schema constructors below build documentation values only. Transforms, callbacks and arbitrary methods remain unknown.
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        !node.expression.questionDotToken
      ) {
        const receiver = node.expression.expression;
        const name = node.expression.name.text;
        if (
          importedContract(receiver, analysis, 'zod', 'z') &&
          [
            'object',
            'string',
            'number',
            'boolean',
            'unknown',
            'any',
            'null',
            'literal',
            'enum',
            'union',
            'array',
          ].includes(name)
        )
          return node.arguments.every(check);
        if (
          ['passthrough', 'strict', 'optional', 'nullable', 'array'].includes(
            name,
          ) &&
          !node.arguments.length
        )
          return check(receiver);
      }
    }
    return false;
  };
  if (
    !ts.isIdentifier(call.expression) ||
    call.questionDotToken ||
    call.arguments.some(ts.isSpreadElement)
  )
    return false;
  const declarations = analysis.declarations(call.expression);
  if (declarations.length !== 1) return false;
  const declaration = declarations[0];
  let fn: ts.Node = declaration;
  if (ts.isVariableDeclaration(declaration)) {
    if (!analysis.immutable(declaration) || !declaration.initializer)
      return false;
    fn = declaration.initializer;
  }
  if (
    !(
      ts.isArrowFunction(fn) ||
      ts.isFunctionExpression(fn) ||
      ts.isFunctionDeclaration(fn)
    ) ||
    !fn.body ||
    fn.asteriskToken ||
    ts.getModifiers(fn)?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
  )
    return false;
  // Function declarations can be rebound; immutable const factories are the supported boundary.
  if (
    !ts.isVariableDeclaration(declaration) ||
    fn.parameters.length > 32 ||
    call.arguments.length > fn.parameters.length
  )
    return false;
  for (const [index, parameter] of fn.parameters.entries()) {
    if (!ts.isIdentifier(parameter.name) || parameter.dotDotDotToken)
      return false;
    const argument = call.arguments[index] ?? parameter.initializer;
    if (!argument || !pure(argument)) return false;
    bindings.set(parameter, [argument]);
  }
  let body: ts.Node = fn.body;
  if (ts.isBlock(body)) {
    const statements = body.statements;
    const last = statements.at(-1);
    if (!last || !ts.isReturnStatement(last) || !last.expression) return false;
    if (
      !statements
        .slice(0, -1)
        .every(
          (s) =>
            ts.isVariableStatement(s) &&
            !!(s.declarationList.flags & ts.NodeFlags.Const) &&
            s.declarationList.declarations.every(
              (d) =>
                ts.isIdentifier(d.name) &&
                !!d.initializer &&
                pure(d.initializer),
            ),
        )
    )
      return false;
    body = last.expression;
  }
  return (
    ts.isCallExpression(body) &&
    !body.questionDotToken &&
    body.arguments.length === 1 &&
    importedContract(
      body.expression,
      analysis,
      '@nocobase/app-server/router',
      'describeRoute',
    ) &&
    pure(body.arguments[0])
  );
}
