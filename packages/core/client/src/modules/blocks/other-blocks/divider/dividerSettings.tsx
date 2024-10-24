/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsModalItem } from '../../../../schema-settings';

import { useDesignable } from '../../../../schema-component/hooks/useDesignable';
import { ColorPicker } from '../../../../schema-component';
import React from 'react';

export function GroupTitleEditor(props) {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();

  return (
    <SchemaSettingsModalItem
      title={t('Edit group title')}
      schema={{
        type: 'object',
        title: t('Edit group title'),
        properties: {
          children: {
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: t('Group title'),
            default: field.componentProps.children,
            'x-component-props': {},
          },
        },
      }}
      onSubmit={({ children }) => {
        field.componentProps.children = children;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].children = children;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema['x-component-props'],
            },
          },
        });
        dn.refresh();
      }}
    />
  );
}

export const dividerSettings = new SchemaSettings({
  name: 'blockSettings:divider',
  items: [
    {
      name: 'editTitle',
      type: 'item',
      Component: GroupTitleEditor,
    },
    {
      name: 'orientation',
      type: 'select',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        return {
          title: t('Title position'),
          value: field.componentProps?.orientation || 'left',
          options: [
            { label: t('Left'), value: 'left' },
            { label: t('Center'), value: 'center' },
            { label: t('Right'), value: 'right' },
          ],
          onChange: (orientation) => {
            field.componentProps = field.componentProps || {};
            field.componentProps.orientation = orientation;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['orientation'] = orientation;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
          },
        };
      },
    },
    {
      name: 'dashed',
      type: 'switch',
      useComponentProps: () => {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Dashed'),
          defaultChecked: true,
          checked: field.componentProps.dashed,
          onChange: (flag) => {
            field.componentProps.dashed = flag;
            fieldSchema['x-component-props'].dashed = flag;
            if (flag === false) {
              fieldSchema['x-component-props'].dashed = false;
            }
            dn.emit('patch', {
              schema: fieldSchema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'color',
      type: 'item',
      useComponentProps: () => {
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const field = useField();
        const fieldSchema = useFieldSchema();
        return {
          title: (
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              {t('Color')}
              <div style={{ float: 'right' }}>
                <ColorPicker
                  defaultValue={field.componentProps.color || 'rgba(0, 0, 0, 0.88)'}
                  onChange={(value) => {
                    field.componentProps = field.componentProps || {};
                    field.componentProps.color = value;
                    fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
                    fieldSchema['x-component-props'].color = value;
                    dn.emit('patch', {
                      schema: fieldSchema,
                    });
                    dn.refresh();
                  }}
                />
              </div>
            </div>
          ),
        };
      },
    },
    {
      name: 'borderColor',
      type: 'item',
      useComponentProps: () => {
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const field = useField();
        const fieldSchema = useFieldSchema();
        return {
          title: (
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              {t('Divider line color')}
              <div style={{ float: 'right' }}>
                <ColorPicker
                  defaultValue={field.componentProps.borderColor || 'rgba(5, 5, 5, 0.06)'}
                  onChange={(value) => {
                    field.componentProps = field.componentProps || {};
                    field.componentProps.borderColor = value;
                    fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
                    fieldSchema['x-component-props'].borderColor = value;
                    dn.emit('patch', {
                      schema: fieldSchema,
                    });
                    dn.refresh();
                  }}
                />
              </div>
            </div>
          ),
        };
      },
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ] as any,
});
