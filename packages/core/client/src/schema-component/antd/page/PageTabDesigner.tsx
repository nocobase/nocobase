import { DragOutlined, MenuOutlined } from '@ant-design/icons';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { App, Space } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DragHandler, useDesignable } from '../..';
import { SchemaSettings } from '../../../schema-settings';

export const PageDesigner = ({ title }) => {
  const { dn, designable } = useDesignable();
  const { t } = useTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const hidePageTitle = fieldSchema['x-component-props']?.hidePageTitle;
  const disablePageHeader = fieldSchema['x-component-props']?.disablePageHeader;
  if (!designable) {
    return null;
  }
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <SchemaSettings
            data-testid="page-designer-button"
            title={<MenuOutlined style={{ cursor: 'pointer', fontSize: 12 }} />}
          >
            <SchemaSettings.SwitchItem
              title={t('Enable page header')}
              checked={!fieldSchema['x-component-props']?.disablePageHeader}
              onChange={(v) => {
                fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
                fieldSchema['x-component-props']['disablePageHeader'] = !v;
                dn.emit('patch', {
                  schema: {
                    ['x-uid']: fieldSchema['x-uid'],
                    ['x-component-props']: fieldSchema['x-component-props'],
                  },
                });
                dn.refresh();
              }}
            />
            {!disablePageHeader && <SchemaSettings.Divider />}
            {!disablePageHeader && (
              <SchemaSettings.SwitchItem
                title={t('Display page title')}
                checked={!fieldSchema['x-component-props']?.hidePageTitle}
                onChange={(v) => {
                  fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
                  fieldSchema['x-component-props']['hidePageTitle'] = !v;
                  dn.emit('patch', {
                    schema: {
                      ['x-uid']: fieldSchema['x-uid'],
                      ['x-component-props']: fieldSchema['x-component-props'],
                    },
                  });
                  dn.refresh();
                }}
              />
            )}
            {!disablePageHeader && !hidePageTitle && (
              <SchemaSettings.ModalItem
                hide
                title={t('Edit page title')}
                schema={
                  {
                    type: 'object',
                    title: t('Edit page title'),
                    properties: {
                      title: {
                        title: t('Title'),
                        required: true,
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        'x-component-props': {},
                      },
                    },
                  } as ISchema
                }
                initialValues={{ title }}
                onSubmit={({ title }) => {
                  field.title = title;
                  fieldSchema['title'] = title;
                  dn.emit('patch', {
                    schema: {
                      ['x-uid']: fieldSchema['x-uid'],
                      title,
                    },
                  });
                }}
              />
            )}
            {!disablePageHeader && (
              <SchemaSettings.SwitchItem
                title={t('Enable page tabs')}
                checked={fieldSchema['x-component-props']?.enablePageTabs}
                onChange={(v) => {
                  fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
                  fieldSchema['x-component-props']['enablePageTabs'] = v;
                  dn.emit('patch', {
                    schema: {
                      ['x-uid']: fieldSchema['x-uid'],
                      ['x-component-props']: fieldSchema['x-component-props'],
                    },
                  });
                  dn.refresh();
                }}
              />
            )}
          </SchemaSettings>
        </Space>
      </div>
    </div>
  );
};

export const PageTabDesigner = ({ schema }) => {
  const { dn, designable } = useDesignable();
  const { t } = useTranslation();
  const { modal } = App.useApp();

  if (!designable) {
    return null;
  }

  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <DragHandler>
            <DragOutlined />
          </DragHandler>
          <SchemaSettings title={<MenuOutlined style={{ cursor: 'pointer', fontSize: 12 }} />}>
            <SchemaSettings.ModalItem
              title={t('Edit')}
              schema={
                {
                  type: 'object',
                  title: t('Edit tab'),
                  properties: {
                    title: {
                      title: t('Tab name'),
                      required: true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {},
                    },
                    icon: {
                      title: t('Icon'),
                      'x-decorator': 'FormItem',
                      'x-component': 'IconPicker',
                      'x-component-props': {},
                    },
                  },
                } as ISchema
              }
              initialValues={{ title: schema.title, icon: schema['x-icon'] }}
              onSubmit={({ title, icon }) => {
                schema.title = title;
                schema['x-icon'] = icon;
                dn.emit('patch', {
                  schema: {
                    ['x-uid']: schema['x-uid'],
                    title,
                    'x-icon': icon,
                  },
                });
                dn.refresh();
              }}
            />
            <SchemaSettings.Divider />
            <SchemaSettings.Item
              eventKey="remove"
              onClick={() => {
                modal.confirm({
                  title: t('Delete block'),
                  content: t('Are you sure you want to delete it?'),
                  ...confirm,
                  onOk() {
                    dn.remove(schema);
                  },
                });
              }}
            >
              {t('Delete')}
            </SchemaSettings.Item>
          </SchemaSettings>
        </Space>
      </div>
    </div>
  );
};
