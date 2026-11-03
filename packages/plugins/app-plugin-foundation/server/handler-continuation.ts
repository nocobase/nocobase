import ts from 'typescript';
import type { SourceEvidence } from './source-evidence.js';

export type Continuation = 'next' | 'stop' | 'unknown';

/** Recognize a direct, unconditional next call only. Never interpret arbitrary handler control flow. */
export function handlerContinuation(
  handler: ts.Node,
  analysis: SourceEvidence,
): Continuation {
  const values = analysis.values(handler);
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
  for (const statement of fn.body.statements) {
    if (
      (ts.isExpressionStatement(statement) ||
        ts.isReturnStatement(statement)) &&
      statement.expression &&
      direct(statement.expression)
    )
      return references === 1 ? 'next' : 'unknown';
    // Only a straight-line prefix can establish that the direct call is reached.
    if (
      !ts.isVariableStatement(statement) &&
      !ts.isExpressionStatement(statement) &&
      !ts.isFunctionDeclaration(statement) &&
      !ts.isEmptyStatement(statement)
    )
      return 'unknown';
    let usesNext = false;
    const inspect = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && analysis.symbol(node) === symbol)
        usesNext = true;
      ts.forEachChild(node, inspect);
    };
    inspect(statement);
    if (usesNext) return 'unknown';
  }
  return 'unknown';
}
