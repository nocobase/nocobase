import { evaluate } from '.';

export default evaluate.bind(
  function (expression: string, scope = {}) {
    return expression;
  },
  { replaceValue: true },
);
