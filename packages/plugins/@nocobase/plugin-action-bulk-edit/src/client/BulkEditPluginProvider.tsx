import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CustomizeBulkEditActionInitializer } from './CustomizeBulkEditActionInitializer';
import { CreateFormBulkEditBlockInitializer } from './CreateFormBulkEditBlockInitializer';
import { BulkEditSubmitActionInitializer } from './BulkEditSubmitActionInitializer';
import { useCustomizeBulkEditActionProps } from './utils';
import { BulkEditField } from './component/BulkEditField';
export const BulkEditPluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{
        CustomizeBulkEditActionInitializer,
        CreateFormBulkEditBlockInitializer,
        BulkEditSubmitActionInitializer,
        BulkEditField,
      }}
      scope={{ useCustomizeBulkEditActionProps }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
