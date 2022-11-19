import { CollectionManagerContext, registerField, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import { mathFormula } from './math-formula';
import { MathFormula } from './MathFormula';

registerField(mathFormula.group, 'mathFormula', mathFormula);

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <SchemaComponentOptions components={{ MathFormula }}>
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, mathFormula } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
});
