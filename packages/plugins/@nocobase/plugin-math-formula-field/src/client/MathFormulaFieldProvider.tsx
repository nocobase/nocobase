import { CollectionManagerContext, registerField, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { mathFormula } from './math-formula';
import { MathFormula } from './MathFormula';

registerField(mathFormula.group, 'mathFormula', mathFormula);

export const MathFormulaFieldProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
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
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, mathFormula } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});
MathFormulaFieldProvider.displayName = 'MathFormulaFieldProvider';
