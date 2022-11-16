import { CollectionManagerContext, registerField, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import { ExcelFunction } from './excel-function';
import { excelFunction } from './interfaces/excelFunction';

registerField(excelFunction.group, 'excelFunction', excelFunction);

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions components={{ ExcelFunction }}>
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, excelFunction } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});
