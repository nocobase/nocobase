import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MathFormula } from './MathFormula';

export const MathFormulaFieldProvider = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <SchemaComponentOptions
      scope={{
        mathExpressionDescription: (
          <div>
            {t('Syntax see', { ns: 'math-formula-field' })}{' '}
            <a target={'_blank'} href={'https://mathjs.org/docs/expressions/syntax.html'} rel="noreferrer">
              math.js
            </a>
          </div>
        ),
      }}
      components={{ MathFormula }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
});
MathFormulaFieldProvider.displayName = 'MathFormulaFieldProvider';
