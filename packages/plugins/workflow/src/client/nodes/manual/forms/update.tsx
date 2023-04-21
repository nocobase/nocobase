import React, { useState } from 'react';
import { useForm, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';

import {
  ActionContext,
  CollectionProvider,
  createFormBlockSchema,
  GeneralSchemaDesigner,
  RecordProvider,
  SchemaComponent,
  SchemaInitializer,
  SchemaSettings,
  useCollection,
  useCollectionFilterOptions,
  useCollectionManager,
  useCompile,
  useDesignable,
  useRecord
} from "@nocobase/client";

import { NAMESPACE } from "../../../locale";
import { JOB_STATUS } from '../../../constants';
import { findSchema } from '../SchemaConfig';
import { FilterDynamicComponent } from '../../../components/FilterDynamicComponent';


function UpdateFormDesigner() {
  const { name, title } = useCollection();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();

  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.ActionModalItem
        title={t('Filter settings', { ns: NAMESPACE })}
        schema={{
          name: 'filter',
          type: 'object',
          title: `{{t("Filter")}}`,
          // 'x-decorator': 'FormItem',
          'x-component': 'Filter',
          'x-component-props': {
            useProps() {
              const options = useCollectionFilterOptions(fieldSchema?.['x-decorator-props']?.collection);
              return {
                options,
              };
            },
            dynamicComponent: 'FilterDynamicComponent'
          },
        }}
        initialValues={fieldSchema?.['x-decorator-props']}
        onSubmit={({ filter }) => {
          fieldSchema['x-decorator-props'].filter = filter;
          dn.emit('patch', {
            schema: {
              // ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.LinkageRules collectionName={name} />
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

function UpdateFormBlockProvider({ collection, children }) {
  const record = useRecord() ?? {};

  return (
    <CollectionProvider collection={collection}>
      <RecordProvider record={record}>
        {children}
      </RecordProvider>
    </CollectionProvider>
  );
}

function UpdateFormBlockInitializer({ insert, ...props }) {
  const compile = useCompile();
  const { collections } = useCollectionManager();
  const [visible, setVisible] = useState(false);

  function onOpen() {
    setVisible(true);
  }

  function onConfirm(config) {
    const schema = createFormBlockSchema({
      title: `{{t("Update record", { ns: "${NAMESPACE}" })}}`,
      collection: config?.collection,
      actionInitializers: 'AddActionButton',
      action: 'get',
      actions: {
        resolve: {
          type: 'void',
          title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'ManualActionStatusProvider',
          'x-decorator-props': {
            value: JOB_STATUS.RESOLVED
          },
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
            useAction: '{{ useSubmit }}',
          },
          'x-designer': 'Action.Designer',
          'x-action': `${JOB_STATUS.RESOLVED}`,
        }
      }
    });
    Object.assign(schema, {
      'x-decorator': 'UpdateFormBlockProvider',
      'x-decorator-props': config,
      'x-designer': 'UpdateFormDesigner',
    });

    insert(schema);
    setVisible(false);
  }

  return (
    <>
      <SchemaInitializer.Item
        {...props}
        onClick={onOpen}
      />
      <ActionContext.Provider value={{ visible, setVisible, openSize: 'small' }}>
        <SchemaComponent
          schema={{
            type: 'void',
            name: 'drawer',
            title: `{{t("Select collection and data scope", { ns: "${NAMESPACE}" })}}`,
            'x-decorator': 'Form',
            'x-component': 'Action.Modal',
            properties: {
              collection: {
                type: 'string',
                title: `{{t("Collection")}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                enum: collections.map(item => ({
                  label: compile(item.title),
                  value: item.name,
                }))
              },
              filter: {
                type: 'object',
                title: `{{t("Filter")}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Filter',
                'x-component-props': {
                  useProps() {
                    const { values } = useForm();
                    const options = useCollectionFilterOptions(values?.collection);
                    return {
                      options,
                    };
                  },
                  dynamicComponent: 'FilterDynamicComponent'
                },
              },
              footer: {
                type: 'void',
                'x-component': 'Action.Modal.Footer',
                properties: {
                  cancel: {
                    type: 'void',
                    title: `{{t("Cancel")}}`,
                    'x-component': 'Action',
                    'x-component-props': {
                      useAction() {
                        const form = useForm();
                        return {
                          async run() {
                            setVisible(false);
                            form.reset();
                          },
                        };
                      }
                    }
                  },
                  submit: {
                    type: 'void',
                    title: `{{t("Confirm")}}`,
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'primary',
                      useAction() {
                        const form = useForm();
                        return {
                          async run() {
                            onConfirm(form.values);
                            setVisible(false);
                            form.reset();
                          },
                        };
                      }
                    }
                  }
                }
              }
            }
          }}
        />
      </ActionContext.Provider>
    </>
  );
}



export default {
  title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
  config: {
    initializer: {
      key: 'updateRecordForm',
      type: 'item',
      title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
      component: UpdateFormBlockInitializer,
    },
    initializers: {
      // AddCustomFormField
    },
    components: {
      UpdateFormBlockProvider,
      FilterDynamicComponent,
      UpdateFormDesigner
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(root, item => item['x-decorator'] === 'UpdateFormBlockProvider');
      formBlocks.forEach(formBlock => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        forms[formKey] = {
          ...formBlock['x-decorator-props'],
          type: 'update',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, item => item['x-component'] === 'Action')
            .map(item => item['x-decorator-props'].value),
        };
      });
      return forms;
    }
  },
  block: {
    scope: {
      // useFormBlockProps
    },
    components: {
      UpdateFormBlockProvider
    }
  }
};
