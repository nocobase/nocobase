/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDataSourceManager } from '../data-source/DataSourceManagerProvider';
import { useCollectionField } from '../collection-field/CollectionFieldProvider';
import { useColumnSchema, useCompile, useDesignable } from '../../schema-component';
import type { SchemaSettingsItemType } from '../../application';

export const fieldComponentSettingsItem: SchemaSettingsItemType = {
  name: 'fieldComponent',
  type: 'select',
  useVisible() {
    const collectionField = useCollectionField();
    const dm = useDataSourceManager();
    if (!collectionField) return false;
    const collectionInterface = dm.collectionFieldInterfaceManager.getFieldInterface(collectionField?.interface);
    return (
      Array.isArray(collectionInterface?.componentOptions) &&
      collectionInterface.componentOptions.length > 1 &&
      collectionInterface.componentOptions.filter((item) => !item.useVisible || item.useVisible()).length > 1
    );
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const collectionField = useCollectionField();
    const dm = useDataSourceManager();
    const collectionInterface = dm.collectionFieldInterfaceManager.getFieldInterface(collectionField?.interface);
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const fieldSchema = tableColumnSchema || schema;
    const { dn } = useDesignable();
    const compile = useCompile();

    const options =
      collectionInterface?.componentOptions
        ?.filter((item) => !item.useVisible || item.useVisible())
        ?.map((item) => {
          return {
            label: compile(item.label),
            value: item.value,
            useProps: item.useProps,
          };
        }) || [];
    return {
      title: t('Field component'),
      options,
      value: fieldSchema['x-component-props']?.['component'] || options[0]?.value,
      onChange(component) {
        const componentOptions = options.find((item) => item.value === component);
        const baseProps = componentOptions?.useProps?.() || {};
        const componentProps = {
          component,
          ...baseProps,
          ...(component === collectionField['uiSchema']['x-component']
            ? collectionField['uiSchema']['x-component-props']
            : {}),
        };
        _.set(fieldSchema, 'x-component-props', componentProps);
        field.componentProps = componentProps;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': componentProps,
          },
        });
      },
    };
  },
};
