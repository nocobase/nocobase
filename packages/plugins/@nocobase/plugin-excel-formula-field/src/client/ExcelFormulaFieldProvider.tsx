import { registerField, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExcelFormula } from './ExcelFormula';
import { excelFormulaFieldInterface } from './excel-formula';

registerField(excelFormulaFieldInterface.group, 'excelFormula', excelFormulaFieldInterface.getOptions());

export const ExcelFormulaFieldProvider = React.memo((props) => {
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
      {props.children}
    </SchemaComponentOptions>
  );
});

ExcelFormulaFieldProvider.displayName = 'ExcelFormulaFieldProvider';
