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
import { SchemaSettingsModalItem, useCompile, useDesignable } from '@nocobase/client';
import React from 'react';
import { DEFAULT_BLOCKSTYLECLASS, DEFAULT_TARGETSTYLECLASS, NAMESPACE } from './constants';
import { useTranslation } from 'react-i18next';

export function FullscreenActionSchemaSettings() {
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation(NAMESPACE);
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
