import React, { FC, useContext } from 'react';

import { registerField, CollectionManagerContext, SchemaComponentOptions } from '@nocobase/client';

import { RuleConfigForm, sequence } from './sequence';

registerField(sequence.group, 'sequence', sequence);

export const SequenceFieldProvider: FC = (props) => {
  const ctx = useContext(CollectionManagerContext);

  return (
    <SchemaComponentOptions
      components={{
        RuleConfigForm,
      }}
    >
      <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, sequence } }}>
        {props.children}
      </CollectionManagerContext.Provider>
    </SchemaComponentOptions>
  );
};
