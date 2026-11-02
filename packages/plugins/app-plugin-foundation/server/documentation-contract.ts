import ts from 'typescript';
import { importedContract } from './api-contracts.js';
import type { SourceEvidence } from './source-evidence.js';
import { StaticValues } from './static-values.js';

/** Recognize one local, synchronous documentation factory without invoking it. */
export function documentationContract(
  call: ts.CallExpression,
  analysis: SourceEvidence,
  resolver?: StaticValues,
): boolean {
  let visits = 0;
  const bindings = new Map<ts.Declaration, readonly ts.Node[]>(
    resolver?.capturedBindings(call),
  );
  const literals = () =>
    resolver ? resolver.fork(bindings) : new StaticValues(analysis, bindings);
  const metadata = (
    declaration: ts.VariableDeclaration,
    seen = new Set<ts.VariableDeclaration>(),
  ): boolean => {
    if (seen.has(declaration)) return true;
    if (
      seen.size >= 32 ||
      !(ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) ||
      analysis.hasBindingWrites(declaration)
    )
      return false;
    const references = analysis.configurationReferences(declaration);
    if (!references) return false;
    const next = new Set(seen).add(declaration);
    for (const reference of references) {
      if (
        reference === declaration.name ||
        ts.isImportSpecifier(reference.parent)
      )
        continue;
      let owner: ts.Node = reference;
      while (
        ts.isPropertyAssignment(owner.parent) ||
        ts.isShorthandPropertyAssignment(owner.parent) ||
        ts.isSpreadAssignment(owner.parent) ||
        ts.isObjectLiteralExpression(owner.parent) ||
        ts.isArrayLiteralExpression(owner.parent) ||
        ts.isConditionalExpression(owner.parent) ||
        ts.isParenthesizedExpression(owner.parent) ||
        ts.isAsExpression(owner.parent) ||
        ts.isSatisfiesExpression(owner.parent)
      )
        owner = owner.parent;
      if (ts.isArrowFunction(owner.parent) && owner.parent.body === owner) {
        const callback = owner.parent,
          map = callback.parent;
        if (
          !ts.isCallExpression(map) ||
          map.arguments.length !== 1 ||
          map.arguments[0] !== callback ||
          !ts.isPropertyAccessExpression(map.expression) ||
          map.expression.name.text !== 'map' ||
          literals().expressionBarrier(map) !== 'continues'
        )
          return false;
        owner = map;
        while (
          ts.isPropertyAssignment(owner.parent) ||
          ts.isObjectLiteralExpression(owner.parent) ||
          ts.isParenthesizedExpression(owner.parent)
        )
          owner = owner.parent;
      }
      const use = owner.parent;
      if (ts.isVariableDeclaration(use) && use.initializer === owner) {
        if (!metadata(use, next)) return false;
        continue;
      }
      if (
        ts.isCallExpression(use) &&
        use.arguments.includes(owner as ts.Expression) &&
        [
          'dataResponse',
          'listResponse',
          'emptyResponse',
          'apiErrorResponse',
          'describeRoute',
          'defineRepositoryApiRoutes',
        ].some((name) =>
          importedContract(
            use.expression,
            analysis,
            '@nocobase/app-server/router',
            name,
          ),
        )
      )
        continue;
      return false;
    }
    return true;
  };
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
      if (declarations.length === 1 && bindings.has(declarations[0])) {
        const bound = bindings.get(declarations[0])!;
        return bound.length === 1 && bound[0] !== node && check(bound[0]);
      }
      return declarations.length === 1 && check(declarations[0]);
    }
    if (ts.isVariableDeclaration(node))
      return (
        ((node.initializer &&
          ts.isBinaryExpression(node.initializer) &&
          !analysis.hasBindingWrites(node)) ||
          metadata(node) ||
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
          )) &&
        !!node.initializer &&
        check(node.initializer)
      );
    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      const evaluator = literals(),
        values = evaluator.values(node);
      return (
        evaluator.expressionBarrier(node) === 'continues' &&
        values.length === 1 &&
        (ts.isStringLiteralLike(values[0]) ||
          ts.isNumericLiteral(values[0]) ||
          [
            ts.SyntaxKind.TrueKeyword,
            ts.SyntaxKind.FalseKeyword,
            ts.SyntaxKind.NullKeyword,
          ].includes(values[0].kind))
      );
    }
    if (ts.isTemplateExpression(node))
      return (
        node.templateSpans.every((span) => check(span.expression)) &&
        literals().strings(node).length === 1
      );
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    ) {
      const evaluator = literals(),
        values = evaluator.values(node);
      return (
        evaluator.expressionBarrier(node) === 'continues' &&
        values.length === 1 &&
        (ts.isStringLiteralLike(values[0]) || ts.isNumericLiteral(values[0]))
      );
    }
    if (ts.isBinaryExpression(node))
      return (
        [
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ts.SyntaxKind.PlusToken,
          ts.SyntaxKind.MinusToken,
          ts.SyntaxKind.AsteriskToken,
        ].includes(node.operatorToken.kind) &&
        check(node.left) &&
        check(node.right)
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
      const values = literals().booleans(node.condition);
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
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        ['charAt', 'slice', 'toUpperCase', 'startsWith'].includes(
          node.expression.name.text,
        )
      ) {
        const evaluator = literals(),
          values = evaluator.values(node);
        return (
          values.length === 1 &&
          values[0] !== node &&
          (ts.isStringLiteralLike(values[0]) ||
            [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
              values[0].kind,
            )) &&
          evaluator.expressionBarrier(node) === 'continues'
        );
      }
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
    !call.questionDotToken &&
    call.arguments.length === 1 &&
    importedContract(
      call.expression,
      analysis,
      '@nocobase/app-server/router',
      'describeRoute',
    )
  )
    return pure(call.arguments[0]);
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
    if (!declaration.initializer) return false;
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
  // Reject ordinary application functions before traversing their arguments or dependency graphs.
  const tail = ts.isBlock(fn.body) ? fn.body.statements.at(-1) : fn.body;
  const result = tail && ts.isReturnStatement(tail) ? tail.expression : tail;
  if (
    !result ||
    !ts.isCallExpression(result) ||
    !importedContract(
      result.expression,
      analysis,
      '@nocobase/app-server/router',
      'describeRoute',
    ) ||
    (ts.isVariableDeclaration(declaration) && !analysis.immutable(declaration))
  )
    return false;
  // Function declarations can be rebound; immutable const factories are the supported boundary.
  if (
    (!ts.isVariableDeclaration(declaration) &&
      (!ts.isFunctionDeclaration(declaration) ||
        !analysis.directFunctionCalls(declaration))) ||
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
