import { ISchema, observer } from '@formily/react';
import {
  Application,
  CollectionProvider,
  Form,
  FormItem,
  InheritanceCollectionMixin,
  Input,
  SchemaComponent,
  SchemaSettings,
} from '@nocobase/client';
import React from 'react';

const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'title1',
      interface: 'input',
      uiSchema: {
        title: 'Title1',
        type: 'string',
        'x-component': 'Input',
        required: true,
        description: 'description1',
      } as ISchema,
    },
  ],
};

const Root = observer(() => {
  const schema: ISchema = {
    type: 'object',
    properties: {
      form1: {
        type: 'void',
        'x-component': 'Form',
        properties: {
          title1: {
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-settings': 'FormItemSettings',
          },
        },
      },
    },
  };

  return (
    <CollectionProvider name="tests">
      <SchemaComponent schema={schema} />
    </CollectionProvider>
  );
});

const formSettings = new SchemaSettings({
  name: 'FormItemSettings',
  items: [
    {
      name: 'required',
      type: 'switch',
      useComponentProps() {
        // const collectionField = useCollectionField(); // 报错
        return {
          checked: true,
          // checked: !!collectionField?.uiSchema?.required,
          title: 'Required',
          onChange(v) {
            // ?
          },
        };
      },
    },
  ],
});

const app = new Application({
  providers: [Root],
  components: { Form, Input, FormItem },
  dataSourceManager: {
    collections: [collection],
    collectionMixins: [InheritanceCollectionMixin],
  },
  schemaSettings: [formSettings],
  designable: true,
});

export default app.getRootComponent();
