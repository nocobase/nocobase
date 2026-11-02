import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';
import { StaticValues } from './static-values.js';

export type Continuation = 'next' | 'stop' | 'unknown';

/** Recognize next through a completed prefix or one owned native body limiter; opaque continuations stay unknown. */
export function handlerContinuation(
  handler: ts.Node,
  analysis: SourceEvidence,
  resolver: StaticValues = new StaticValues(analysis),
): Continuation {
  const values = resolver.values(handler);
  if (values.length !== 1) return 'unknown';
  const fn = values[0];
  if (!ts.isFunctionLike(fn) || !('body' in fn) || !fn.body) return 'unknown';
  if (fn.parameters.some((parameter) => parameter.dotDotDotToken))
    return 'unknown';
  let reflective = false;
  const inspectArguments = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === 'arguments') reflective = true;
    ts.forEachChild(node, inspectArguments);
  };
  inspectArguments(fn.body);
  if (reflective) return 'unknown';
  const parameter = fn.parameters[1];
  if (!parameter) return 'stop';
  if (!ts.isIdentifier(parameter.name)) return 'unknown';
  const symbol = analysis.symbol(parameter.name);
  let references = 0;
  const count = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && analysis.symbol(node) === symbol) references++;
    ts.forEachChild(node, count);
  };
  count(fn.body);
  if (!references) return 'stop';
  const direct = (node: ts.Node): boolean => {
    while (ts.isAwaitExpression(node) || ts.isParenthesizedExpression(node))
      node = node.expression;
    return (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      analysis.symbol(node.expression) === symbol &&
      !node.questionDotToken &&
      node.arguments.length === 0
    );
  };
  if (!ts.isBlock(fn.body)) return direct(fn.body) ? 'next' : 'unknown';
  let context = resolver;
  for (const statement of fn.body.statements) {
    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.length === 1
    ) {
      let call: ts.Node | undefined =
        statement.declarationList.declarations[0].initializer;
      if (call && ts.isAwaitExpression(call)) call = call.expression;
      if (
        call &&
        ts.isCallExpression(call) &&
        context.bodyLimitInvocation(call)
      )
        return 'next';
    }
    if (
      (ts.isExpressionStatement(statement) ||
        ts.isReturnStatement(statement)) &&
      statement.expression &&
      direct(statement.expression)
    )
      return references === 1 ? 'next' : 'unknown';
    // An early refusal continues only on the proven successful guard edge. Unknown calls and writes still block.
    if (context.statementBarrier(statement) !== 'continues') return 'unknown';
    context = context.fork(context.afterStatement(statement));
  }
  return 'unknown';
}
