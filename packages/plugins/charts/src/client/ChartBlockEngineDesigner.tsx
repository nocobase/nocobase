import { ISchema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CollectionManagerContext,
  GeneralSchemaDesigner, SchemaComponent, SchemaComponentOptions,
  SchemaSettings,
  useAPIClient,
  useCollectionManager,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import { FormDialog, FormLayout } from '@formily/antd';
import { Options } from './ChartBlockInitializer';
import { templates } from './templates';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
  message: '{{t("Invalid JSON format")}}',
};

export const ChartBlockEngineDesigner = () => {
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const compile = useCompile();
  const api = useAPIClient();
  const options = useContext(SchemaOptionsContext);
  const {chartBlockMetaData ,renderComponent} = fieldSchema?.['x-component-props']
  return (
    <GeneralSchemaDesigner>
      <ChartBlockEngineDesignerInitializer
        chartBlockMetaData={chartBlockMetaData}
        renderComponent={renderComponent}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export const ChartBlockEngineDesignerInitializer = (props) => {
  const {chartBlockMetaData ,renderComponent,effects} = props
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { dn } = useDesignable();
  const { getCollectionFields } = useCollectionManager();
  const collectionFields = getCollectionFields(chartBlockMetaData.collectionName);
  const fieldSchema = useFieldSchema();
  const cm = useContext(CollectionManagerContext);
  const field = useField();
  const computedFields = collectionFields
    ?.filter((field) => (field.type === 'double' || field.type === 'bigInt'))
    ?.map((field) => {
      return {
        label: field.name,
        value: field.name,
      };
    });
  return (
    <SchemaSettings.Item
      onClick={async () => {
        FormDialog("Edit chart block", (form) => {
          return (
            <CollectionManagerContext.Provider value={cm}>
              <SchemaComponentOptions
                scope={options.scope}
                components={{ ...options.components }}
              >
                <FormLayout layout={'vertical'}>
                  <SchemaComponent
                    scope={{ computedFields: computedFields || [] }}
                    components={{ Options }}
                    schema={{
                      properties: {
                        chartType: {
                          title: t('Chart type'),
                          required: true,
                          'x-component': 'Select',
                          'x-decorator': 'FormItem',
                          enum: [...templates.values()].map((template) => {
                            return {
                              label: template.type,
                              value: template.type,
                            };
                          }),
                        },
                        options: {
                          type: 'void',
                          'x-component': 'Options',
                        },
                      },
                    }}
                  />
                </FormLayout>
              </SchemaComponentOptions>
            </CollectionManagerContext.Provider>
          );
        })
          .open({
            initialValues: chartBlockMetaData,//reset before chartBlockMetaData
          })
          .then((values) => {
            //patch updates
            field.componentProps.renderComponent=renderComponent
            field.componentProps.chartBlockMetaData = values;
            fieldSchema['x-component-props'].chartBlockMetaData = values;
            fieldSchema['x-component-props'].renderComponent = renderComponent;

            dn.emit("patch",{
              schema:{
               title:"update",
               'x-uid':fieldSchema['x-uid'],
                'x-component-props':fieldSchema["x-component-props"]
              }
            })
            dn.refresh()
          });
      }}
    >
      {props.children || props.title || "Edit block "}
    </SchemaSettings.Item>

  );
};
