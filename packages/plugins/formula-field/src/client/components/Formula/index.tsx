import { connect, mapReadPretty } from '@formily/react';

import Expression from './Expression';
import Result from './Result';

export const Formula = () => null;

Formula.Expression = Expression;
Formula.Result = connect(Result, mapReadPretty(Result.ReadPretty));

export default Formula;
