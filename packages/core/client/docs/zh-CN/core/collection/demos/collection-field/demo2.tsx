import { ISchema, observer } from '@formily/react';
import {
  Application,
  CollectionProviderV2,
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
            'x-component': 'CollectionFieldV2',
            'x-decorator': 'FormItem',
            'x-settings': 'FormItemSettings',
          },
        },
      },
    },
  };

  return (
    <CollectionProviderV2 name="tests">
      <SchemaComponent schema={schema} />
    </CollectionProviderV2>
  );
});

const formSettings = new SchemaSettings({
  name: 'FormItemSettings',
  items: [
    {
      name: 'required',
      type: 'switch',
      useComponentProps() {
        // const { uiSchema } = useCollectionFieldV2(); // 报错
        return {
          checked: true,
          // checked: !!uiSchema?.required,
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
  collectionManager: {
    collections: [collection],
    collectionMixins: [InheritanceCollectionMixin],
  },
  schemaSettings: [formSettings],
  designable: true,
});

export default app.getRootComponent();
