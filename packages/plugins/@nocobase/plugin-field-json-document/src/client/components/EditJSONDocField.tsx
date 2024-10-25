/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useState } from 'react';
import { useJSONDocTranslation } from '../locale';
import {
  ActionContextProvider,
  RecordProvider,
  SchemaComponent,
  useActionContext,
  useCompile,
  useRecord,
} from '@nocobase/client';
import { useFieldInterfaceManager } from '../field-interface-manager';
import { getEditFieldSchema } from './utils';
import { ArrayTable } from '@formily/antd-v5';
import { JSONDocFieldsContext } from './JSONDocFieldsProvider';
import { useForm } from '@formily/react';

const useEditJSONDocField = () => {
  const form = useForm();
  const record = useRecord();
  const { update } = useContext(JSONDocFieldsContext);
  const ctx = useActionContext();
  return {
    run() {
      update(record.key, { ...form.values });
      ctx.setVisible(false);
    },
  };
};

export const EditJSONDocField = (props) => {
  const { scope, getContainer, children, ...otherProps } = props;
  const { form } = useContext(JSONDocFieldsContext);
  const record = useRecord();
  const { getInterface } = useFieldInterfaceManager();
  const [visible, setVisible] = useState(false);
  const [schema, setSchema] = useState({});
  const { t } = useJSONDocTranslation();
  const compile = useCompile();

  return (
    <RecordProvider record={record}>
      <ActionContextProvider value={{ visible, setVisible }}>
        <a
          {...otherProps}
          onClick={async () => {
            const interfaceConf = getInterface(record?.interface);
            const schema = getEditFieldSchema(
              {
                ...interfaceConf,
                default: record,
              },
              form?.values?.uiSchema?.title || form?.values?.name,
              compile,
            );
            setSchema(schema);
            setVisible(true);
          }}
        >
          {children || t('Edit')}
        </a>
        <SchemaComponent
          schema={schema}
          distributed={false}
          components={{ ArrayTable }}
          scope={{
            useEditJSONDocField,
            disabledJSONB: true,
            createMainOnly: false,
            ...scope,
          }}
        />
      </ActionContextProvider>
    </RecordProvider>
  );
};
