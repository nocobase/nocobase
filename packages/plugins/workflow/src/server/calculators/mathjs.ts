import { evaluate } from 'mathjs';
import { parseExpression, Scope } from '..';



export default function(expression: string, scope?: Scope) {
  return evaluate(parseExpression(expression, scope));
}
