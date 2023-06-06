import { connect, observer } from '@formily/react';
import { Formula } from '@nocobase/client';
import React from 'react';
import { evaluate } from '../../utils/evaluate';

export const MathFormula: any = () => null;

MathFormula.Result = observer(
  (props) =>
    React.createElement(Formula.Result, {
      ...props,
      evaluate,
    }),
  { displayName: 'MathFormula.Result' },
);

MathFormula.Expression = connect((props) => {
  return React.createElement(Formula.Expression, {
    ...props,
    evaluate,
  });
});
