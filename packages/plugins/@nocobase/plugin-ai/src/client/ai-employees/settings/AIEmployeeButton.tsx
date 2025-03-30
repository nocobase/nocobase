/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import {
  SchemaSettings,
  SchemaSettingsModalItem,
  useBlockContext,
  useCollection,
  useCollectionFilterOptions,
  useCollectionRecordData,
  useSchemaSettings,
} from '@nocobase/client';
import { useT } from '../../locale';
import { avatars } from '../avatars';
import { Card, Avatar } from 'antd';
const { Meta } = Card;
import { Schema } from '@formily/react';

export const useAIEmployeeButtonVariableOptions = () => {
  const collection = useCollection();
  const t = useT();
  const fieldsOptions = useCollectionFilterOptions(collection);
  const recordData = useCollectionRecordData();
  const { name: blockType } = useBlockContext() || {};
  const fields = useMemo(() => {
    return Schema.compile(fieldsOptions, { t });
  }, [fieldsOptions]);
  return useMemo(() => {
    return [
      recordData && {
        name: 'currentRecord',
        title: t('Current record'),
        children: [...fields],
      },
      blockType === 'form' && {
        name: '$nForm',
        title: t('Current form'),
        children: [...fields],
      },
    ].filter(Boolean);
  }, [recordData, t, fields, blockType]);
};

export const aiEmployeeButtonSettings = new SchemaSettings({
  name: 'aiEmployees:button',
  items: [
    {
      name: 'edit',
      Component: () => {
        const t = useT();
        const { dn } = useSchemaSettings();
        const aiEmployee = dn.getSchemaAttribute('x-component-props.aiEmployee') || {};
        return (
          <SchemaSettingsModalItem
            scope={{ useAIEmployeeButtonVariableOptions }}
            schema={{
              type: 'object',
              title: t('Edit'),
              properties: {
                profile: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': () => (
                    <Card variant="borderless">
                      <Meta
                        avatar={aiEmployee.avatar ? <Avatar src={avatars(aiEmployee.avatar)} /> : null}
                        title={aiEmployee.nickname}
                        description={aiEmployee.bio}
                      />
                    </Card>
                  ),
                },
                message: {
                  type: 'string',
                  title: t('Message'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Variable.RawTextArea',
                  'x-component-props': {
                    scope: '{{ useAIEmployeeButtonVariableOptions }}',
                    fieldNames: {
                      value: 'name',
                      label: 'title',
                    },
                  },
                  default: dn.getSchemaAttribute('x-component-props.message'),
                },
                extraInfo: {
                  type: 'string',
                  title: t('Extra Information'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  default: dn.getSchemaAttribute('x-component-props.extraInfo'),
                },
              },
            }}
            title={t('Edit')}
            onSubmit={({ message, extraInfo }) => {
              dn.deepMerge({
                'x-uid': dn.getSchemaAttribute('x-uid'),
                'x-component-props': {
                  aiEmployee,
                  message,
                  extraInfo,
                },
              });
            }}
          />
        );
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});
