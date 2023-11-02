import { connect } from '@formily/react';

import Expression from './Expression';
import Result from './Result';

export const NumberToWords = () => null;

NumberToWords.Expression = Expression;
NumberToWords.Result = connect(Result);

export default NumberToWords;