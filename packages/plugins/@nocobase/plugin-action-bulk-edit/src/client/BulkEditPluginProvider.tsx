import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CustomizeBulkEditActionInitializer } from './CustomizeBulkEditActionInitializer';
import { CreateFormBulkEditBlockInitializer } from './CreateFormBulkEditBlockInitializer';

export const BulkEditPluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{
        CustomizeBulkEditActionInitializer,
        CreateFormBulkEditBlockInitializer,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
