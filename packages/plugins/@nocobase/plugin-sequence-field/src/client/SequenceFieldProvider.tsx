import React, { FC, useContext } from 'react';

import { registerField, SchemaComponentOptions } from '@nocobase/client';

import { RuleConfigForm, sequence } from './sequence';

registerField(sequence.group, 'sequence', sequence);

export const SequenceFieldProvider: FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        RuleConfigForm,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
