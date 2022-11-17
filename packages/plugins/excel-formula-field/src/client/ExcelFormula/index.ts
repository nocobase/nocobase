import { connect } from '@formily/react';
import { Formula } from '@nocobase/client';
import React from 'react';
import { evaluate } from '../../utils/evaluate';

export const ExcelFormula: any = () => null;

ExcelFormula.Result = React.createElement(Formula.Result, {
  evaluate,
});

ExcelFormula.Expression = connect((props) => {
  return React.createElement(Formula.Expression, {
    ...props,
    evaluate,
  });
});
