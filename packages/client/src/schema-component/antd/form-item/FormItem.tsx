import { FormItem as Item } from '@formily/antd';
import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { BlockItem } from '../block-item';

export const FormItem: any = (props) => {
  return (
    <BlockItem className={'nb-form-item'}>
      <Item {...props} />
    </BlockItem>
  );
};

FormItem.Designer = () => {
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
