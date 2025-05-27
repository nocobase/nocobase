/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import React from 'react';
import { DEFAULT_BLOCKSTYLECLASS, DEFAULT_TARGETSTYLECLASS } from './constants';
import { useBlockFullscreenTranslation } from './locale';

export const FullscreenDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { t } = useBlockFullscreenTranslation();
  const { dn } = useDesignable();

  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettingsModalItem
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
              type: {
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                title: t('Button background color'),
                default: fieldSchema?.['x-component-props']?.danger
                  ? 'danger'
                  : fieldSchema?.['x-component-props']?.type === 'primary'
                    ? 'primary'
                    : 'default',
                enum: [
                  { value: 'default', label: '{{t("Default")}}' },
                  { value: 'primary', label: '{{t("Highlight")}}' },
                  { value: 'danger', label: '{{t("Danger red")}}' },
                ],
              },
            },
          } as ISchema
        }
        onSubmit={({ title, icon, type }) => {
          fieldSchema.title = title;
          field.title = title;
          field.componentProps.icon = icon;
          field.componentProps.danger = type === 'danger';
          field.componentProps.type = type;
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props'].icon = icon;
          fieldSchema['x-component-props'].danger = type === 'danger';
          fieldSchema['x-component-props'].type = type;
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
        }}
      />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
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

export function CustomFullscreen() {
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const { t } = useBlockFullscreenTranslation();
  const field = useField();
  const compile = useCompile();

  return (
    <SchemaSettingsModalItem
      title={t('Custom Full-Screen Style')}
      initialValues={{
        blockStyleClass:
          compile(fieldSchema?.['x-component-props']?.custom?.blockStyleClass) || DEFAULT_BLOCKSTYLECLASS,
        targetStyleClass:
          compile(fieldSchema?.['x-component-props']?.custom?.targetStyleClass) || DEFAULT_TARGETSTYLECLASS,
      }}
      schema={
        {
          type: 'object',
          title: t('Custom Full-Screen Style'),
          properties: {
            blockStyleClass: {
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              title: t('Style class of the current block'),
              default: fieldSchema?.['x-component-props']?.custom?.blockStyleClass ?? DEFAULT_BLOCKSTYLECLASS,
              'x-component-props': {},
            },
            targetStyleClass: {
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              title: t('Style class of the target container'),
              default:
                fieldSchema?.['x-component-props']?.custom?.targetStyleClass !== false || DEFAULT_TARGETSTYLECLASS,
              'x-component-props': {},
            },
            fullscreenStyle: {
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              title: t('Custom CSS'),
              default:
                fieldSchema?.['x-component-props']?.custom?.fullscreenStyle ||
                `// 以下是全屏模型下自定义样式的示例
// \${blockId} 和 \${targetId} 是会自动替换成当前区块和目标容器的id，
\${blockId} {
  // 这里是当前区块的样式
}
\${blockId} div {
  // 这里是当前区块下div的样式
}
\${targetId} {
  // 这里是目标容器的样式
}
\${targetId} div {
  // 这里是目标容器下div的样式
}`,
              'x-component-props': {},
            },
          },
        } as ISchema
      }
      onSubmit={({ blockStyleClass, targetStyleClass, fullscreenStyle }) => {
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].custom = {};
        fieldSchema['x-component-props'].custom.blockStyleClass = blockStyleClass;
        fieldSchema['x-component-props'].custom.targetStyleClass = targetStyleClass;
        fieldSchema['x-component-props'].custom.fullscreenStyle = fullscreenStyle;
        field.componentProps.custom = { ...fieldSchema['x-component-props']?.custom };
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
