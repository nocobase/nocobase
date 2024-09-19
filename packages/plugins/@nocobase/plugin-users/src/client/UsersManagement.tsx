/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaComponent,
  SchemaComponentContext,
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  useSchemaComponentContext,
} from '@nocobase/client';
import React, { useEffect, useMemo } from 'react';
import { usersSchema } from './schemas/users';
import { useUsersTranslation } from './locale';
import { PasswordField } from './PasswordField';
import { App } from 'antd';
import { useForm } from '@formily/react';
import { createForm } from '@formily/core';

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { runAsync } = useDataBlockRequest();
  const { t } = useUsersTranslation();
  const collection = useCollection();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      console.log('values:', values);
      if (values[collection.filterTargetKey]) {
        await resource.update({
          values,
          filterByTk: values[collection.filterTargetKey],
        });
      } else {
        await resource.create({ values });
      }
      await runAsync();
      message.success(t('Saved successfully'));
      setVisible(false);
    },
  };
};

const useEditFormProps = () => {
  const recordData = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: recordData,
      }),
    [recordData],
  );
  return {
    form,
  };
};

export const UsersManagement: React.FC = () => {
  const { t } = useUsersTranslation();
  const scCtx = useSchemaComponentContext();
  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <SchemaComponent
        schema={usersSchema}
        scope={{ t, useCancelActionProps, useSubmitActionProps, useEditFormProps }}
        components={{ PasswordField }}
      />
    </SchemaComponentContext.Provider>
  );
};
