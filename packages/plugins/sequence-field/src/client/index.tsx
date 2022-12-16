import React, { useContext } from 'react';

import { registerField, CollectionManagerContext, SchemaComponentOptions } from '@nocobase/client';

import { RuleConfigForm, sequence } from './sequence';

registerField(sequence.group, 'sequence', sequence);

export default function (props) {
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
}
