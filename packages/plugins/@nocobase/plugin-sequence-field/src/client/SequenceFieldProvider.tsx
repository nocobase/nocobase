import React, { FC } from 'react';

import { SchemaComponentOptions } from '@nocobase/client';

import { RuleConfigForm } from './sequence';

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
