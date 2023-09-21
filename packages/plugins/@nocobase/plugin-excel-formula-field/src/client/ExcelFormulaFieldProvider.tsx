import { CollectionManagerContext, registerField, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { excelFormula } from './excel-formula';
import { ExcelFormula } from './ExcelFormula';

registerField(excelFormula.group, 'excelFormula', excelFormula);

export const ExcelFormulaFieldProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  const { t } = useTranslation();

  return (
    <SchemaComponentOptions
      scope={{
        excelExpressionDescription: (
          <div>
            {t('Syntax see', { ns: 'math-formula-field' })}{' '}
            <a target={'_blank'} href={'https://formulajs.info/functions/'} rel="noreferrer">
              formula.js
            </a>
          </div>
        ),
      }}
      components={{
        ExcelFormula,
      }}
    >
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, excelFormula } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});

ExcelFormulaFieldProvider.displayName = 'ExcelFormulaFieldProvider';
