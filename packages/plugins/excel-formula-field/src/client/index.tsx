import { CollectionManagerContext, registerField, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import { excelFormula } from './excel-formula';
import { ExcelFormula } from './ExcelFormula';

registerField(excelFormula.group, 'excelFormula', excelFormula);

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions components={{ ExcelFormula }}>
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, excelFormula } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});
