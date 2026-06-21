/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ActionContextProvider, SchemaComponent } from '@nocobase/client';
import { observer } from '@formily/react';
import { createDatabaseServerSchema } from './schema';
import { useCreateDatabaseServer, useCancelAction, useTestConnectionAction } from '../hooks';

export const CreateDatabaseServerAction = observer(
  (props: any) => {
    const { scope, getContainer, setOpen, handleDataServerChange } = props;
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();
    return (
      <ActionContextProvider
        value={{
          visible,
          setVisible,
        }}
      >
        <span
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setOpen(false);
            setVisible(true);
          }}
        >
          <PlusOutlined style={{ marginRight: '5px' }} /> {t('Create database server', { ns: 'collection-fdw' })}
        </span>
        <SchemaComponent
          schema={createDatabaseServerSchema}
          scope={{
            getContainer,
            useCreateDatabaseServer: () => useCreateDatabaseServer(handleDataServerChange),
            useCancelAction,
            useTestConnectionAction,
            createOnly: false,
            ...scope,
          }}
        />
      </ActionContextProvider>
    );
  },
  { displayName: 'CreateDatabaseServerAction' },
);
