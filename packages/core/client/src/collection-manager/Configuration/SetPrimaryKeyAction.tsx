/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayTable } from '@formily/antd-v5';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Dropdown, MenuProps } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { useRequest } from '../../api-client';
import { CollectionFieldInterface, CollectionTemplate, useDataSourceManager } from '../../data-source';
import { ActionContextProvider, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import useDialect from '../hooks/useDialect';
import * as components from './components';
import { isPrimaryKeyCandidate, useFieldInterfaceOptions } from './interfaces';
import { ItemType } from 'antd/es/menu/interface';

const getSchema = (template: CollectionTemplate, schema: CollectionFieldInterface, values, compile) => {
  if (!schema) {
    return;
  }

  const properties = schema.getConfigureFormProperties();
  template.events?.initPrimaryKeyFiledInterface?.(properties);

  const defaults =
    schema.name === values?.interface
      ? { ...cloneDeep(schema.default), ...cloneDeep(values) }
      : cloneDeep(schema.default);
  if (!defaults.uiSchema) {
    defaults.uiSchema = {};
  }
  if (values?.uiSchema?.title) {
    defaults.uiSchema.title = values.uiSchema.title;
  }
  if (values?.field) {
    defaults.field = values.field;
  }
  if (values?.description) {
    defaults.description = values.description;
  }

  if (defaults.uiSchema?.title) {
    defaults.uiSchema.title = compile(defaults.uiSchema.title);
  } else {
    defaults.uiSchema.title = compile('{{t("ID")}}');
  }
  if (defaults.description) {
    defaults.description = compile(defaults.description ?? '');
  }

  const initialValue: any = {
    name: values?.name ?? 'id',
    ...defaults,
    primaryKey: true,
    interface: schema.name,
  };

  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          getContainer: '{{ getContainer }}',
        },
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues(options) {
            return useRequest(
              () =>
                Promise.resolve({
                  data: initialValue,
                }),
              options,
            );
          },
        },
        title: `${compile('{{ t("Set Primary Key") }}')}`,
        properties: {
          summary: {
            type: 'void',
            'x-component': 'FieldSummary',
            'x-component-props': {
              schemaKey: schema.name,
            },
          },
          // @ts-ignore
          ...properties,
          description: {
            type: 'string',
            title: '{{t("Description")}}',
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
                  useAction: '{{ useSetPrimaryKey }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

export const SetPrimaryKeyAction = (props) => {
  const { template, onSetPrimaryKey, values, scope, getContainer, trigger, align, children } = props;
  const [visible, setVisible] = useState(false);
  const [targetScope, setTargetScope] = useState();
  const [schema, setSchema] = useState({});
  const [interfaceName, setInterfaceName] = useState('');

  const dm = useDataSourceManager();
  const getInterface = useCallback(
    (name: string) => {
      return dm?.collectionFieldInterfaceManager.getFieldInterface(name);
    },
    [dm],
  );
  const getTemplate = useCallback(
    (name = 'general') => {
      return dm?.collectionTemplateManager.getCollectionTemplate(name);
    },
    [dm],
  );

  const collectionTemplate = getTemplate(template);
  const primaryKeyFilter = collectionTemplate?.events?.filterPrimaryKeyCandidate ?? (() => true);

  const compile = useCompile();
  const { isDialect } = useDialect();
  const options = useFieldInterfaceOptions().map((option) => ({
    ...option,
    children: option.children.filter(isPrimaryKeyCandidate).filter(primaryKeyFilter),
  }));

  const { availableFieldInterfaces } = collectionTemplate ?? {};
  const targetScopeMap = Object.fromEntries(
    (availableFieldInterfaces?.include ?? []).filter((x) => x.targetScope).map((x) => [x.interface, x.targetScope]),
  );

  const useSetPrimaryKey = () => {
    const form = useForm();
    const ctx = useActionContext();
    return {
      async run() {
        const fieldInterface = getInterface(interfaceName);
        onSetPrimaryKey(fieldInterface, cloneDeep(form.values));
        ctx.setVisible(false);
      },
    };
  };

  const getFieldOptions = useCallback(() => {
    const { exclude, include } = (availableFieldInterfaces || {}) as any;
    const includeFilter = () => {
      const filter = include?.map((x) => x.interface ?? x) ?? [];
      return (option) => !include?.length || filter.includes(option.name);
    };
    const excludeFilter = () => {
      const filter = exclude?.map((x) => x.interface ?? x) ?? [];
      return (option) => !exclude?.length || !filter.includes(option.name);
    };
    const hideFilter = () => (option) => !(option.hidden === true);

    return options.map((option) => ({
      ...option,
      children: (option.children ?? []).filter(hideFilter()).filter(includeFilter()).filter(excludeFilter()),
    }));
  }, [options, availableFieldInterfaces]);

  const items = useMemo<MenuProps['items']>(
    () =>
      getFieldOptions()
        .filter((option) => option?.children?.length)
        .map((option): ItemType & { title: string; children?: ItemType[] } => ({
          type: 'group',
          key: option.label,
          label: compile(option.label),
          title: compile(option.label),
          children: option?.children.map((child) => {
            return {
              key: child.name,
              label: compile(child.title),
              title: compile(child.title),
            };
          }),
        })),
    [getFieldOptions, compile],
  );

  const menu = useMemo<MenuProps>(() => {
    return {
      style: {
        maxHeight: '60vh',
        overflow: 'auto',
      },
      onClick: (e) => {
        setInterfaceName(e.key);
        const targetScope = targetScopeMap[e.key];
        targetScope && setTargetScope(targetScope);
        const schema = getSchema(collectionTemplate, getInterface(e.key), values, compile);
        if (schema) {
          setSchema(schema);
          setVisible(true);
        }
      },
      items,
    };
  }, [collectionTemplate, targetScopeMap, getInterface, values, items, compile]);

  return (
    template !== 'sql' && (
      <ActionContextProvider value={{ visible, setVisible }}>
        <Dropdown getPopupContainer={getContainer} trigger={trigger} align={align} menu={menu}>
          {children}
        </Dropdown>
        <SchemaComponent
          schema={schema}
          distributed={false}
          components={{ ...components, ArrayTable }}
          scope={{
            getContainer,
            useCancelAction,
            createOnly: true,
            isOverride: false,
            override: false,
            useSetPrimaryKey,
            showReverseFieldConfig: true,
            targetScope,
            isDialect,
            disabledJSONB: false,
            createMainOnly: true,
            editMainOnly: true,
            primaryKeyOnly: true,
            ...scope,
          }}
        />
      </ActionContextProvider>
    )
  );
};
