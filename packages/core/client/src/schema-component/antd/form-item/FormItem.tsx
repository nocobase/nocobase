import { PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { FormItem as Item } from '@formily/antd';
import { Field } from '@formily/core';
import { ISchema, Schema, useField, useFieldSchema, useForm } from '@formily/react';
import { Dropdown, Menu, Switch } from 'antd';
import classNames from 'classnames';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createDesignable, SchemaComponentContext, useCompile, useDesignable } from '../..';
import { useAPIClient } from '../../../api-client';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { gridRowColWrap } from '../../../schema-initializer/utils';
import { GeneralDesignerContext, GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { BlockItem } from '../block-item';
import { HTMLEncode } from '../input/shared';

export const FormItem: any = (props) => {
  const field = useField();
  return (
    <BlockItem className={'nb-form-item'}>
      <Item
        className={`${css`
          & .ant-space {
            flex-wrap: wrap;
          }
        `}`}
        {...props}
        extra={
          field.description ? (
            <div
              dangerouslySetInnerHTML={{
                __html: HTMLEncode(field.description).split('\n').join('<br/>'),
              }}
            />
          ) : null
        }
      />
    </BlockItem>
  );
};

const InsertFormItem = (props) => {
  const { eventKey, title } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { fields } = useCollection();
  const fieldSchema = useFieldSchema();
  const { getInterface } = useCollectionManager();
  const [visible, setVisible] = useState(false);
  const form = useForm();
  const { refresh } = useContext(SchemaComponentContext);
  const api = useAPIClient();

  const gridSchema = useMemo(() => {
    let parent = fieldSchema.parent;

    while (parent) {
      if (parent['x-component'] === 'Grid.Row') {
        break;
      }
      parent = parent.parent;
    }
    return parent ?? fieldSchema;
  }, []);

  const dn = useMemo(() => {
    if (!gridSchema) {
      return;
    }
    const dn = createDesignable({ t, api, refresh, current: gridSchema });
    dn.loadAPIClientEvents();
    return dn;
  }, [gridSchema]);

  const collectionFieldToggleHandler = (checked, collectionField) => {
    const interfaceConfig = getInterface(collectionField.interface);
    if (checked) {
      const schema = {
        type: 'string',
        name: collectionField.name,
        'x-designer': 'FormItem.Designer',
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
        'x-collection-field': `${collectionField.collectionName}.${collectionField.name}`,
      };
      interfaceConfig?.schemaInitialize?.(schema, {
        field: collectionField,
        block: 'Form',
        readPretty: form.readPretty,
      });
      dn.insertAfterEnd(gridRowColWrap(schema));
    } else {
      const key = 'x-collection-field';
      const action = `${collectionField.collectionName}.${collectionField.name}`;
      const schema = findSchema(dn.current.parent, key, action);
      dn.remove(schema, {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      });
    }
  };

  const addTextHandler = () => {
    const schema = {
      type: 'void',
      'x-editable': false,
      'x-decorator': 'FormItem',
      'x-designer': 'Markdown.Void.Designer',
      'x-component': 'Markdown.Void',
      'x-component-props': {
        content: t('This is a demo text, **supports Markdown syntax**.'),
      },
    };
    dn.insertAfterEnd(gridRowColWrap(schema));
  };

  const findSchema = (schema: Schema, key: string, action: string) => {
    return schema.reduceProperties((buf, s) => {
      if (s[key] === action) {
        return s;
      }
      const c = findSchema(s, key, action);
      if (c) {
        return c;
      }
      return buf;
    });
  };

  return (
    <Dropdown
      visible={visible}
      onVisibleChange={(visible) => {
        setVisible(visible);
      }}
      overlay={
        <Menu>
          <Menu.ItemGroup title={t('Display fields')}>
            {fields
              ?.filter((field) => field?.interface)
              ?.map((field) => {
                const title = compile(field.uiSchema?.['title']) || fieldSchema?.name;
                const schema = findSchema(
                  dn.current.parent,
                  'x-collection-field',
                  `${field.collectionName}.${field.name}`,
                );
                return (
                  <Menu.Item
                    key={field.key}
                    eventKey={field.key as any}
                    {...props}
                    onClick={(info) => {
                      info.domEvent.preventDefault();
                      info.domEvent.stopPropagation();
                      props?.onClick?.(info);
                    }}
                    style={{ minWidth: 120 }}
                  >
                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                      {title}
                      <Switch
                        size={'small'}
                        checked={!!schema}
                        onChange={(checked) => collectionFieldToggleHandler(checked, field)}
                        style={{ marginLeft: 32 }}
                      />
                    </div>
                  </Menu.Item>
                );
              })}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.Item onClick={addTextHandler}>{t('Add text')}</Menu.Item>
        </Menu>
      }
      overlayClassName={classNames(
        'nb-schema-initializer-button-overlay',
        css`
          .ant-dropdown-menu-item-group-list {
            max-height: 40vh;
            overflow: auto;
          }
        `,
      )}
    >
      {typeof title === 'string' ? <span>{title}</span> : title}
    </Dropdown>
  );
};

FormItem.Designer = () => {
  const { getCollectionFields } = useCollectionManager();
  const { getField } = useCollection();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn, refresh } = useDesignable();
  const compile = useCompile();
  const collectionField = getField(fieldSchema['name']);
  const originalTitle = collectionField?.uiSchema?.title;
  const targetFields = collectionField?.target ? getCollectionFields(collectionField.target) : [];
  const initialValue = {
    title: field.title === originalTitle ? undefined : field.title,
  };
  if (!field.readPretty) {
    initialValue['required'] = field.required;
  }
  const options = targetFields
    .filter((field) => !field?.target && field.type !== 'boolean')
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));
  const designerActions = useMemo(() => {
    return [<InsertFormItem title={<PlusOutlined />}></InsertFormItem>];
  }, []);
  return (
    <GeneralDesignerContext.Provider value={{ designerActions }}>
      <GeneralSchemaDesigner>
        {collectionField && (
          <SchemaSettings.ModalItem
            title={t('Edit field title')}
            schema={
              {
                type: 'object',
                title: t('Edit field title'),
                properties: {
                  title: {
                    title: t('Field title'),
                    default: field?.title,
                    description: `${t('Original field title: ')}${collectionField?.uiSchema?.title}`,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {},
                  },
                },
              } as ISchema
            }
            onSubmit={({ title }) => {
              if (title) {
                field.title = title;
                fieldSchema.title = title;
                dn.emit('patch', {
                  schema: {
                    'x-uid': fieldSchema['x-uid'],
                    title: fieldSchema.title,
                  },
                });
              }
              dn.refresh();
            }}
          />
        )}
        {!field.readPretty && (
          <SchemaSettings.ModalItem
            title={t('Edit description')}
            schema={
              {
                type: 'object',
                title: t('Edit description'),
                properties: {
                  description: {
                    // title: t('Description'),
                    default: field?.description,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input.TextArea',
                    'x-component-props': {},
                  },
                },
              } as ISchema
            }
            onSubmit={({ description }) => {
              field.description = description;
              fieldSchema.description = description;
              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  description: fieldSchema.description,
                },
              });
              dn.refresh();
            }}
          />
        )}
        {field.readPretty && (
          <SchemaSettings.ModalItem
            title={t('Edit tooltip')}
            schema={
              {
                type: 'object',
                title: t('Edit description'),
                properties: {
                  tooltip: {
                    default: fieldSchema?.['x-decorator-props']?.tooltip,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input.TextArea',
                    'x-component-props': {},
                  },
                },
              } as ISchema
            }
            onSubmit={({ tooltip }) => {
              field.decoratorProps.tooltip = tooltip;
              fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
              fieldSchema['x-decorator-props']['tooltip'] = tooltip;
              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  'x-decorator-props': fieldSchema['x-decorator-props'],
                },
              });
              dn.refresh();
            }}
          />
        )}
        {!field.readPretty && (
          <SchemaSettings.SwitchItem
            title={t('Required')}
            checked={field.required}
            onChange={(required) => {
              const schema = {
                ['x-uid']: fieldSchema['x-uid'],
              };
              field.required = required;
              fieldSchema['required'] = required;
              schema['required'] = required;
              dn.emit('patch', {
                schema,
              });
              refresh();
            }}
          />
        )}
        {collectionField?.target && (
          <SchemaSettings.SelectItem
            title={t('Title field')}
            options={options}
            value={field?.componentProps?.fieldNames?.label}
            onChange={(label) => {
              const schema = {
                ['x-uid']: fieldSchema['x-uid'],
              };
              const fieldNames = {
                ...field.componentProps.fieldNames,
                label,
              };
              fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
              fieldSchema['x-component-props']['fieldNames'] = fieldNames;
              field.componentProps.fieldNames = fieldNames;
              schema['x-component-props'] = {
                fieldNames,
              };
              dn.emit('patch', {
                schema,
              });
              dn.refresh();
            }}
          />
        )}
        {collectionField && <SchemaSettings.Divider />}
        <SchemaSettings.Remove
          removeParentsIfNoChildren
          confirm={{
            title: t('Delete field'),
          }}
          breakRemoveOn={{
            'x-component': 'Grid',
          }}
        />
      </GeneralSchemaDesigner>
    </GeneralDesignerContext.Provider>
  );
};
