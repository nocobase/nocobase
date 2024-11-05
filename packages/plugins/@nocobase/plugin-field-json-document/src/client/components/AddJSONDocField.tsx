/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  RecordProvider,
  SchemaComponent,
  useActionContext,
  useCollectionManager_deprecated,
  useCompile,
  useRecord,
} from '@nocobase/client';
import { useContext, useMemo, useState } from 'react';
import { useFieldInterfaceManager, useFieldInterfaceOptions } from '../field-interface-manager';
import { MenuProps, Dropdown, Button } from 'antd';
import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { useJSONDocTranslation } from '../locale';
import { ArrayTable } from '@formily/antd-v5';
import { FieldSummary } from './FieldSummary';
import { getAddFieldSchema } from './utils';
import { useForm } from '@formily/react';
import { JSONDocFieldsContext } from './JSONDocFieldsProvider';

const useCreateJSONDocField = () => {
  const form = useForm();
  const { field } = useContext(JSONDocFieldsContext);
  const ctx = useActionContext();
  return {
    run() {
      field.value = [...field.value, { ...form.values }];
      ctx.setVisible(false);
    },
  };
};

export const AddJSONDocField = (props) => {
  const { scope, getContainer, children, trigger, align, database } = props;
  const record = useRecord();
  const { getInterface } = useFieldInterfaceManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const compile = useCompile();
  const { t } = useJSONDocTranslation();
  const options = useFieldInterfaceOptions();

  const items = useMemo<MenuProps['items']>(() => {
    return options
      .map((option) => {
        if (option?.children?.length === 0) {
          return null;
        }
        return {
          type: 'group',
          label: compile(option.label),
          title: compile(option.label),
          key: option.label,
          children: option?.children.map((child) => {
            return {
              label: compile(child.title),
              title: compile(child.title),
              key: child.name,
            };
          }),
        };
      })
      .filter((v) => v?.children?.length);
  }, [options]);
  const menu = useMemo<MenuProps>(() => {
    return {
      style: {
        maxHeight: '30vh',
        overflow: 'auto',
      },
      onClick: (e) => {
        const schema = getAddFieldSchema(getInterface(e.key), compile);
        if (schema) {
          setSchema(schema);
          setVisible(true);
        }
      },
      items,
    };
  }, [getInterface, items, record]);
  return (
    <RecordProvider record={{}}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <Dropdown getPopupContainer={getContainer} trigger={trigger} align={align} menu={menu}>
          {children || (
            <Button icon={<PlusOutlined />} type={'primary'}>
              {t('Add field')}
            </Button>
          )}
        </Dropdown>
        <SchemaComponent
          schema={schema}
          distributed={false}
          components={{ ArrayTable, FieldSummary }}
          scope={{
            getContainer,
            // useCancelAction,
            createOnly: true,
            isOverride: false,
            override: false,
            useCreateJSONDocField,
            record,
            showReverseFieldConfig: true,
            // isDialect,
            disabledJSONB: false,
            createMainOnly: true,
            editMainOnly: true,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
