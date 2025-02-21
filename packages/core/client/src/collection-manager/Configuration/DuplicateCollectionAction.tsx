/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd-v5';
import { FieldContext, FormContext, ISchema, useField, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button, Dropdown, MenuProps, Space } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import {
  ActionContextProvider,
  SchemaComponent,
  useActionContext,
  useAttach,
  useCompile,
} from '../../schema-component';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager_deprecated } from '../hooks';
import * as components from './components';
import { TemplateSummary } from './components/TemplateSummary';
import { createForm, Field } from '@formily/core';
import { FilterTargetKeyAlert } from 'packages/plugins/@nocobase/plugin-data-source-manager/src/client/component/CollectionsManager/FilterTargetKeyAlert';

import { css } from '@emotion/css';
import res from 'packages/plugins/@nocobase/plugin-theme-editor/src/client/antd-token-previewer/icons/Arrow';

const Title = () => {
  const { t } = useTranslation();

  return (
    <span>
      <span style={{ fontSize: '19px' }}>{t('Duplicate collection')}</span>
    </span>
  );
};

const getSchema = (compile, initialValues = {}, props): ISchema => {
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          destroyOnClose: true,
        },
        title: <Title />,
        'x-decorator': 'Form',
        'x-reactions': (field) => {
          const i = field.path.segments[1];
          const key = field.path.segments[0];
          const table = field.form.getValuesIn(`${key}.${i}`);
          if (table) {
            field.title = `${compile(table.title)} - ${compile('{{ t("Duplicate") }}')}`;
          }
        },
        properties: {
          title: {
            type: 'string',
            title: '{{ t("Collection display name") }}',
            required: true,
            //@ts-ignore
            default: initialValues?.title ?? '',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          name: {
            type: 'string',
            title: '{{t("Collection name")}}',
            required: true,
            //@ts-ignore
            default: (initialValues?.name ?? '') + '_copy',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-validator': 'uid',
            description:
              "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
          },
          inherits: {
            title: '{{t("Inherits")}}',
            type: 'hasMany',
            name: 'inherits',
            //@ts-ignore
            default: initialValues?.inherits ?? undefined,
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': {
              mode: 'multiple',
            },
            'x-disabled': '{{ !createOnly }}',
            'x-visible': '{{ enableInherits}}',
            'x-reactions': ['{{useAsyncDataSource(loadCollections, ["file"])}}'],
          },
          category: {
            title: '{{t("Categories")}}',
            type: 'hasMany',
            name: 'category',
            //@ts-ignore
            default: [],
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': {
              mode: 'multiple',
            },
            'x-reactions': ['{{useAsyncDataSource(loadCategories)}}'],
          },
          description: {
            title: '{{t("Description")}}',
            type: 'string',
            name: 'description',
            //@ts-ignore
            default: initialValues?.description ?? undefined,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: '{{ t("Cancel") }}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: () => useDuplicateCollection(null, props),
                },
              },
            },
          },
        },
      },
    },
  };
};

const useDuplicateCollection = (schema?: any, props = {}) => {
  const form = useForm();
  const { refreshCM } = useCollectionManager_deprecated();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const api = useAPIClient();
  const field = useField();
  const resource = api.resource('collections');
  return {
    async run() {
      field.data = field.data || {};
      field.data.loading = true;
      try {
        await form.submit();
        const values = cloneDeep(form.values);
        if (schema?.events?.beforeSubmit) {
          schema.events.beforeSubmit(values);
        }
        if (!values.autoCreateReverseField) {
          delete values.reverseField;
        }
        delete values.autoCreateReverseField;

        //@ts-ignore
        const originalResource = props.item.name;

        // alert(JSON.stringify({ originalResource, resource, values }));

        await resource.duplicate({
          values,
          filterByTk: originalResource,
        }),
          ctx.setVisible(false);
        await form.reset();
        field.data.loading = false;
        refresh();
        await refreshCM();
      } catch (error) {
        field.data.loading = false;
      }
    },
  };
};

export const DuplicateCollection = (props) => {
  const recordData = useRecord();
  return <DuplicateCollectionAction item={recordData} {...props} />;
};

export const DuplicateCollectionAction = (props) => {
  const { scope, getContainer, item: record, children, trigger, align } = props;
  const form = useMemo(() => createForm(), []);
  const field = useField<Field>();
  const compile = useCompile();
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  const { name, template } = useRecord();
  const { getInterface, getInheritCollections, getCollection, getTemplate } = useCollectionManager_deprecated();
  const targetTemplate = getTemplate(template);
  const { t } = useTranslation();

  const schema = getSchema(
    compile,
    {
      ...record,
    },
    props,
  );
  const [visible, setVisible] = useState(false);

  return (
    <RecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <a onClick={() => setVisible(true)}>{children || t('Duplicate')}</a>
        <SchemaComponent
          schema={schema}
          scope={{
            getContainer,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
