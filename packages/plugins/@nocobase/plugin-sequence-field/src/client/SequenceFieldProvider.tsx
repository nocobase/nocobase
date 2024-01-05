import React, { FC } from 'react';

import { CollectionManagerProvider, registerField, SchemaComponentOptions } from '@nocobase/client';

import { RuleConfigForm, sequence } from './sequence';

registerField(sequence.group, 'sequence', sequence);

export const SequenceFieldProvider: FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        RuleConfigForm,
      }}
    >
      <CollectionManagerProvider interfaces={{ sequence }}>{props.children}</CollectionManagerProvider>
    </SchemaComponentOptions>
  );
};
