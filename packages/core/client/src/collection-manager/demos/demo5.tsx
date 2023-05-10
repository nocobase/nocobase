import { FormDrawer, FormLayout } from '@formily/antd';
import { createForm } from '@formily/core';
import { FormContext, ISchema, SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import {
  AntdSchemaComponentProvider,
  CardItem,
  CollectionManagerContext,
  CollectionManagerProvider,
  CollectionProvider,
  FormItem,
  Grid,
  Input,
  InputNumber,
  Markdown,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerProvider,
  useCollectionManager,
} from '@nocobase/client';
import cloneDeep from 'lodash/cloneDeep';
import React, { useContext } from 'react';

const collection: any = {
  name: 'posts',
  fields: [],
};

const schema: ISchema = {
  type: 'object',
  properties: {
    grid: {
      type: 'void',
      'x-component': 'Grid',
      'x-read-pretty': true,
      'x-initializer': 'AddFieldButton',
      'x-uid': uid(),
      properties: {},
    },
  },
};

const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

const form = createForm({
  initialValues: {},
  // readPretty: true,
});

const FormItemInitializer = (props) => {
  const { item, insert } = props;
  const { getInterface } = useCollectionManager();
  const schemaOptions = useContext(SchemaOptionsContext);
  const cm = useContext(CollectionManagerContext);
  return (
    <SchemaInitializer.Item
      onClick={async () => {
        const interfaceOptions = getInterface(item.fieldInterface);
        if (!interfaceOptions) {
          return;
        }
        const name = `f_${uid()}`;
        const options = cloneDeep(interfaceOptions.default);
        options.name = name;
        options.uiSchema.title = name;
        collection.fields.push(options);
        form.setValuesIn(name, uid());

        const { values } = await FormDrawer('Add field', () => {
          return (
            <CollectionManagerContext.Provider value={cm}>
              <AntdSchemaComponentProvider>
                <SchemaComponentOptions scope={schemaOptions.scope} components={schemaOptions.components}>
                  <FormLayout layout={'vertical'}>
                    <SchemaComponent
                      schema={{
                        properties: interfaceOptions.properties,
                      }}
                    />
                  </FormLayout>
                </SchemaComponentOptions>
              </AntdSchemaComponentProvider>
            </CollectionManagerContext.Provider>
          );
        }).open({
          initialValues: {},
        });

        insert({
          name,
          type: 'string',
          'x-component': 'CollectionField',
          'x-collection-field': `posts.${name}`,
          'x-component-props': {},
          'x-decorator': 'FormItem',
          'x-designer': 'FormItem.Designer',
        });
      }}
    />
  );
};

export const AddFieldButton = (props: any) => {
  const { insertPosition = 'beforeEnd', component } = props;
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={insertPosition}
      items={[
        {
          key: 'media',
          type: 'itemGroup',
          title: 'Field interfaces',
          children: [
            {
              key: 'singleText',
              type: 'item',
              title: 'Single text',
              fieldInterface: 'input',
              component: FormItemInitializer,
            },
          ],
        },
      ]}
      component={component}
      title={component ? undefined : 'Add Field'}
    />
  );
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ Grid, CardItem, Markdown, InputNumber, FormItem, Input }}>
      <SchemaInitializerProvider initializers={{ AddFieldButton }}>
        <CollectionManagerProvider>
          <CollectionProvider collection={collection}>
            <FormContext.Provider value={form}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent schema={schema} />
              </FormLayout>
            </FormContext.Provider>
          </CollectionProvider>
        </CollectionManagerProvider>
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
