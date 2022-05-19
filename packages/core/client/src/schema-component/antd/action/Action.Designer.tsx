import { ISchema, useField, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { uid } from '@nocobase/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActionContext, useCompile, useDesignable } from '../..';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const ActionDesigner = (props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const compile = useCompile();
  const isPopupAction = ['create', 'update', 'view', 'customizePopup'].includes(fieldSchema['x-action'] || '');
  const context = useActionContext();
  const [initialSchema, setInitialSchema] = useState<{ uid: string; schema: ISchema }>();

  useEffect(() => {
    const schemaUid = uid();
    const schema: ISchema = {
      type: 'void',
      'x-uid': schemaUid,
      properties: {
        modal: {
          'x-component': 'Action.Modal',
          'x-component-props': {
            width: 520,
          },
          type: 'void',
          title: '{{ t("Assigned field value") }}',
          properties: {
            tip: {
              type: 'void',
              'x-editable': false,
              'x-decorator': 'FormItem',
              'x-component': 'Markdown.Void',
              'x-index': 0,
              'x-component-props': {
                content: '{{ t("Save assigned field value after click button") }}',
              },
            },
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'CustomFormItemInitializers',
              properties: {},
            },
            footer: {
              'x-component': 'Action.Modal.Footer',
              type: 'void',
              properties: {
                cancel: {
                  type: 'void',
                  title: '{{ t("Cancel") }}',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ useCancelAction }}',
                  },
                },
                submit: {
                  type: 'void',
                  title: '{{ t("Submit") }}',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    useAction: '{{ useSubmitAction }}',
                  },
                },
              },
            },
          },
        },
      },
    };
    setInitialSchema({ uid: schemaUid, schema });
  }, [field.address]);
  return (
    <GeneralSchemaDesigner {...props} disableInitializer>
      <SchemaSettings.ModalItem
        title={t('Edit button')}
        schema={
          {
            type: 'object',
            title: t('Edit button'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Button title'),
                default: fieldSchema.title,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
              icon: {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: t('Button icon'),
                default: fieldSchema?.['x-component-props']?.icon,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
            },
          } as ISchema
        }
        onSubmit={({ title, icon }) => {
          if (title) {
            fieldSchema.title = title;
            field.title = title;
            field.componentProps.icon = icon;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].icon = icon;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          }
        }}
      />
      {isPopupAction && (
        <SchemaSettings.SelectItem
          title={t('Open mode')}
          options={[
            { label: t('Drawer'), value: 'drawer' },
            { label: t('Dialog'), value: 'modal' },
          ]}
          value={fieldSchema?.['x-component-props']?.['openMode']}
          onChange={(value) => {
            field.componentProps.openMode = value;
            fieldSchema['x-component-props']['openMode'] = value;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          }}
        />
      )}

      {isValid(fieldSchema?.['x-action-settings']?.assignedValues) && (
        <SchemaSettings.ActionModalItem
          title={t('Assigned field value')}
          initialSchema={initialSchema}
          initialValues={fieldSchema?.['x-action-settings']?.assignedValues}
          uid={fieldSchema?.['x-action-settings']?.schemaUid}
          onSubmit={(assignedValues) => {
            fieldSchema['x-action-settings']['assignedValues'] = assignedValues;

            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-action-settings': fieldSchema['x-action-settings'],
              },
            });
            dn.refresh();
          }}
        />
      )}
      {isValid(fieldSchema?.['x-action-settings']?.skipValidator) && (
        <SchemaSettings.SwitchItem
          title={t('Skip required validation')}
          checked={!!fieldSchema?.['x-action-settings']?.skipValidator}
          onChange={(value) => {
            fieldSchema['x-action-settings'].skipValidator = value;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-action-settings': {
                  ...fieldSchema['x-action-settings'],
                },
              },
            });
          }}
        />
      )}
      {isValid(fieldSchema?.['x-action-settings']?.overwriteValues) && (
        <SchemaSettings.ModalItem
          title={t('Form values')}
          schema={
            {
              type: 'object',
              properties: {
                overwriteValues: {
                  title: t('When submitting the following fields, the saved values are'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  default: JSON.stringify(fieldSchema?.['x-action-settings']?.overwriteValues),
                },
              },
            } as ISchema
          }
          onSubmit={({ overwriteValues }) => {
            try {
              const values = JSON.parse(overwriteValues);
              fieldSchema['x-action-settings'].overwriteValues = values;
              dn.emit('patch', {
                schema: {
                  ['x-uid']: fieldSchema['x-uid'],
                  'x-action-settings': {
                    ...fieldSchema['x-action-settings'],
                  },
                },
              });
              dn.refresh();
            } catch (e) {}
          }}
        />
      )}
      {isValid(fieldSchema?.['x-action-settings']?.['onSuccess']) && (
        <SchemaSettings.ModalItem
          title={
            compile(fieldSchema?.['x-action-settings']?.['onSuccess']?.['title']) ?? t('After successful submission')
          }
          initialValues={fieldSchema?.['x-action-settings']?.['onSuccess']}
          schema={
            {
              type: 'object',
              title:
                compile(fieldSchema?.['x-action-settings']?.['onSuccess']?.['title']) ??
                t('After successful submission'),
              properties: {
                successMessage: {
                  // default: t('Submitted successfully!'),
                  title: t('Pop-up message'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  'x-component-props': {},
                },
                manualClose: {
                  title: t('Popup close method'),
                  default: false,
                  enum: [
                    { label: t('Auto close'), value: false },
                    { label: t('Manual close'), value: true },
                  ],
                  'x-decorator': 'FormItem',
                  'x-component': 'Radio.Group',
                  'x-component-props': {},
                },
                redirecting: {
                  title: t('Then'),
                  default: false,
                  enum: [
                    { label: t('Stay on current page'), value: false },
                    { label: t('Redirect to'), value: true },
                  ],
                  'x-decorator': 'FormItem',
                  'x-component': 'Radio.Group',
                  'x-component-props': {},
                  'x-reactions': {
                    target: 'redirectTo',
                    fulfill: {
                      state: {
                        visible: '{{!!$self.value}}',
                      },
                    },
                  },
                },
                redirectTo: {
                  title: t('Link'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {},
                },
              },
            } as ISchema
          }
          onSubmit={(onSuccess) => {
            fieldSchema['x-action-settings']['onSuccess'] = onSuccess;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-action-settings': fieldSchema['x-action-settings'],
              },
            });
          }}
        />
      )}
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
        }}
        confirm={{
          title: t('Delete action'),
        }}
      />
    </GeneralSchemaDesigner>
  );
};
