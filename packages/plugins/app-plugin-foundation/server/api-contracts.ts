import ts from 'typescript';
import type { FoundationApiCondition } from '../shared/foundation.js';
import type { SourceEvidence } from './source-evidence.js';
import { returned } from './request-evidence.js';

/** Match a value import's identity, not the spelling of a local function or variable. */
export function importedContract(
  node: ts.Node,
  analysis: SourceEvidence,
  module: string,
  name: string,
): boolean {
  return (analysis.symbol(node)?.declarations ?? []).some((declaration) => {
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
      statement.moduleSpecifier.text === module
    );
  });
}

/** The host supplies the first parameter of an inline defineApiRoutes callback. */
function application(node: ts.Node, analysis: SourceEvidence): boolean {
  return analysis.declarations(node).some((declaration) => {
    if (!ts.isParameter(declaration)) return false;
    const fn = declaration.parent;
    return (
      ts.isArrowFunction(fn) &&
      fn.parameters[0] === declaration &&
      ts.isCallExpression(fn.parent) &&
      fn.parent.arguments[0] === fn &&
      importedContract(
        fn.parent.expression,
        analysis,
        '@nocobase/app-server/router',
        'defineApiRoutes',
      )
    );
  });
}

function containerCall(
  node: ts.Node,
  method: string,
  module: string,
  token: string,
  analysis: SourceEvidence,
): boolean {
  if (
    !ts.isCallExpression(node) ||
    node.questionDotToken ||
    node.arguments.length !== 1 ||
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.questionDotToken ||
    node.expression.name.text !== method
  )
    return false;
  const container = node.expression.expression;
  return (
    ts.isPropertyAccessExpression(container) &&
    !container.questionDotToken &&
    container.name.text === 'container' &&
    application(container.expression, analysis) &&
    importedContract(node.arguments[0], analysis, module, token)
  );
}

export const databaseAvailable: FoundationApiCondition = {
  kind: 'databaseAvailable',
  source: '@nocobase/db#databaseManagerToken',
};

/** Select only the available side of one database guard with an early mount return and a final mount return. */
export function databaseSuccessGuard(
  fn: ts.SignatureDeclaration,
  analysis: SourceEvidence,
): ts.IfStatement | undefined {
  if (!('body' in fn) || !fn.body || !ts.isBlock(fn.body)) return undefined;
  const returns = returned(fn);
  if (returns.length !== 2) return undefined;
  const final = fn.body.statements.at(-1);
  if (
    !final ||
    !ts.isReturnStatement(final) ||
    !final.expression ||
    returns[1] !== final.expression
  )
    return undefined;
  const guard = fn.body.statements.find(
    (statement): statement is ts.IfStatement =>
      ts.isIfStatement(statement) &&
      !statement.elseStatement &&
      ts.isPrefixUnaryExpression(statement.expression) &&
      statement.expression.operator === ts.SyntaxKind.ExclamationToken &&
      containerCall(
        statement.expression.operand,
        'has',
        '@nocobase/db',
        'databaseManagerToken',
        analysis,
      ),
  );
  if (!guard || !ts.isBlock(guard.thenStatement)) return undefined;
  // Before the guard, accept router construction and the framework error adapter only.
  // Opaque setup could replace the host container or register an earlier request path.
  const routers = new Set<ts.Node>();
  for (const statement of fn.body.statements) {
    if (statement === guard) break;
    if (ts.isEmptyStatement(statement)) continue;
    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.flags & ts.NodeFlags.Const
    ) {
      for (const declaration of statement.declarationList.declarations) {
        const value = declaration.initializer;
        if (
          !value ||
          !ts.isNewExpression(value) ||
          value.arguments?.length ||
          !importedContract(value.expression, analysis, 'hono', 'Hono')
        )
          return undefined;
        routers.add(value);
      }
      continue;
    }
    const call = ts.isExpressionStatement(statement)
      ? statement.expression
      : undefined;
    if (
      call &&
      ts.isCallExpression(call) &&
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === 'onError' &&
      call.arguments.length === 1 &&
      analysis.values(call.expression.expression).length === 1 &&
      analysis
        .values(call.expression.expression)
        .every((value) => routers.has(value)) &&
      importedContract(
        call.arguments[0],
        analysis,
        '@nocobase/app-server/router',
        'apiErrorHandler',
      )
    )
      continue;
    return undefined;
  }
  const exit = guard.thenStatement.statements.at(-1);
  if (!exit || !ts.isReturnStatement(exit) || exit.expression !== returns[0])
    return undefined;
  // Both paths must return the same mounted router and child, not unrelated factories or dynamic mounts.
  const mount = (
    node: ts.Node,
  ): { owner: ts.Node; child: ts.Node; prefix: string } | undefined => {
    if (
      !ts.isCallExpression(node) ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.name.text !== 'route' ||
      node.arguments.length !== 2 ||
      !ts.isStringLiteralLike(node.arguments[0])
    )
      return undefined;
    const owner = analysis.values(node.expression.expression);
    const child = analysis.values(node.arguments[1]);
    return owner.length === 1 && child.length === 1
      ? { owner: owner[0], child: child[0], prefix: node.arguments[0].text }
      : undefined;
  };
  const early = mount(returns[0]),
    normal = mount(returns[1]);
  if (
    !early ||
    !normal ||
    !routers.has(early.owner) ||
    !routers.has(early.child) ||
    early.owner !== normal.owner ||
    early.child !== normal.child ||
    early.prefix !== normal.prefix
  )
    return undefined;
  return guard;
}

/** Only the exact framework middleware contracts needed by the guarded request path are recognized. */
export function middlewareContract(
  handler: ts.Node,
  analysis: SourceEvidence,
):
  | {
      conditions: readonly FoundationApiCondition[];
      providers?: readonly string[];
    }
  | undefined {
  const values = analysis.values(handler);
  if (values.length !== 1 || !ts.isCallExpression(values[0])) return undefined;
  const call = values[0];
  if (call.questionDotToken || call.arguments.some(ts.isSpreadElement))
    return undefined;
  if (
    importedContract(
      call.expression,
      analysis,
      '@nocobase/app-server/router',
      'describeRoute',
    ) &&
    call.arguments.length === 1
  )
    return { conditions: [] };
  if (
    importedContract(
      call.expression,
      analysis,
      '@nocobase/app-server/router',
      'apiValidator',
    ) &&
    call.arguments.length === 2 &&
    ts.isStringLiteralLike(call.arguments[0]) &&
    ['query', 'json', 'param', 'header', 'form', 'cookie'].includes(
      call.arguments[0].text,
    )
  )
    return {
      conditions: [
        {
          kind: 'validInput',
          source: '@nocobase/app-server/router#apiValidator',
        },
      ],
    };
  if (
    importedContract(
      call.expression,
      analysis,
      'hono/body-limit',
      'bodyLimit',
    ) &&
    call.arguments.length === 1
  )
    return {
      conditions: [
        { kind: 'bodyWithinLimit', source: 'hono/body-limit#bodyLimit' },
      ],
    };
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    !call.expression.questionDotToken &&
    call.expression.name.text === 'required' &&
    call.arguments.length === 0
  ) {
    const receivers = analysis.values(call.expression.expression);
    if (
      receivers.length === 1 &&
      containerCall(
        receivers[0],
        'resolve',
        '@nocobase/app-plugin-authentication',
        'authenticationToken',
        analysis,
      )
    )
      return {
        providers: ['@nocobase/app-plugin-authentication'],
        conditions: [
          {
            kind: 'authenticated',
            source:
              '@nocobase/app-plugin-authentication#authenticationToken.required',
          },
        ],
      };
  }
  return undefined;
}
