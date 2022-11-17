import { connect } from '@formily/react';
import { Formula } from '@nocobase/client';
import { evaluate } from 'mathjs';
import React from 'react';

export const MathFormula: any = () => null;

MathFormula.Result = connect((props) =>
  React.createElement(Formula.Result, {
    ...props,
    evaluate,
  }),
);

MathFormula.Expression = connect((props) => {
  return React.createElement(Formula.Expression, {
    ...props,
    evaluate,
  });
});
