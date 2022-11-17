import { connect } from '@formily/react';
import { Formula } from '@nocobase/client';
import { evaluate } from 'mathjs';
import React from 'react';

export const MathFormula: any = () => null;

MathFormula.Result = React.createElement(Formula.Result, {
  evaluate,
});

MathFormula.Expression = connect((props) => {
  return React.createElement(Formula.Expression, {
    ...props,
    evaluate,
  });
});
