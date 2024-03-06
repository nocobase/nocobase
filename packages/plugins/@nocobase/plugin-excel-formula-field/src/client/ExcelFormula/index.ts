import { connect, observer } from '@formily/react';
import { Formula } from '@nocobase/client';
import React from 'react';
import { evaluate } from '../../utils/evaluate';

export const ExcelFormula: any = () => null;

ExcelFormula.Result = observer(
  (props) =>
    React.createElement(Formula.Result, {
      ...props,
      evaluate,
    }),
  { displayName: 'ExcelFormula.Result' },
);

ExcelFormula.Expression = connect((props) => {
  return React.createElement(Formula.Expression, {
    ...props,
    evaluate,
  });
});

ExcelFormula.Expression.displayName = 'ExcelFormula.Expression';
